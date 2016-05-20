var DataManager = require("./pkgDataManager/dataManager");
var crypto = require("crypto");
var inherits = require("util").inherits;

/**
 * class to manager all data depending on the web radio DB
 */

/**
 * @constructor
 * @param dbParam
 */
function WebRadioDataManager(dbParam){
    if(!(this instanceof WebRadioDataManager)) return(new WebRadioDataManager());
    DataManager.call(this, dbParam); //parent class constructor (super())
}
inherits(WebRadioDataManager, DataManager);

/**
 * method to get data of all channels
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getChannels = function(callback){
    this.query("SELECT * FROM Channels", [], function(err, rows, fields){
        var channels = null;
        if(!err){
            channels = [];
            for(var i=0; i<rows.length; i++){
                var data = rows[i];
                channels.push({
                    id: data['ID'],
                    name: data['name'],
                    description: data['description'],
                    path: data['pathDirectory'],
                    startWorkabilityDate: data['startWorkabilityDate']
                });
            }
        }
        callback(channels);
    });
};

/**
 * method to get the active playlists of a channel
 * 
 * @param channelId
 * @param callback
 */
WebRadioDataManager.prototype.getActivePlaylist = function(channelId, callback){
    this.query("SELECT Tracks.title AS trackTitle, Albums.title AS albumTitle, Tracks.author, Tracks.pathFile FROM Albums JOIN Tracks ON Albums.ID = Tracks.albumID JOIN Playlist ON Tracks.ID = Playlist.trackID JOIN ListPlaylists ON Playlist.ID = ListPlaylists.playlistID JOIN Channels ON ListPlaylists.channelID = Channels.ID WHERE Playlist.ID = Channels.activePlaylistID AND Channels.ID = ? ORDER BY Playlist.trackOrder", [channelId], function(err, rows, fields) {
        var playlist = null;
        if(!err){
            playlist = [];
            for(var i=0; i<rows.length; i++){
                var row = rows[i];
                playlist.push({
                    title: row['trackTitle'],
                    album: row['albumTitle'],
                    author: row['author'],
                    path: row['pathFile']
                }); 
            }
        }
        callback(playlist);
    });
};

/**
 * method to get the channels root directory path
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getChannelsRootDirectoryPath = function(callback){
    this.query("SELECT channelsRootDirectoryPath FROM SystemData", [], function(err, rows, fields){
        var path = null;
        if(!err){
            path = rows[0]['channelsRootDirectoryPath'];
        }
        callback(path);
    });
};

/**
 * method to get a channel directory path
 * 
 * @param channelId
 * @param callback
 */
WebRadioDataManager.prototype.getChannelDirectoryPath = function(channelId, callback){
    this.query("SELECT pathDirectory FROM Channels WHERE Channels.ID = ?", [channelId], function(err, rows, fields){
        var path = null;
        if(!err){
            path = rows[0]['pathDirectory'];
        }
        callback(path);
    });
};

/**
 * method to get all output audio data qualities
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getQualities = function(callback){
    this.query("SELECT * FROM BroadcastedQualities", [], function(err, rows, fields){
        var qualities = null;
        if(!err){
            qualities = [];
            for(var i=0; i<rows.length; i++){
                var row = rows[i];
                qualities.push({
                    description: row['description'],
                    bitRate: row['bitRate'],
                    sampleRate: row['sampleRate'],
                    mode: row['mode']
                });
            }
        }
        callback(qualities);
    });
};
/**
 * method to encrypt a string using AES
 * 
 * @param stringToEncrypt
 * @return encryptedString
 */
WebRadioDataManager.prototype._strToAES = function(stringToEncrypt){
    var cipher = crypto.createCipher('aes-256-cbc', this._cryptKey.getPrivateKey(), null);
    var bufferToEncrypt = new Buffer(stringToEncrypt);
    cipher.update(bufferToEncrypt, 'utf8', 'hex'); 
    var encryptedString = cipher.final('hex');
    return(encryptedString);
    
};

/**
 * method to decrypt an encrypted string using AES
 * 
 * @param encryptedStringstringToEncrypt
 * @return stringToEncrypt
 */
WebRadioDataManager.prototype._AESToStr = function(criptedString){
    var decipher = crypto.createDecipher('aes-256-cbc', this._cryptKey.getPrivateKey(), null);
    decipher.update(criptedString,'hex','utf8');
    var decryptedString = decipher.final('utf8');
    return(decryptedString);
};

/**
 * method to check user parametres
 * userData has to be compiled with email and password
 * eg. userData = {email: string, password: string};
 * it returns true if the users is being authenticated
 * 
 * @param userData
 * @param callback
 */
WebRadioDataManager.prototype.checkUser = function(userData, callback){
    this.query("SELECT ID FROM Users WHERE email = ? AND password = ?", [userData.email, this._strToAES(userData.password)], function(err, rows, fields){
        if(err || rows.length < 1) callback(false);
        callback(true);
    });
};

/**
 * method to get user id
 * userData has to be compiled with email
 * eg. userData = {email: string};
 * 
 * @param userData
 * @param callback
 */
WebRadioDataManager.prototype.getUserId = function(userData, callback){
    this.query("SELECT ID FROM Users WHERE email = ?", [userData.email], function(err, rows, fields) {
        if(err || rows.length < 0) callback(-1);
        callback(rows[0]['ID']);
    });
};

/**
 * method to get all user data
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * 
 * @param userData
 * @param callback
 */
WebRadioDataManager.prototype.getUser = function(userData, callback){
    this.query("SELECT * FROM Users WHERE email = ?", [userData.id], function(err, rows, fields) {
        if(err || rows.length < 1) callback(-1);
        
        var results = rows[0];
        userData.email = results['email'];
        userData.password = this._AESToString(results['password']);
        userData.firstName = results['firstName'];
        userData.lastName = results['lastName'];
        
        callback(userData);
    });
};

/**
 * method to check if a user has a channel permission
 * userData has to be compiled with email and password
 * eg. userData = {email: string, password: string};
 * userData has to be compiled with id
 * eg. permissionData = {id: int};
 * it returns true if users has got the specific channel permission
 * 
 * @param userData
 * @param permissionData
 * @param callback
 */
WebRadioDataManager.prototype.checkChannelPermission = function(userData, permissionData, callback){
    this.getUserId(userData.email, userData.password, function(userId){
        this.query("SELECT userID FROM ChannelMembers JOIN Roles ON ChannelMembers.roleID = Roles.ID JOIN RolesPermissions ON Roles.ID = RolesPermissions.roleID JOIN Permissions ON RolesPermissions.permissionID = Permissions.ID WHERE ChannelMembers.userID = ? AND Permissions.ID = permissionID", [userId, permissionData.id], function(err, rows, fields){
            if(err) callback(false);
            callback(rows.length > 0);
        });
    });
};

/**
 * method to check if a user has a system permission
 * userData has to be compiled with email and password
 * eg. userData = {email: string, password: string};
 * userData has to be compiled with id
 * eg. permissionData = {id: int};
 * it returns true if users has got the specific system permission
 * 
 * @param userData
 * @param permissionData
 * @param callback
 */
WebRadioDataManager.prototype.checkSystemPermission = function(userData, permissionData, callback){
    this.getUserId(userData.email, userData.password, function(userId){
        this.query("SELECT userID FROM SystemMembers JOIN Roles ON SystemMembers.roleID = Roles.ID JOIN RolesPermissions ON Roles.ID = RolesPermissions.roleID JOIN Permissions ON RolesPermissions.permissionID = Permissions.ID WHERE ChannelMembers.userID = ? AND Permissions.ID = permissionID", [userId, permissionData.id], function(err, rows, fields){
            if(err) callback(false);
            callback(rows.length > 0);
        });
    });
};

/**
 * method to add a new user
 * userData has to be compiled with email, password [, firstName, lastName]
 * eg. userData = {email: string, password: string, firstname: string, lasname:string};
 * it returns new user ID
 * 
 * @param userData
 * @param callback 
 */
WebRadioDataManager.prototype.addUser = function(userData, callback){
    if(!userData.firstName) userData.firstName = "";
    if(!userData.lastName) userData.lastName = ""; 
    
    this.query("INSERT INTO Users (email, password, firstName, lastName) VALUES(?, ?, ?, ?)", [userData.email, this._strToAES(userData.password), userData.firstName, userData.lastName], function(err, rows, fields){
        if(err) callback(-1);
        this.login(userData.email, this._strToAES(userData.password), callback);
    });
};

/**
 * method to modify an existing user
 * userData has to be compiled with email, password [, firstName, lastName]
 * eg. userData = {email: string, password: string, firstname: string, lasname:string};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param callback 
 */
WebRadioDataManager.prototype.modifyUser = function(userData, callback){
    if(!userData.firstName) userData.firstName = "";
    if(!userData.lastName) userData.lastName = ""; 
    
    this.getUserId(userData.email, userData.password, function(userId){
        this.query("UPDATE Users SET email = ?, password = ?, firstName = ?, lastName = ? WHERE ID = ?", [userData.email, this._strToAES(userData.password), userData.firstName, userData.lastName, userId], function(err, rows, fields){
            callback(err == false);
        });
    });
};

/**
 * method to remove an existing user
 * userData has to be compiled with email and password
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param callback 
 */
WebRadioDataManager.prototype.removeUser = function(userData, callback){
    this.getUserId(userData.email, userData.password, function(userId){
        this.query("DELETE FROM Users WHERE ID = ?", [userId], function(err, rows, fields){
            callback(err == false);
        });
    });
};

/**
 * method to add a new system member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * roleData  has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.addSystemMember = function(userData, roleData, callback){
    this.query("INSERT INTO SystemMembers (userID, roleID, inputDate) VALUES(?, ?, NOW())", [userData.id, roleData.id], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to modify an existing system member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * roleData  has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.modifySystemMember = function(userData, roleData, callback){
    this.query("UPDATE SystemMembers (roleID, inputDate) SET (?, NOW()) WHERE userID = ?", [roleData.id, userData.id], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to remove an existing system member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * roleData  has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.removeSystemMember = function(userData, roleData, callback){
    this.query("DELETE FROM SystemMembers WHERE userID = ? AND roleID = ?", [userData.id, roleData.id], function(err, rows, fields){ //a user can have multiple roles
        callback(err == false);
    });
};

/**
 * method to check if a user has a system role
 * userData has to be compiled with user id
 * eg. userData = {id: int};
 * it returns true if the user has a system role
 * 
 * @param userData
 * @param callback
 */
WebRadioDataManager.prototype.isSystemMember = function(userData, callback){
    this.query("SELECT roleID FROM SystemMembers WHERE userID = ?", [userData.id], function(err, rows, fields){
        if(err) callback(null);
        callback(rows.length > 0);
    });
};

/**
 * method to add a new channel member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * roleData has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param channelData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.addChannelMember = function(userData, channelData, roleData, callback){
    this.query("INSERT INTO ChannelMembers (userID, channelId, roleID, inputDate) VALUES(?, ?, ?, NOW())", [userData.id, channelData.id, roleData.id], function(err, rows, fields){
        callback(err == false);
    });
};


/**
 * method to modify an existing channel member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * roleData has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param channelData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.modifyChannelMember = function(userData, channelData, roleData, callback){
    this.query("UPDATE ChannelMembers (roleID, inputDate) SET (?, NOW()) WHERE userID = ? AND channelID = ?", [roleData.id, userData.id, channelData.id], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to modify an existing channel member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * roleData has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param channelData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.removeChannelMember = function(userData, channelData, roleData, callback){
    this.query("DELETE FROM ChannelMembers WHERE userID = ? AND channelID = ? AND roleID = ?", [userData.id, channelData.id, roleData.id], function(err, rows, fields){ //a user can have multiple roles
        callback(err == false);
    });
};

WebRadioDataManager.prototype.whichChannelsIsMember = function(userData, callback){
    
};

/**
 * method to get all roles insered into the database
 * it returns all role data
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getAllRoles = function(callback){
    this.query("SELECT * FROM Roles", null, function(err, rows, fields){
        if(err) callback(null);
        callback(rows, fields);
    });
};

/**
 * method to add a role
 * userData has to be compiled with description and systemChannelFlag
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleDescription
 * @param callback
 */
WebRadioDataManager.prototype.addRole = function(roleData, callback){
    this.query("INSERT INTO Permissions (description, systemChannel) VALUES(?, ?)", [roleData.description, roleData.systemChannelFlag], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to modify an existing role
 * userData has to be compiled with id, description and systemChannelFlag
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleData
 * @param callback
 */
 WebRadioDataManager.prototype.modifyRole = function(roleData, callback){
    this.query("UPDATE Roles SET description = ?, systemChannel = ? WHERE ID = ?", [roleData.description, roleData.systemChannelFlag, roleData.id], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to remove a role
 * userData has to be compiled withid
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.removeRole = function(roleData, callback){
    this.query("REMOVE FROM Roles WHERE ID = ?", [roleData.id], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to get all permissions insered into the database
 * it returns all permission data
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getAllPermissions = function(callback){
    this.query("SELECT * FROM Permissions", [], function(err, rows, fields){
        if(err) callback(null);
        callback(rows, fields);
    });
};

/**
 * method to add a permission
 * it returns true if it hasn't occurred in any error
 * 
 * @param description
 * @param callback
 */
WebRadioDataManager.prototype.addPermission = function(description, callback){
    this.query("INSERT INTO Permissions (description) VALUES(?)", [description], function(err, rows, fields){
        callback(err == false);
    });
};

/**
 * method to remove a permission
 * permissionData has to be compiled with permissionId
 * it returns true if it hasn't occurred in any error
 * 
 * @param permissionData
 * @param callback
 */
WebRadioDataManager.prototype.removePermission = function(permissionData, callback){
    this.query("REMOVE FROM Permissions WHERE ID = ?", [permissionData.permissionId], function(err, rows, fields){
        callback(err == false);
    });
};

module.exports = WebRadioDataManager;
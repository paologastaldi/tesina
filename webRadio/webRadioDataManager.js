var DataManager = require("./pkgDataManager/dataManager");
var crypto = require("crypto");
var path = require("path");
var inherits = require("util").inherits;
var logs = require("./logs");

/**
 * class to manager all data depending on the web radio DB
 */

const AUDIO_DIRECTORY = path.join(__dirname, "pkgWebRadioEngine", "audio");
const IMAGE_DIRECTORY = path.join(__dirname, "pkgWebsite", "img");

const CIPHER_TYPE = "aes-256-cbc";

/**
 * @constructor
 * @key
 * @param dbParam
 */
function WebRadioDataManager(dbParam, key){
    if(!(this instanceof WebRadioDataManager)) return(new WebRadioDataManager(dbParam));
    DataManager.call(this, dbParam); //parent class constructor (super())
    
    this._key = null;
    this._configData = null;
    
    if(typeof(key) !== "undefined") this.setKey(key);
}
inherits(WebRadioDataManager, DataManager);

/**
 * method to set config data
 * 
 * @param configData
 */
WebRadioDataManager.prototype.setConfigData = function(configData){
    this._configData = configData;
};

/**
 * method to get config data
 * 
 * @return configData
 */
WebRadioDataManager.prototype.getConfigData = function(){
    return(this._configData);
};

/**
 * method to set the cryto key
 * 
 * @param key
 */
WebRadioDataManager.prototype.setKey = function(key){
    if(typeof(key) === "string") this._key = key;
};

/**
 * method to get a channel from a DB row
 * 
 * @param row
 * @return channel
 */
WebRadioDataManager.prototype._rowToChannel = function(row){
    var channel = {
        id: row['ID'],
        name: row['name'],
        description: row['description'],
        thumbnail: row['thumbnail'],
        inputDate: row['inputDate'],
        startWorkabilityDate: row['startWorkabilityDate'],
        genreId: row['genreID'],
        active: row['active']
    };
    return(channel);
};

/**
 * method to get a channel id by its name
 * channelData has to be compiled with name
 * eg. channelData = {name: string};
 * it returns the channel id
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.getChannelId = function(channelData, callback){
    this.query("SELECT ID FROM Channels WHERE name = ?", [channelData.name], function(err, rows, fields){
        var channelId = -1;
        if(!err && rows.length > 0) channelId = rows[0]['ID'];
        if(typeof(callback) === "function") callback(channelId);
    });
};

/**
 * method to get a channel by its id
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.getChannel = function(channelData, callback){
    this.query("SELECT * FROM Channels WHERE ID = ?", [channelData.id], (function(err, rows, fields){
        var channel = null;
        if(!err && rows.length > 0) channel = this._rowToChannel(rows[0]);
        if(typeof(callback) === "function") callback(channel);
    }).bind(this));
};

/**
 * method to update a channel status
 * channelData has to be compiled with id, status
 * eg. channelData = {id: int, status: boolean};
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.updateChannelStatus = function(channelData, callback){
    this.query("UPDATE Channels SET active = ?, startWorkabilityDate = NOW() WHERE ID = ?", [channelData.status, channelData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to add a channel
 * it adds a default member to this new channel too
 * channelData has to be compiled with name [, description]
 * eg. channelData = {name: string, description: string};
 * genreData has to be compiled with id
 * eg. genreData = {id: int};
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * userData has to be compiled with id
 * eg. roleData = {id: int};
 * it returns new channel id
 * 
 * @param channelData
 * @param userData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.addChannel = function(channelData, genreData, userData, roleData, callback){
    this.query("INSERT INTO Channels (name, description, genreID, inputDate, active) VALUES(?, ?, ?, NOW(), TRUE)", [channelData.name, channelData.description, genreData.id], (function(err, rows, fields){
        if(!err){
            this.getChannelId(channelData, (function(channelId){ //now it gets new channel id and adds user to the channel members
                this.query("INSERT INTO ChannelMembers (userID, channelID, roleID, inputDate) VALUES (?, ?, ?, NOW())", [userData.id, channelId, roleData.id], function(err, rows, fields){ //adding creator user as administrator
                    if(typeof(callback) === "function") callback(channelId);
                });
            }).bind(this));
        }
        else if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to modify a channel
 * channelData has to be compiled with id, name, description
 * eg. channelData = {id: int, name: string, description: string};
 * genreData has to be compiled with id
 * eg. channelData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param channelData
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.modifyChannel = function(channelData, genreData, callback){
    this.query("UPDATE Channels SET name = ?, description = ?, genreID = ? WHERE ID = ?", [channelData.name, channelData.description, genreData.id, channelData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to remove a channel
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.removeChannel = function(channelData, callback){
    this.query("DELETE FROM Channels WHERE ID = ?", [channelData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to get data of all channels
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getChannels = function(callback){
    this.query("SELECT * FROM Channels", [], (function(err, rows, fields){
        var channels = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                channels.push(this._rowToChannel(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(channels);
    }).bind(this));
};

/**
 * method to change a channel thumbnail
 * channelData has to be compiled with id
 * eg channelData = {id: int}
 * 
 * @param channelData
 * @param image
 * @param callback
 */
WebRadioDataManager.prototype.modifyChannelThumbnail = function(channelData, imageData, callback){
    this.query("SELECT * FROM Channels WHERE ID = ?", [channelData.id],  (function(err, rows, fields){
        var channelData = null;
        if(rows.length > 0 && !err) channelData = this._rowToChannel(rows[0]);
        
        if(typeof(channelData.thumbnail) !== "undefined" && channelData.thumbnail){
            this.deleteFile(path.join(IMAGE_DIRECTORY, channelData.thumbnail), this._setChannelThumbnail(channelData, imageData, callback)); //file remotion
        }
        else this._setChannelThumbnail(channelData, imageData, callback);
    }).bind(this));
};
     
/**
 * method to set a channel thumbnail
 * channelData has to be compiled with id
 * eg channelData = {id: int}
 * 
 * @param channelData
 * @param image
 * @param callback
 */       
WebRadioDataManager.prototype._setChannelThumbnail = function(channelData, imageData, callback){
    this.query("UPDATE Channels SET thumbnail = ? WHERE ID = ?", [imageData.filename, channelData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to change an album thumbnail
 * albumData has to be compiled with id
 * eg albumData = {id: int}
 * 
 * @param albumData
 * @param imageData
 * @param callback
 */
WebRadioDataManager.prototype.modifyAlbumThumbnail = function(albumData, imageData, callback){
    this.query("SELECT * FROM Albums WHERE ID = ?", [albumData.id],  (function(err, rows, fields){
        var albumData = null;
        
        if(rows.length > 0 && !err) albumData = this._rowToAlbum(rows[0]);
        
        if(typeof(albumData.thumbnail) !== "undefined" && albumData.thumbnail){
            this.deleteFile(path.join(IMAGE_DIRECTORY, albumData.thumbnail), this._setAlbumThumbnail(albumData, imageData, callback)); //file remotion
        }
        else this._setAlbumThumbnail(albumData, imageData, callback);
    }).bind(this));
};

/**
 * method to set an album thumbnail
 * albumData has to be compiled with id
 * eg albumData = {id: int}
 * 
 * @param albumData
 * @param imageData
 * @param callback
 */
WebRadioDataManager.prototype._setAlbumThumbnail = function(albumData, imageData, callback){
    if(typeof(imageData) === "undefined") imageData = { filename: null };
    this.query("UPDATE Albums SET thumbnail = ? WHERE ID = ?", [imageData.filename, albumData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to change an genre thumbnail
 * genreData has to be compiled with id
 * eg genreData = {id: int}
 * 
 * @param genreData
 * @param imageData
 * @param callback
 */
WebRadioDataManager.prototype.modifyGenreThumbnail = function(genreData, imageData, callback){
    this.query("SELECT * FROM Genres WHERE ID = ?", [genreData.id],  (function(err, rows, fields){
        var genreData = null;
        
        if(rows.length > 0 && !err) genreData = this._rowToGenre(rows[0]);
        
        if(typeof(genreData.thumbnail) !== "undefined" && genreData.thumbnail){
            this.deleteFile(path.join(IMAGE_DIRECTORY, genreData.thumbnail), this._setGenreThumbnail(genreData, imageData, callback)); //file remotion
        }
        else this._setGenreThumbnail(genreData, imageData, callback);
    }).bind(this));
};

/**
 * method to set an genre thumbnail
 * genreData has to be compiled with id
 * eg genreData = {id: int}
 * 
 * @param genreData
 * @param imageData
 * @param callback
 */
WebRadioDataManager.prototype._setGenreThumbnail = function(genreData, imageData, callback){
    this.query("UPDATE Genres SET thumbnail = ? WHERE ID = ?", [imageData.filename, genreData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to get a track from a DB row
 * 
 * @param row
 * @return track
 */
WebRadioDataManager.prototype._rowToTrack = function(row){
    var track = {
        id: row['ID'],
        title: row['title'],
        albumId: row['albumID'],
        author: row['author'],
        filename: row['filename'],
        thumbnail: row['thumbnail']
    };
    return(track);
};

/**
 * method to get the active playlists of a channel
 * channelData has to be compiled with id
 * eg. channelData = { id: int };
 * 
 * @param channelId
 * @param callback
 */
WebRadioDataManager.prototype.getActivePlaylist = function(channelData, callback){
    this.query("SELECT Tracks.*, Albums.thumbnail AS thumbnail FROM Tracks JOIN Playlists ON Tracks.ID = Playlists.trackID JOIN ListPlaylists ON Playlists.playlistID = ListPlaylists.playlistID JOIN Channels ON ListPlaylists.channelID = Channels.ID JOIN Albums ON Tracks.albumID = Albums.ID WHERE Playlists.playlistID = Channels.activePlaylistID AND Channels.ID = ? ORDER BY Playlists.order", [channelData.id], (function(err, rows, fields) {
        var playlist = [];
        
        if(!err && rows.length > 0){
            for(var i=0; i < rows.length; i++){
                playlist.push(this._rowToTrack(rows[i])); 
            }
        }
        if(typeof(callback) === "function") callback(playlist);
    }).bind(this));
};

/**
 * method to get the channels root directory path
 * 
 * @deprecated
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getChannelsRootDirectoryPath = function(callback){
    this.query("SELECT channelsRootDirectoryPath FROM SystemData", [], function(err, rows, fields){
        var path = null;
        if(!err && rows.length > 0) path = rows[0]['channelsRootDirectoryPath'];
        if(typeof(callback) === "function") callback(path);
    });
};

/**
 * method to get a channel directory path
 * 
 * @deprecated
 * 
 * @param channelId
 * @param callback
 */
WebRadioDataManager.prototype.getChannelDirectoryPath = function(channelId, callback){
    this.query("SELECT pathDirectory FROM Channels WHERE Channels.ID = ?", [channelId], function(err, rows, fields){
        var path = null;
        if(!err && rows.length > 0) path = rows[0]['pathDirectory'];
        if(typeof(callback) === "function") callback(path);
    });
};

/**
 * method to get an album from a DB row
 * 
 * @param row
 * @return album
 */
WebRadioDataManager.prototype._rowToAlbum = function(row){
    var album = {
        id: row['ID'],
        title: row['title'],
        channelId: row['channelID'],
        inputDate: row['inputDate'],
        tracks: row['tracks'],
        thumbnail: row['thumbnail']
    };
    return(album);
};

/**
 * method to get all albums of a channel
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * it returns all channel albums
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.getAlbums = function(channelData, callback){
    this.query("SELECT Albums.*, COUNT(Tracks.ID) AS tracks FROM Albums LEFT JOIN Tracks ON Albums.ID = Tracks.albumID WHERE Albums.channelID = ? GROUP BY Albums.ID", [channelData.id], (function(err, rows, fields){
        var albums = [];
        if(!err) for(var i=0; i<rows.length; i++) albums.push(this._rowToAlbum(rows[i]));
        if(typeof(callback) === "function") callback(albums);
    }).bind(this));
};


/**
 * method to get an album
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * albumData has to be compiled with id
 * eg. albumData = {id: int};
 * 
 * @param channelData
 * @param albumData
 * @param callback
 */
WebRadioDataManager.prototype.getAlbum = function(channelData, albumData, callback){
    this.query("SELECT Albums.*, COUNT(*) AS tracks FROM Albums LEFT JOIN Tracks ON Albums.ID = Tracks.albumID JOIN Channels ON Albums.channelID = Channels.ID WHERE Channels.ID = ? AND Albums.ID = ?", [channelData.id, albumData.id], (function(err, rows, fields){
        var album = null;
        if(!err) album = this._rowToAlbum(rows[0]);
        if(typeof(callback) === "function") callback(album);
    }).bind(this));
};

/**
 * method to add an albums to a channel
 * albumData has to be compiled with title
 * eg. albumData = {title: string};
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param albumData
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.addAlbum = function(albumData, channelData, callback){
    this.query("INSERT INTO Albums (title, channelID, inputDate) VALUES (?, ?, NOW())", [albumData.title, channelData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to modify an albums
 * albumData has to be compiled with id, title
 * eg. albumData = {id: int, title: string};
 * it returns true if it hasn't occurred in any error
 * 
 * @param albumData
 * @param callback
 */
WebRadioDataManager.prototype.modifyAlbum = function(albumData, callback){
    this.query("UPDATE Albums SET title = ? WHERE ID = ?", [albumData.title, albumData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to remove an albums
 * albumData has to be compiled with id
 * eg. albumData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param albumData
 * @param callback
 */
WebRadioDataManager.prototype.removeAlbum = function(albumData, callback){
    this.query("DELETE FROM Albums WHERE ID = ?", [albumData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to get all album tracks
 * albumData has to be compiled with id
 * eg. albumData = {id: int};
 * it returns all album tracks
 * 
 * @param albumData
 * @param callback
 */
WebRadioDataManager.prototype.getAlbumTracks = function(albumData, callback){
    this.query("SELECT Tracks.* FROM Tracks WHERE albumID = ?", [albumData.id], (function(err, rows, fields){
        var tracks = [];
        if(!err) for(var i=0; i<rows.length; i++) tracks.push(this._rowToTrack(rows[i]));
        if(typeof(callback) === "function") callback(tracks);
    }).bind(this));
};

/**
 * method to add album tracks
 * trackData has to be compiled with file, [title, author]
 * eg. albumData = {file: string, title: string, author: string};
 * albumData has to be compiled with id
 * eg. albumData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param albumData
 * @param trackData
 * @param callback
 */
WebRadioDataManager.prototype._addAlbumTrack = function(albumData, trackData, callback){
    if(typeof(trackData.title) !== "string") trackData.title = trackData.originalname;
    if(typeof(trackData.author) !== "string") trackData.author = "";
    
    this.query("INSERT INTO Tracks (albumID, title, author, filename, inputDate) VALUES(?, ?, ?, ?, NOW())", [albumData.id, trackData.title, trackData.author, trackData.filename], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to add tracks to an album
 * tracksData is an array containing trackData objects
 * eg. tracksData = [trackData0, trackData1 ... trackDataN];
 * trackData has to be compiled with file, [title, author]
 * eg. albumData = {file: string, title: string, author: string};
 * albumData has to be compiled with id
 * eg. albumData = {id: int};
 * 
 * @param albumData
 * @param tracksData
 * @param callback
 */
WebRadioDataManager.prototype.addAlbumTracks = function(albumData, tracksData, callback){
    var index = 0;
    
    /*
     * tracksData is an array
     * if tracksDataa is not the last element in the list, it calls itself recursively until there are elements
     * 
     * (functions inherit parametres and variables from their parent function)
     */
    var tempCallback = (function(){
        if(index < tracksData.length) this._addAlbumTrack(albumData, tracksData[index++], tempCallback);
        else if(typeof(callback) === "function") callback();
    }).bind(this);
    
    tempCallback();
};

/**
 * method to modify an album track
 * trackData has to be compiled with id, [title, author]
 * eg. albumData = {id: int, title: string, author: string};
 * it returns true if it hasn't occurred in any error
 * 
 * @param trackData
 * @param callback
 */
WebRadioDataManager.prototype.modifyAlbumTrack = function(trackData, callback){
    if(typeof(trackData.title) !== "string") trackData.title = "";
    if(typeof(trackData.author) !== "string") trackData.author = "";
    
    this.query("UPDATE Tracks SET title = ?, author = ? WHERE Tracks.ID = ?", [trackData.title, trackData.author, trackData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to remove an album track
 * trackData has to be compiled with id
 * eg. trackData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param trackData
 * @param callback
 */
WebRadioDataManager.prototype.removeAlbumTrack = function(trackData, callback){
    this.getTrack(trackData, (function(trackData){
        this.query("DELETE FROM Tracks WHERE ID = ?", [trackData.id], (function(err, rows, fields){
            this.deleteFile(path.join(AUDIO_DIRECTORY, trackData.filename), (function(){ //deleting file
                if(typeof(callback) === "function") callback(!err);
            }).bind(this));
        }).bind(this));
    }).bind(this));
};

/**
 * method to get a track by its id
 * trackData has to be compiled with id
 * eg. trackData = {id: int};
 * 
 * @param trackData
 * @param callback
 */
WebRadioDataManager.prototype.getTrack = function(trackData, callback){
    this.query("SELECT * FROM Tracks WHERE ID = ?", [trackData.id], (function(err, rows, fields){
        var track = null;
        if(!err && rows.length > 0) track = this._rowToTrack(rows[0]);
        if(typeof(callback) === "function") callback(track);
    }).bind(this));
};

/**
 * method to get all channel track
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.getTracks = function(channelData, callback){
    this.query("SELECT Tracks.* FROM Tracks JOIN Albums ON Tracks.albumID = Albums.ID JOIN Channels ON Albums.channelID = Channels.ID WHERE Channels.ID = ?", [channelData.id], (function(err, rows, fields){
        var tracks = [];
        if(!err && rows.length > 0){
            for(var i=0; i< rows.length; i++){
                tracks.push(this._rowToTrack(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(tracks);
    }).bind(this));
};

/**
 * method to get a playlist from a DB row
 * 
 * @param row
 * @return playlist
 */
WebRadioDataManager.prototype._rowToPlaylist = function(row){
    var playlist = {
        id: row['playlistID'],
        name: row['name'],
        channelId: row['channelID'],
        inputDate: row['inputDate'],
        tracks: row['tracks']
    };
    return(playlist);
};

/**
 * method to get all playlists of a channel
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 *  
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.getPlaylists = function(channelData, callback){
    this.query("SELECT ListPlaylists.*, COUNT(Playlists.playlistID) AS tracks FROM ListPlaylists LEFT JOIN Playlists ON ListPlaylists.playlistID = Playlists.playlistID WHERE ListPlaylists.channelID = ? GROUP BY ListPlaylists.playlistID", [channelData.id], (function(err, rows, fields){
        var playlists = [];
        
        if(!err){
            for(var i=0; i<rows.length; i++){
                playlists.push(this._rowToPlaylist(rows[i]));
            }
        }
        
        if(typeof(callback) === "function") callback(playlists);
    }).bind(this));
};

/**
 * method to get a playlists of a channel
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * 
 * @param playlistData
 * @param callback
 */
WebRadioDataManager.prototype.getPlaylist = function(playlistData, callback){
    this.query("SELECT ListPlaylists.*, COUNT(Playlists.playlistID) AS tracks FROM ListPlaylists LEFT JOIN Playlists ON ListPlaylists.playlistID = Playlists.playlistID WHERE ListPlaylists.playlistID = ? GROUP BY ListPlaylists.playlistID", [playlistData.id], (function(err, rows, fields){
        var playlist = null;
        if(!err && rows.length > 0) playlist = this._rowToPlaylist(rows[0]);
        if(typeof(callback) === "function") callback(playlist);
    }).bind(this));
};

/**
 * method to get to add a playlist to a channel
 * playlistData has to be compiled with name
 * eg. playlistData = {name: string};
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * 
 * @param playlistData
 * @param channelData
 * @param userData
 * @param callback
 */
WebRadioDataManager.prototype.addPlaylist = function(playlistData, channelData, userData, callback){
    this.query("INSERT INTO ListPlaylists (channelID, name, creatorUserID, inputDate) VALUES (?, ?, ?, NOW())", [channelData.id, playlistData.name, userData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to get to modify a playlist of a channel
 * playlistData has to be compiled with id, name
 * eg. playlistData = {id: int, name: string};
 * 
 * @param playlistData
 * @param callback
 */
WebRadioDataManager.prototype.modifyPlaylist = function(playlistData, callback){
    this.query("UPDATE ListPlaylists SET name = ? WHERE playlistID = ?", [playlistData.name, playlistData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to get to remove a playlist of a channel
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * 
 * @param playlistData
 * @param callback
 */
WebRadioDataManager.prototype.removePlaylist = function(playlistData, callback){
    this.query("DELETE FROM ListPlaylists WHERE playlistID = ?", [playlistData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to activate a playlist on a channel
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * 
 * @param channelData
 * @param playlistData
 * @param callback
 */
WebRadioDataManager.prototype.activatePlaylist = function(channelData, playlistData, callback){
    this.query("UPDATE Channels SET activePlaylistID = ? WHERE ID = ?", [playlistData.id, channelData.id], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to get all playlist tracks
 * palylistData has to be compiled with id
 * eg. playlistData = {id: int};
 * it returns all playlist tracks
 * 
 * @param playlistData
 * @param callback
 */
WebRadioDataManager.prototype.getPlaylistTracks = function(playlistData, callback){
    this.query("SELECT Tracks.* FROM Tracks JOIN Playlists ON Tracks.ID = Playlists.trackID WHERE Playlists.playlistID = ?", [playlistData.id], (function(err, rows, fields){
        var tracks = [];
        if(!err) for(var i=0; i<rows.length; i++) tracks.push(this._rowToTrack(rows[i]));
        if(typeof(callback) === "function") callback(tracks);
    }).bind(this));
};

/**
 * method to get all not playlist tracks
 * channelData has to be compiled with id
 * eg. channelData = {id: int};
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * it returns all playlist tracks
 * 
 * @param channelData
 * @param playlistData
 * @param callback
 */
WebRadioDataManager.prototype.getNoPlaylistTracks = function(channelData, playlistData, callback){
    this.query("SELECT Tracks.* FROM Tracks LEFT JOIN Playlists ON Tracks.ID = Playlists.trackID JOIN Albums ON Tracks.albumID = Albums.ID JOIN Channels ON Albums.channelID = Channels.ID WHERE (Playlists.playlistID <> ?  OR Playlists.playlistID IS NULL) AND Channels.ID = ?", [playlistData.id, channelData.id], (function(err, rows, fields){
        var tracks = [];
        if(!err) for(var i=0; i<rows.length; i++) tracks.push(this._rowToTrack(rows[i]));
        if(typeof(callback) === "function") callback(tracks);
    }).bind(this));
};

/**
 * method to get to add a track into a playlist
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * trackData has to be compiled with id, order
 * eg. playlistData = {id: int, order: int};
 * 
 * @param playlistData
 * @param trackData
 * @param callback
 */
WebRadioDataManager.prototype._addPlaylistTrack = function(playlistData, trackData, callback){
    this.query("INSERT INTO Playlists VALUES(?, ?, ?)", [playlistData.id, trackData.order, trackData.id], function(err, rows, fields){ // adding "(playlistID, order, trackID)" it returns an error...
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to get to add tracks into a playlist
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * trackData has to be compiled with id, order
 * eg. playlistData = {id: int, order: int};
 * 
 * @param playlistData
 * @param trackData
 * @param callback
 */
WebRadioDataManager.prototype.addPlaylistTracks = function(playlistData, tracksData, callback){
    var index = 0;
    
    /*
     * if tracksData is not the last element in the list, it calls itself recursively until there are elements
     * 
     * (functions inherit parametres and variables from their parent function)
     */
    var tempCallback = (function(){
        if(index < tracksData.length) this._addPlaylistTrack(playlistData, tracksData[index++], tempCallback);
        else if(typeof(callback) === "function") callback();
    }).bind(this);
    
    tempCallback();
};

/**
 * method to modify tracks of a playlist
 * playlistData has to be compiled with id
 * eg. playlistData = {id: int};
 * tracksData is an array containing trackData. Each trackData has to be compiled with id
 * eg. tracksData = [trackData1, trackData2, ... trackDataN];
 * eg. trackData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param playlistData
 * @param trackstData
 * @param callback
 */
WebRadioDataManager.prototype.modifyPlaylistTracks = function(playlistData, tracksData, callback){
    this.query("DELETE FROM Playlists WHERE playlistID = ?", [playlistData.id], (function(err, rows, fields){
        this.addPlaylistTracks(playlistData, tracksData, callback);
    }).bind(this));
};

/**
 * method to get a quality from a DB row
 * 
 * @param row
 * @return quality
 */
WebRadioDataManager.prototype._rowToQualities = function(row){
    var quality = {
        id: row['ID'],
        description: row['description'],
        bitRate: row['bitRate'],
        sampleRate: row['sampleRate'],
        channels: row['channels'],
        mode: row['mode']
    };
    return(quality);
};

/**
 * method to get all output audio data qualities
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getQualities = function(callback){
    this.query("SELECT * FROM BroadcastedQualities", [], (function(err, rows, fields){
        var qualities = null;
        if(!err){
            qualities = [];
            for(var i=0; i < rows.length; i++){
                qualities.push(this._rowToQuality(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(qualities);
    }).bind(this));
};

WebRadioDataManager.prototype._rowToQuality = function(row){
    var quality = {
        id: row['ID'],
        description: row['description'],
        bitDepth: row['bitDepth'],
        bitRate: row['bitRate'],
        sampleRate: row['sampleRate'],
        channels: row['channels']
    };
    return(quality);
};

/**
 * method to encrypt a string using AES
 * 
 * @param stringToEncrypt
 * @return encryptedString
 */
WebRadioDataManager.prototype.strToAES = function(stringToEncrypt){
    var cipher = crypto.createCipher(CIPHER_TYPE,  this._key, null);
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
WebRadioDataManager.prototype.AESToStr = function(criptedString){
    var decipher = crypto.createDecipher(CIPHER_TYPE, this._key, null);
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
    this.query("SELECT ID FROM Users WHERE email = ? AND password = ?", [userData.email, this.strToAES(userData.password)], (function(err, rows, fields){
        var userId = -1;
        if(!err && rows.length > 0) userId = rows[0]['ID'];
       if(typeof(callback) === "function") callback(userId);
    }).bind(this));
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
        var userId = -1;
        if(!err && rows.length > 0) userId = rows[0]['ID'];
        if(typeof(callback) === "function") callback(userId);
    });
};

/**
 * method to get user data from a DB result row
 * 
 * @param row
 * @return userData
 */
WebRadioDataManager.prototype._rowToUser = function(row){
    var userData = {
        id: row['ID'],
        email: row['email'],
        password: this.AESToStr(row['password']),
        firstName: row['firstName'],
        lastName: row['lastName'],
        inputDate: row['inputDate'],
        
        //optional
        roleId: row['roleID']
    };
    return(userData);
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
    this.query("SELECT * FROM Users WHERE ID = ?", [userData.id], (function(err, rows, fields) {
        var userData = null;
        if(!err && rows.length > 0) userData = this._rowToUser(rows[0]);
        if(typeof(callback) === "function") callback(userData);
    }).bind(this));
};

/**
 * method to check if a user has a channel permission
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * userData has to be compiled with id
 * eg. permissionData = {id: int};
 * it returns true if users has got the specific channel permission
 * 
 * @param userData
 * @param permissionData
 * @param callback
 */
WebRadioDataManager.prototype.checkChannelPermission = function(userData, permissionData, callback){
    this.query("SELECT userID FROM ChannelMembers JOIN Roles ON ChannelMembers.roleID = Roles.ID JOIN RolesPermissions ON Roles.ID = RolesPermissions.roleID JOIN Permissions ON RolesPermissions.permissionID = Permissions.ID WHERE ChannelMembers.userID = ? AND Permissions.ID = ?", [userData.id, permissionData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err && rows.length > 0);
    });
};

/**
 * method to check if a user has a system permission
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * userData has to be compiled with id
 * eg. permissionData = {id: int};
 * it returns true if users has got the specific system permission
 * 
 * @param userData
 * @param permissionData
 * @param callback
 */
WebRadioDataManager.prototype.checkSystemPermission = function(userData, permissionData, callback){
    this.query("SELECT userID FROM SystemMembers JOIN Roles ON SystemMembers.roleID = Roles.ID JOIN RolesPermissions ON Roles.ID = RolesPermissions.roleID JOIN Permissions ON RolesPermissions.permissionID = Permissions.ID WHERE SystemMembers.userID = ? AND Permissions.ID = ?", [userData.id, permissionData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err && rows.length > 0);
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
    
    this.query("INSERT INTO Users (email, password, firstName, lastName, inputDate) VALUES(?, ?, ?, ?, NOW())", [userData.email, this.strToAES(userData.password), userData.firstName, userData.lastName], (function(err, rows, fields){
        if(!err) this.checkUser(userData, callback);
        else if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};

/**
 * method to modify an existing user
 * userData has to be compiled with id [, email, password , firstName, lastName]
 * eg. userData = {id: int, email: string, password: string, firstname: string, lasname:string};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param callback 
 */
WebRadioDataManager.prototype.modifyUser = function(userData, callback){
    if(!userData.firstName) userData.firstName = "";
    if(!userData.lastName) userData.lastName = ""; 
    
    this.getUserId(userData, function(userId){
        this.query("UPDATE Users SET password = ?, firstName = ?, lastName = ? WHERE ID = ?", [this.strToAES(userData.password), userData.firstName, userData.lastName, userData.id], function(err, rows, fields){
            if(typeof(callback) === "function") callback(!err);
        });
    });
};

/**
 * method to remove an existing user
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param callback 
 */
WebRadioDataManager.prototype.removeUser = function(userData, callback){
    this.query("DELETE FROM Users WHERE ID = ?", [userData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to get all system members
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getSystemMembers = function(callback){
    this.query("SELECT Users.*, SystemMembers.roleID as roleID FROM Users JOIN SystemMembers ON Users.ID = SystemMembers.userID", [], (function(err, rows, fields){
        var members = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                members.push(this._rowToUser(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(members);
    }).bind(this));
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
        if(typeof(callback) === "function") callback(!err);
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
    this.query("UPDATE SystemMembers SET roleID = ?, inputDate = NOW() WHERE userID = ?", [roleData.id, userData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to remove an existing system member
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param userData
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.removeSystemMember = function(userData, callback){
    this.query("DELETE FROM SystemMembers WHERE userID = ?", [userData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
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
        if(typeof(callback) === "function") callback(!err && rows.length > 0);
    });
};

/**
 * method to get all channel members
 * channelData has to be compiled with user id
 * eg. channelData = {id: int};
 * 
 * @param channelData
 * @param callback
 */
WebRadioDataManager.prototype.getChannelMembers = function(channelData, callback){
    this.query("SELECT Users.*, ChannelMembers.roleID AS roleID FROM Users JOIN ChannelMembers ON Users.ID = ChannelMembers.userID WHERE ChannelMembers.channelID = ?", [channelData.id], (function(err, rows, fields){
        var members = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                members.push(this._rowToUser(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(members);
    }).bind(this));
};

/**
 * method to get a genres from a DB row
 * 
 * @param row
 * @return genre
 */
WebRadioDataManager.prototype._rowToGenre = function(row){
    var genreData = {
        id: row['ID'],
        name: row['name'],
        thumbnail: row['thumbnail'],
        inputDate: row['inputDate']
    };
    return(genreData);
}

/**
 * method to get a genre id by its name
 * genreData has to be compiled with name
 * eg. genreData = {name: string};
 * it returns genre id
 * 
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.getGenreId = function(genreData, callback){
    this.query("SELECT ID FROM Genres WHERE name = ?", [genreData.name], function(err, rows, fields){
        var id = -1;
        if(!err && rows.length > 0) id = rows[0]['ID'];
        if(typeof(callback) === "function") callback(id);
    });
};
/**
 * method to get a genre data by its id
 * genreData has to be compiled with id
 * eg. genreData = {id: int};
 * it returns genre data
 * 
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.getGenre = function(genreData, callback){
    this.query("SELECT * FROM Genres WHERE ID = ?", [genreData.id], (function(err, rows, fields){
        var genreData = null;
        if(!err && rows.length > 0) genreData = this._rowToGenre(rows[0]);
        if(typeof(callback) === "function") callback(genreData);
    }).bind(this));
};

/**
 * method to add a genre
 * genreData has to be compiled with name
 * eg. genreData = {name: string};
 * it returns new genre id
 * 
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.addGenre = function(genreData, callback){
    this.query("INSERT INTO Genres (name, inputDate) VALUES (?, NOW())", [genreData.name], (function(err, rows, fields){
        this.getGenreId(genreData, callback);
    }).bind(this));
};

/**
 * method to modify a genre
 * genreData has to be compiled with id, name
 * eg. genreData = {id: int, name: string};
 * it returns true if it hasn't occurred in any error
 * 
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.modifyGenre = function(genreData, callback){
    this.query("UPDATE Genres SET name = ? WHERE ID = ?", [genreData.name, genreData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to remove a genre
 * genreData has to be compiled with id
 * eg. genreData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.removeGenre = function(genreData, callback){
    this.query("DELETE FROM Genres WHERE ID = ?", [genreData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to get all genres
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getGenres = function(callback){
    this.query("SELECT * FROM Genres", [], (function(err, rows, fields){
        var genres = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                genres.push(this._rowToGenre(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(genres);
    }).bind(this));
};

/**
 * method to get all channels relative to a genre
 * genreData has to be compiled with id
 * eg. genreData = {id: int};
 * 
 * @param genreData
 * @param callback
 */
WebRadioDataManager.prototype.getChannelsFromGenre = function(genreData, callback){
    this.query("SELECT Channels.* FROM Channels JOIN Genres ON Channels.genreId = Genres.id WHERE Genres.id = ?", [genreData.id], (function(err, rows, fields){
        var channels = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                channels.push(this._rowToChannel(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(channels);
    }).bind(this));
};

/**
 * method to get a log from a DB row
 * 
 * @param row
 * @return log
 */
WebRadioDataManager.prototype._rowToLog = function(row){
    var log = {
        id: row['ID'],
        userId: row['userID'],
        description: row['description'],
        inputDate: row['inputDate']
    };
    return(log);
};

/**
 * method to get all logs
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getLogs = function(callback){
    this.query("SELECT * FROM Logs ORDER BY ID DESC LIMIT 50", [], (function(err, rows, fields){
        var logs = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                logs.push(this._rowToLog(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(logs);
    }).bind(this));
};

/**
 * method to add a log
 * logData has to be compiled with userId, messageId [, description]
 * eg. logData = {userId: int, messageId: int, description: string};
 * it returns new log id
 * 
 * @param logData
 * @param callback
 */
WebRadioDataManager.prototype.addLog = function(logData, callback){
    if(typeof(logData.description) === "undefined") logData.description = "";
    var logDescription = logs[logData.messageId] + " - " + logData.description;
    
    this.query("INSERT INTO Logs (userID, description, inputDate) VALUES (?, ?, NOW())", [logData.userId, logDescription], (function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    }).bind(this));
};


/**
 * method to remove a log
 * logData has to be compiled with id, userId, messageId [, description]
 * eg. logData = {id: int, userId: int, description: string};
 * it returns true if it hasn't occurred in any error
 * 
 * @param logData
 * @param callback
 */
WebRadioDataManager.prototype.modifyLog = function(logData, callback){
    if(typeof(logData.description) === "undefined") logData.description = "";
    var logDescription = logs[logData.messageId] + " - " + logData.description;
    
    this.query("UPDATE Logs SET userID = ?, description = ?, inputDate = NOW() WHERE ID = ?", [logData.userId, logDescription, logData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to remove a log
 * logData has to be compiled with id
 * eg. logData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param logData
 * @param callback
 */
WebRadioDataManager.prototype.removeLog = function(logData, callback){
    this.query("DELETE FROM Logs WHERE ID = ?", [logData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
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
        if(typeof(callback) === "function") callback(!err);
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
    this.query("UPDATE ChannelMembers SET roleID = ?, inputDate= NOW() WHERE userID = ? AND channelID = ?", [roleData.id, userData.id, channelData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
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
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to add a new user
 * userData has to be compiled with id
 * eg. userData = {id: int};
 * it returns channels ID
 * 
 * @param userData
 * @param callback
 */
WebRadioDataManager.prototype.whichChannelsIsMember = function(userData, callback){
    this.query("SELECT ID FROM Channels JOIN ChannelMembers ON Channels.ID = ChannelMembers.channelID WHERE ChannelMembers.userId = ?", [userData.id], (function(err, rows, fields){ //a user can have multiple roles
        var channelsId = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                channelsId.push(this._rowToChannel(rows[i]).id);
            }
        }
        if(typeof(callback) === "function") callback(channelsId);
    }).bind(this));
};

/**
 * method to get a role from a DB row
 * 
 * @param row
 * @return role
 */
WebRadioDataManager.prototype._rowToRole = function(row){
    var role = {
        id: row['ID'],
        description: row['description']
    };
    return(role);
};

/**
 * method to get role id by its description
 * roleData has to be compiled with description and systemChannel
 * eg. roleData = {description: string, systemChannel: boolean};
 * it returns role id
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getRoleId = function(roleData, callback){
    this.query("SELECT ID FROM Roles WHERE description = ? AND systemChannel = ?", [roleData.description, roleData.systemChannel], (function(err, rows, fields){
        var roleId = -1;
        if(!err && rows.length > 0) roleId = this._rowToRole(rows[0]).id;
        if(typeof(callback) === "function") callback(roleId);
    }).bind(this));
};

/**
 * method to get all roles insered into the database
 * roleData has to be compiled with systemChannel
 * eg. roleData = {systemChannel: boolean};
 * it returns all role data
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getRoles = function(roleData, callback){
    this.query("SELECT * FROM Roles WHERE systemChannel = ?", [roleData.systemChannel], (function(err, rows, fields){
        var roles = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                roles.push(this._rowToRole(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(roles);
    }).bind(this));
};

/**
 * method to add a role and its associated permission
 * roleData has to be compiled with id
 * eg. roleData = {id: int};
 * permissionData has to be compiled with id
 * eg. permissionData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleData
 * @param permissionData
 * @param callback
 */
WebRadioDataManager.prototype._addRolePermission = function(roleData, permissionData, callback){
    this.query("INSERT INTO RolesPermissions (roleId, permissionId) VALUES(?, ?)", [roleData.id, permissionData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to add a role
 * roleData has to be compiled with description and systemChannelFlag
 * eg. roleData = {description: string, systemChannelFlag: boolean};
 * permissionsData is an array containing permissionData. Each permissionData has to be compiled with id
 * eg. permissionsData = [permissionData1, permissionData2, ... permissionDataN];
 * eg. permissionData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleData
 * @param permissionsData
 * @param callback
 */
WebRadioDataManager.prototype.addRole = function(roleData, permissionsData, callback){
    this.query("INSERT INTO Roles (description, systemChannel) VALUES(?, ?)", [roleData.description, roleData.systemChannel], (function(err, rows, fields){
        this.getRoleId(roleData, (function(roleId){
            roleData.id = roleId;
            var index = 0;
            
            /*
             * it threats permissionsData as a list
             * if permissionData is not the last element in the list, it calls itself recursively until there are elements
             * 
             * (functions inherit parametres and variables from their parent function)
             */
            var tempCallback = (function(){
                if(index < permissionsData.length) this._addRolePermission(roleData, permissionsData[index++], tempCallback);
                else if(typeof(callback) === "function") callback(!err);
            }).bind(this);
            
            tempCallback();
        }).bind(this));
    }).bind(this));
};

/**
 * method to modify an existing role
 * roleData has to be compiled with id, description and systemChannelFlag
 * eg. roleData = {id: int, description: string, systemChannelFlag: boolean};
 * permissionsData is an array containing permissionData. Each permissionData has to be compiled with id
 * eg. permissionsData = [permissionData1, permissionData2, ... permissionDataN];
 * eg. permissionData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleData
 * @param callback
 */
 WebRadioDataManager.prototype.modifyRole = function(roleData, permissionsData, callback){
    /*updating role data*/
    this.query("UPDATE Roles SET description = ?, systemChannel = ? WHERE ID = ?", [roleData.description, roleData.systemChannel, roleData.id], (function(err, rows, fields){
        
        /*it deletes all rows from the table which associates roles to permissions and then it fills rows again*/
        this.query("DELETE FROM RolesPermissions WHERE roleID = ?", [roleData.id], (function(err, rows, fields){
            var index = 0;
            
            /*
            it threats permissionsData as a list
            if permissionData is not the last element in the list, it calls itself recursively until there are elements
            
            (functions inherit parametres and variables from their parent function)
             */
            var tempCallback = (function(){
                if(index < permissionsData.length) this._addRolePermission(roleData, permissionsData[index++], tempCallback);
                else if(typeof(callback) === "function") callback(!err);
            }).bind(this);
            
            tempCallback();
        }).bind(this));
    }).bind(this));
};

/**
 * method to remove a role
 * roleData has to be compiled with id
 * eg. roleData = {id: int};
 * it returns true if it hasn't occurred in any error
 * 
 * @param roleData
 * @param callback
 */
WebRadioDataManager.prototype.removeRole = function(roleData, callback){
    this.query("DELETE FROM Roles WHERE ID = ?", [roleData.id], function(err, rows, fields){
        if(typeof(callback) === "function") callback(!err);
    });
};

/**
 * method to get a permission from a DB row
 * 
 * @param row
 * @return permission
 */
WebRadioDataManager.prototype._rowToPermission = function(row){
    var permission = {
        id: row['ID'],
        description: row['description']
    };
    return(permission);
};

/**
 * method to get permission id by its description
 * permissionData has to be compiled with description
 * eg. permissionData = {description: string};
 * it returns permission id
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getPermissionId = function(permissionData, callback){
    this.query("SELECT ID FROM Permissions WHERE description = ?", [permissionData.description], (function(err, rows, fields){
        var permissionId = -1;
        if(!err && rows.length > 0) permissionId = this._rowToPermission(rows[0]).id;
        if(typeof(callback) === "function") callback(permissionId);
    }).bind(this));
};

/**
 * method to get all permissions insered into the database
 * it returns all permission data
 * 
 * @param callback
 */
WebRadioDataManager.prototype.getPermissions = function(callback){
    this.query("SELECT * FROM Permissions", [], (function(err, rows, fields){
        var permissions = [];
        if(!err){
            for(var i=0; i < rows.length; i++){
                permissions.push(this._rowToPermission(rows[i]));
            }
        }
        if(typeof(callback) === "function") callback(permissions);
    }).bind(this));
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
        if(typeof(callback) === "function") callback(!err);
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
        if(typeof(callback) === "function") callback(!err);
    });
};

module.exports = WebRadioDataManager;
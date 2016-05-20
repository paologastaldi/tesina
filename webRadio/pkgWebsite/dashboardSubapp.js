var Subapp = require("./subapp");
var inherits = require("util").inherits;
var multer = require("multer");
var path = require("path");

/**
 * generic dashboard subapp
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function DashboardSubapp(dataManager, channelManager){
    if(!(this instanceof DashboardSubapp)) return(new DashboardSubapp(dataManager, channelManager));
    Subapp.call(this, dataManager, channelManager);
    
    this._permissions = null;
    this._roles = null;
    this._audioUploader = null;
    this._imageUploader = null;
    this._errors = null;
    
    this._audioUploader = multer({ dest: path.join(__dirname, "./../pkgWebRadioEngine/audio/") });
    this._imageUploader = multer({ dest: path.join(__dirname, "img/") });
    
    this._errors = [];
    
    /*this._updatePermissions();
    this._updateRoles();*/
}
inherits(DashboardSubapp, Subapp);

/**
 * method to get all errors
 * 
 * @return errors
 */
DashboardSubapp.prototype._getErrors = function(){
    var returnedErrors = this._errors;
    this._errors = []; //reset array
    return(returnedErrors);
};

/**
 * method to update permissions
 * 
 * @deprecated
 * 
 * @param callback
 */
DashboardSubapp.prototype._updatePermissions = function(callback){
    this._dataManager.getPermissions((function(permissions){
        this._permissions = permissions;
        if(typeof(callback) === "function") callback();
    }).bind(this));
};

/**
 * method to update roles
 * 
 * @deprecated
 * 
 * @param callback
 */
DashboardSubapp.prototype._updateRoles = function(callback){
    this._dataManager.getRoles((function(roles){
        this._roles = roles;
        if(typeof(callback) === "function") callback();
    }).bind(this));
};

/**
 * method to get a permission id by its description
 * 
 * @deprecated
 * 
 * @param description
 * return permissionId
 */
DashboardSubapp.prototype._getPermissionId = function(description){
    var id = 0;
    var i = 0;
    if(typeof(description) === "string"){
        while(i < this._permissions.length && !id){
            if(this._permissions[i].description.trim() === description.trim()) id = this._permissions[i].id;
            i++;
        }
    }
    return(id);
};

/**
 * method to get a role id by its description
 * 
 * @deprecated
 * 
 * @param description
 * return permissionId
 */
DashboardSubapp.prototype._getRoleId = function(description){
    var id = 0;
    var i = 0;
    if(typeof(description) === "string"){
        while(i < this._roles.length &&  !id){
            if(this._roles[i].description.trim() === description.trim()) id = this._roles[i].id;
            i++;
        }
    }
    return(id);
};


/**
 * method to get permissions
 * 
 * @deprecated
 * 
 * return permissions
 */
DashboardSubapp.prototype._getPermissions = function(){
    return(this._permissions);
};

/**
 * method to get roles
 * 
 * @deprecated
 * 
 * return permissionId
 */
DashboardSubapp.prototype._getRoles = function(){
    return(this._roles);
};

module.exports = DashboardSubapp;
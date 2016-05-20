var express = require("express");
var ChannelManager = require("./../pkgWebRadioEngine/channelManager").ChannelManager;
var DataManager = require("./../webRadioDataManager");

/**
 * generic subapp
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function Subapp(dataManager, channelManager){
    if(!(this instanceof Subapp)) return(new Subapp(dataManager, channelManager));
    
    this._app = null;
    this._dataManager = null;
    this._channelManager = null;
    
    if(!(dataManager instanceof DataManager)) throw new Error("Unset dataManager");
    if(!(channelManager instanceof ChannelManager)) throw new Error("Unset channelManager");
    
    this._dataManager = dataManager;
    this._channelManager = channelManager;
    this._app = new express.Router();
}

/**
 * method to get the express route app
 * 
 * @return app
 */
Subapp.prototype.getApp = function(){
    return(this._app);
};

module.exports = Subapp;


    
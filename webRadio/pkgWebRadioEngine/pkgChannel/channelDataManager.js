var DataManager = require("./../../webRadioDataManager");
var EventEmitter = require("events");
var inherits = require("util").inherits;
var path = require("path");

/**
 * Gastaldi Paolo
 * 17/03/2016
 * 
 * class to manage channel data
 * this class implements specific methods to get or modify all data of a identified channel 
 */
 
 const AUDIO_DIRECTORY = path.join(__dirname, "../audio");

/**
 * @constructor
 * @param channelId
 * @param dataManager
 */
function ChannelDataManager(channelId, dataManager){
    if(!(this instanceof ChannelDataManager)) return(new ChannelDataManager(channelId, dataManager));
    EventEmitter.call(this);
    
    this._channelId = 0;
    this._dataManager = null;
    this._dataPath = null;
    
    if(typeof(channelId) !== "number") throw new Error("Unset id"); //id is necessary
    if((typeof(dataManager) !== "object") || !(dataManager instanceof DataManager)) throw new Error("Unset dataManager"); //it is needed for DB access
    this._channelId = channelId;
    this._dataManager = dataManager;
    
    /*this._dataManager.getDataPath((function(dataPath){
        this._dataPath = dataPath;  
        this.emit("ready");
    }).bind(this));*/
    
    this._dataPath = AUDIO_DIRECTORY;
    this.emit("ready");
}
inherits(ChannelDataManager, EventEmitter);

/**
 * method to get all tracks data into the active playlist
 * 
 * @param callback
 */
ChannelDataManager.prototype.getPlaylist = function(callback){
    this._dataManager.getActivePlaylist({
            id: this._channelId
        }, (function(playlist){
            
        if(playlist && playlist.length > 0){
            for(var i=0; i<playlist.length; i++){
                playlist[i].filename = path.join(this._dataPath, playlist[i].filename);
            }
            callback(playlist);
        }
        else{ //else it gets all channel tracks and it considers it a playlist
            this._dataManager.getTracks({
                id: this._channelId
            }, (function(playlist){
                for(var i=0; i<playlist.length; i++){
                    playlist[i].filename = path.join(this._dataPath, playlist[i].filename);
                }
                callback(playlist);
            }).bind(this));
        }
    }).bind(this));
};

/**
 * method to create a read stream
 * wrapper method
 * 
 * @return readStream
 */
ChannelDataManager.prototype.createReadStream = function(pathFile){
    return(this._dataManager.createReadStream(pathFile));
};

/**
 * method to get all quality diffused
 * wrapper method
 * 
 * @param callback
 */
ChannelDataManager.prototype.getQualities = function(callback){
    this._dataManager.getQualities(callback);
};

module.exports = ChannelDataManager;
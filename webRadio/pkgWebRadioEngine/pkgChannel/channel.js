var EventEmitter = require("events");
var inherits = require("util").inherits;
var ChannelDataManager = require("./channelDataManager");
var PlaylistManager = require("./playlistManager");
var Loader = require("./loader");
var Mixer = require("./mixer");
var Speaker = require("./speaker");
var audioSettings = require("./audioSettings");
var DataManager = require("./../../webRadioDataManager");

/**
 * Gastaldi Paolo
 * 17/03/2016
 * 
 * channel server
 * now it implements LAME. It should implements Aurora.js framework in future, to manage metadata too 
 * it doesn't start automatically to stream audio - you have to call the "start()" method
 */

const STATUS = {
    INIT: "starting",
    READY: "ready",
    START: "running",
    STOP: "stopped",
    RESET: "resetting"
};
const DEFAULT_MAX_LISTENERS = 10;

/**
 * @constructor
 * @param id
 * @param dataManager
 * @param maxListeners
 */
function Channel(id, dataManager, maxListeners){
    if (!(this instanceof Channel)) return(new Channel(id, dataManager, maxListeners));
    EventEmitter.call(this);
    
    this._id = 0;
    this._metadata = null;
    this._dataManager = null;
    this._channelDataManager = null;
    this._loaders = null;
    this._mixer = null;
    this._mixerInputs = null;
    this._speaker = null;
    this._status = null;
    
    if((typeof(id) !== "number")) throw new Error("Unset id");
    if((typeof(dataManager) !== "object") || !(dataManager instanceof DataManager)) throw new Error("Unset dataManager"); //it is needed for DB access
    if(typeof(maxListeners) !== "number") maxListeners = DEFAULT_MAX_LISTENERS;
    this._id = id;
    this._dataManager = dataManager;
    this.setMaxListeners(maxListeners); //every event emitter can be listened from a maximum number of clients
    
    this._init();
    this._updateStatus(STATUS.INIT);
}
inherits(Channel, EventEmitter);

/**
 * method to initialize channel
 */
Channel.prototype._init = function(){
    this._loaders = []; //it can have multiple input (still to implement...)
    
    this._mixer = new Mixer({
        channels: audioSettings.DEFAULT_CHANNELS,
		bitDepth: audioSettings.DEFAULT_BIT_DEPTH,
		sampleRate: audioSettings.DEFAULT_SAMPLE_RATE
    });
    this._mixer.on("error", (function(err){
        this.emit("error", err);
    }).bind(this));
    this._mixerInputs = [];
    
    this._channelDataManager = new ChannelDataManager(this._id, this._dataManager);
    this._channelDataManager.getPlaylist((function(playlist){ //it charges all DB data before loaders and speaker creation
        var playlistManager = new PlaylistManager(playlist, this._channelDataManager);
        var loader = new Loader({
            bitRate: audioSettings.DEFAULT_BIT_RATE,
            sampleRate: audioSettings.DEFAULT_SAMPLE_RATE
        }, playlistManager);
        
        var mixerInput = this._mixer.addInput();
        loader.on("data", (function(data){
            mixerInput.write(data);
        }).bind(this));
        loader.on("metadata", (function(metadata){ //when the streamed song changes it is communicated outside with metadata
            this._metadata = metadata;
            this.emit("metadata", metadata);
            
            console.log("Playing  " + metadata.title);
        }).bind(this));
        loader.on("error", (function(err){
            this.emit("error", err);
        }).bind(this));
        
        this._loaders.push(loader);
        this._mixerInputs.push(mixerInput);
        
        this._channelDataManager.getQualities((function(qualities){
            this._speaker = new Speaker({
                channels: audioSettings.DEFAULT_CHANNELS,
                bitDepth: audioSettings.DEFAULT_BIT_DEPTH,
                sampleRate: audioSettings.DEFAULT_SAMPLE_RATE
            }, qualities);
            
            this._speaker.on("data", (function(item){
                this.emit(item.quality, item.data); //you can listen to this data with .on(selectedQuality, function(data))
            }).bind(this));
            this._speaker.on("error", (function(err){
                this.emit("error", err);
            }).bind(this));
            
            this._mixer.on("data", (function(data){
                this._speaker.write(data);
            }).bind(this));
            
            this._updateStatus(STATUS.READY); //only when all asynchronous functions have been executed it emits it's ready
            console.log("Channel ready");
        }).bind(this));
    }).bind(this));//IMPORTANT: it doesn't yet manage multiple input. It should be syncronized with metadata.duration
};

/**
 * method to start audio stream
 */
Channel.prototype.start = function(){
    for(var i=0; i<this._loaders.length; i++){
        this._loaders[i].start();
    }
    this._updateStatus(STATUS.START);
    console.log("Channel started");
};

/**
 * method to stop audio stream
 */
Channel.prototype.stop = function(){
    for(var i=0; i<this._loaders.length; i++){
        this._loaders[i].stop();
    }
    this._updateStatus(STATUS.STOP);
    console.log("Channel stopped");
};

/**
 * method to reset this channel
 */
Channel.prototype.reset = function(){
    var oldStatus = this.getStatus();
    
    if(this._loaders){
        for(var i=0; i<this._loaders.length; i++){
            this._loaders[i].removeAllListeners();
        }
    }
    if(this._mixer) this._mixer.removeAllListeners();
    if(this._speaker) this._speaker.removeAllListeners();
    
    this._init();
    
    if(oldStatus === STATUS.START){ //it inherits the old channel status
        this.once(STATUS.READY, function(){
            this.start(); //it restarts automatically
        });
    }
    
    this._updateStatus(STATUS.RESET);
    console.log("Channel resetted");
};

/**
 * method to update channel status
 * 
 * @param status
 */
Channel.prototype._updateStatus = function(status){
    this._status = status;
    this.emit(status);
};

/**
 * method to get all diffused qualities
 * 
 * @return qualities
 */
Channel.prototype.getQualities = function(){
    return(this._speaker.getQualities());
};

/**
 * method to get current metadata
 * 
 * @return metadata
 */
Channel.prototype.getMetadata = function(){
    return(this._metadata);
};

/**
 * method to get current status
 * 
 * @return status
 */
Channel.prototype.getStatus = function(){
    return(this._status);
};

module.exports = {
    Channel,
    STATUS
};
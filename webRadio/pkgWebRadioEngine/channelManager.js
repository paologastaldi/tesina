var DataManager = require("./../webRadioDataManager");
var Channel = require("./pkgChannel/channel").Channel;
var ChannelStatus = require("./pkgChannel/channel").STATUS;
var EventEmitter = require("events");
var inherits = require("util").inherits;

/**
 * Gastaldi Paolo
 * 17/03/2016
 * 
 * class to manager channel servers
 */

/**
 * @constructor
 * @param dataManager
 */
function ChannelManager(dataManager){
    if(!(this instanceof ChannelManager)) return(new ChannelManager(dataManager));
    EventEmitter.call(this);
    
    this._channels = null;
    this._dataManager = null;
    this._queryManager = null;
    
    if(!(dataManager instanceof DataManager)) throw new Error("Unset dataManager");
    
    this._dataManager = dataManager;
    this._channels = [];
    this._dataManager.getChannels((function(channels){
        if(channels){
            for(var i=0; i<channels.length; i++){
                this.addChannel(channels[i]);
            }
            this.emit("ready");
        }
    }).bind(this)); //it is needed to define the object that the callback referes to
}
inherits(ChannelManager, EventEmitter);

/**
 * method to add a channel
 * channelData has to be compiled with id, [other params]
 * eg. channelData = { id: int ... }
 * 
 * @param channelData
 */
ChannelManager.prototype.addChannel = function(channelData){
    var channel = {
        data: channelData,
        server: new Channel(channelData.id, this._dataManager)
    };
    
    if(typeof(channel.data.active) !== "undefined" && channel.data.active){ //activation of the active channels
        channel.server.once(ChannelStatus.READY, function(){
            channel.server.start();
        });
    }
    
    channel.server.on("error", (function(err){
        console.log("CHANNEL FATAL ERROR: " + err); //manteined
        this.reset();
    }).bind(channel.server));
    this._channels.push(channel);
};


/**
 * method to remove a channel
 * channelData has to be compiled with id
 * eg. channelData = { id: int }
 * 
 * @param channelData
 */
ChannelManager.prototype.removeChannel = function(channelData){
    var index = this._channels.indexOf(this.getChannel(channelData.id)); //it gets the channel index into the array
    if (index >= 0) this._channels.splice(index, 1); //it removes 1 item from that index
};

/**
 * method to get a channel by id
 * 
 * @param channelId
 * @return channel
 */
ChannelManager.prototype.getChannel = function(channelId){
    var selectedChannel = null;
    
    if(typeof(channelId) !== "undefined" && channelId >= 0){
        var i = 0;
        
        while(this._channels.length > i && !selectedChannel){
            if(this._channels[i].data.id == channelId){
                selectedChannel = this._channels[i];
            }
            i++;
        }
    }
    return(selectedChannel); //it returns all data (id, name, server)
};

/**
 * method to get a channel id by name
 * 
 * @param channelName
 * @return channelId
 */
ChannelManager.prototype.getChannelId = function(channelName){
    var selectedChannelId = -1;
    
    if(!channelName && typeof(channelName) === "string"){
        var i = 0;
        while(this._channels.length > i++ && selectedChannelId === -1){
            if(this._channels[i].name === channelName){
                selectedChannelId = this._channels[i].id;
            }
        }
    }
    return(selectedChannelId);
};

/**
 * method to get all channel servers
 * 
 * @return channels
 */
ChannelManager.prototype.getChannels = function(){
    return(this._channels);
};

/**
 * method to reset a channel server
 * channelData has to be compiled with id
 * eg. channelData = { id: int }
 * 
 * @param channelData
 */
ChannelManager.prototype.resetChannel = function(channelData){
    var channel = this.getChannel(channelData.id);
    if(channel){
        channel.server.removeAllListeners();
        this.removeChannel(channelData);
        this.addChannel(channelData);
    }
};

module.exports = {
    ChannelManager,
    ChannelStatus
};
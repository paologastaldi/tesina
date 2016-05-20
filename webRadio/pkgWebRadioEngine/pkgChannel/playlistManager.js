var ChannelDataManager = require("./channelDataManager");
var EventEmitter = require("events");
var inherits = require("util").inherits;

/**
 * Gastaldi Paolo
 * 17/03/2016
 * 
 * class to manage a channel playlist
 * it could manage commercial advertisements too (this feature has to be still implemented)
 */

module.exports = PlaylistManager;

var MAX_LOOP = 5;

/**
 * @constructor
 * @param playlist
 * @param channelDataManager
 */
function PlaylistManager(playlist, channelDataManager){
    if(!(this instanceof PlaylistManager)) return(new PlaylistManager(playlist, channelDataManager));
    EventEmitter.call(this);
    
    this._channelDataManager = null;
    this._playlist = null;
    this._playlistIndex = 0;
    
    if((typeof(playlist) !== "object")) throw new Error("Unset playlist"); //array is considered object
    if((typeof(channelDataManager) !== "object") || !(channelDataManager instanceof ChannelDataManager)) throw new Error("Unset channelDataManager");
    this._playlist = playlist;
    this._channelDataManager = channelDataManager;
}
inherits(PlaylistManager, EventEmitter);

/**
 * method to get a stream of the next track
 * 
 * @param avoidLoopIndex
 * @return readStream
 */
PlaylistManager.prototype.getNextTrackStream = function(avoidLoopIndex){
    var track = this._playlist[this._playlistIndex++];
    var trackPath = null;
    
    if(typeof(track) !== "undefined") trackPath = track.filename;
    
    if(this._playlistIndex >= this._playlist.length) this._playlistIndex = 0; //it restarts the playlist
    var readStream = this._channelDataManager.createReadStream(trackPath);
    
    if(typeof(avoidLoopIndex) !== "number") avoidLoopIndex = 0;
    if(avoidLoopIndex > MAX_LOOP) this.emit("error", "Files not found");
    else if(!readStream) readStream = this.getNextTrackStream(++avoidLoopIndex); //recursive function
    
    this.emit("metadata", track);
    return(readStream);
};

/**
 * method to get current track order into the playlist
 * index starts from 1
 * if it returns 0, playlist doesn't started yet
 * 
 * @return trackOrder
 */
PlaylistManager.prototype.getCurrentTrackOrder = function(){
    return(this._playlistIndex + 1);
};
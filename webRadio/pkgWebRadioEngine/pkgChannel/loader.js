var EventEmitter = require("events");
var inherits = require("util").inherits;
var DestroyStream = require("./destroyStream");
var PlaylistManager = require("./playlistManager");
var Decoder = require("lame").Decoder;
var Encoder = require("lame").Encoder;
var audioSettings = require("./audioSettings");
var Throttle = require("throttle");

/**
 * Gastaldi Paolo
 * 16/03/2016
 * 
 * class to load audio file and time the PCM audio output stream
 * it manages playlist track order and audio format
 * it diffuses an audio stream which you can listen to with on("data", function(data){ })
 */

/**
 * @constructor
 * @param outputFormat
 * @param playlistManager
 */
function Loader(outputFormat, playlistManager){
    if (!(this instanceof Loader)) return(new Loader(outputFormat, playlistManager));
    EventEmitter.call(this);
    
    this._playlistManager = null;
    this._readStream = null;
    this._preDecoder = null;
    this._sync = null;
    this._preEncoder = null;
    this._destroyStream = null;
    this._outputFormat = null;
    
    if(typeof(outputFormat) === "undefined") outputFormat = audioSettings.DEFAULT_FORMAT;
    if((typeof(playlistManager) !== "object") || !(playlistManager instanceof PlaylistManager)) throw new Error("Unset playlistManager");
    
    this._outputFormat = outputFormat;
    this._playlistManager = playlistManager;
    this._playlistManager.on("metadata", (function(metadata){
        this.emit("metadata", metadata);
    }).bind(this));
    this._playlistManager.on("error", (function(err){
        this.emit("error", err);
    }).bind(this));
    
    //IMPORTANT: it doesn't start streaming automatically - you have to call the method start()
}
inherits(Loader, EventEmitter);

/**
 * method to initialize a read stream
 */
Loader.prototype._createReadStream = function(){
    this._readStream = this._playlistManager.getNextTrackStream();
      
    if(this._readStream){ //error management already setted
        this._preDecoder = new Decoder();
        this._readStream.pipe(this._preDecoder);
        
        this._preDecoder.on("format", (function(format){
            var bytePerSecond = format.sampleRate * format.channels * (format.bitDepth/8);
            this._sync = new Throttle({
                bps: bytePerSecond,
                chunkSize: bytePerSecond
            });
            this._preDecoder.pipe(this._sync);
            
            this._preEncoder = new Encoder({ //unknown input format, common output format
                //input
                channels: format.channels,
                bitDepth: format.bitDepth,
                sampleRate: format.sampleRate,
                
                // output
                bitRate: (this._outputFormat.bitRate ? this._outputFormat.bitRate : audioSettings.DEFAULT_BIT_RATE), //params check
                outSampleRate: (this._outputFormat.sampleRate ? this._outputFormat.sampleRate : audioSettings.DEFAULT_SAMPLE_RATE),
                mode: (this._outputFormat.mode ? this._outputFormat.mode : audioSettings.DEFAULT_MODE)
            });
            this._sync.pipe(this._preEncoder);
            
            this._preEncoder.on("data", (function(data){
               this.emit("data", data);
            }).bind(this));
            this._preEncoder.on("end", (function(){ //I create a new stream only when the preEncoder has finished to computer its data
                this._createReadStream();
            }).bind(this));
            
            this._destroyStream = new DestroyStream(); //it doesn't need stream data anymore
            this._preEncoder.pipe(this._destroyStream);
        }).bind(this));
    }
};

/**
 * method to start audio stream
 */
Loader.prototype.start = function(){
    if(this._sync) this._sync.start();
    else this._createReadStream();
};

/**
 * method to stop audio stream (no destroy)
 * wrapper method
 */
Loader.prototype.stop = function(){
    if(this._sync) this._sync.stop();
};

module.exports = Loader;
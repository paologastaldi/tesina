var Encoder = require("lame").Encoder;
var EventEmitter = require("events");
var inherits = require("util").inherits;
var DestroyStream = require("./destroyStream");

/**
 * Gastaldi Paolo
 * 25/03/2016
 * 
 * class to emit encoded audio data and its quality
 * it manages stream destroying too
 */

/**
 * @constructor
 * @param format
 */
function SpeakerEncoder(format){
    if(!(this instanceof SpeakerEncoder)) return(new SpeakerEncoder(format));
    EventEmitter.call(this);
    
    this._encoder = null;
    this._destroyStream = null;
    this._quality = 0;
    
    if(typeof(format) !== "object") throw new Error("Unset format");
    
    this._encoder = new Encoder(format);
    
    this._destroyStream = new DestroyStream();
    this._encoder.pipe(this._destroyStream); //it has to destroy every encoder stream to free encoder buffer
    
    this._quality = format.bitRate; //this data rapresents the encoder
    this._encoder.on("data", (function(data){
        this.emit("data", {
            data: data,
            quality: this._quality
        });
    }).bind(this));
    this._encoder.on("error", (function(err){
        this.emit("error", err);
    }).bind(this));
    this._destroyStream.on("error", (function(err){
        this.emit("error", err);
    }).bind(this));
}
inherits(SpeakerEncoder, EventEmitter);

/**
 * method to write data into the encoder buffer
 * wrapper method
 * 
 * @param data
 */
SpeakerEncoder.prototype.write = function(data){
    this._encoder.write(data);
};

module.exports = SpeakerEncoder;
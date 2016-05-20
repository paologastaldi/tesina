var EventEmitter = require("events");
var inherits = require("util").inherits;
var Encoder = require("./speakerEncoder");
var audioSettings = require("./audioSettings");

/**
 * Gastaldi Paolo
 * 16/03/2016
 * 
 * class to share audio stream encoded audio data in different qualities
 */

/**
 * @constructor
 * 
 * @param inputFormat
 * @param qualities
 */
function Speaker(inputFormat, qualities){
    if(!(this instanceof Speaker)) return(new Speaker(inputFormat, qualities));
    EventEmitter.call(this);
    
    this._encoders = null;
    
    if(typeof(inputFormat) !== "object") inputFormat = audioSettings.DEFAULT_FORMAT;
    if(typeof(qualities) !== "object") qualities = audioSettings.DEFAULT_FORMAT;
    
    this._encoders = [];
        
    for(var i=0; i<qualities.length; i++){ //for every quality I create a new encoder
        var quality = qualities[i];
        
        var encoder = new Encoder({
            //input
            channels: (inputFormat.channels ? inputFormat.channels : audioSettings.DEFAULT_CHANNELS), //params check
            bitDepth: (inputFormat.bitDepth ? inputFormat.bitDepth : audioSettings.DEFAULT_BIT_DEPTH),
            sampleRate: (inputFormat.sampleRate ? inputFormat.sampleRate : audioSettings.DEFAULT_SAMPLE_RATE),
            
            // output
            bitRate: (quality.bitRate ? quality.bitRate : audioSettings.DEFAULT_BIT_RATE),
            outSampleRate: (quality.sampleRate ? quality.sampleRate : audioSettings.DEFAULT_SAMPLE_RATE),
            mode: (quality.mode ? quality.mode : audioSettings.DEFAULT_MODE)
        });
        
        encoder.on("data", (function(data){ //it emits encoder output data outside this class
            this.emit("data", data);
        }).bind(this));
        encoder.on("error", (function(err){
            this.emit("error", err);
        }).bind(this));
        
        var item = {
            encoder: encoder,
            quality: (quality.bitRate ? quality.bitRate : audioSettings.DEFAULT_BIT_RATE)
        };
        this._encoders.push(item);
    }
}
inherits(Speaker, EventEmitter);

/**
 * method to write data into every encoder
 * wrapper method
 * 
 * @param data
 */
Speaker.prototype.write = function(data){
    for(var i=0; i<this._encoders.length; i++){
        var item = this._encoders[i];
        item.encoder.write(data);
    }
};

/**
 * method to get all diffused qualities
 * 
 * @return qualities
 */
Speaker.prototype.getQualities = function(){
    var qualities = [];
    for(var i=0; i<this._encoders.length; i++){
        qualities.push(this._encoders[i].quality);
    }
    return(qualities);
};

module.exports = Speaker;
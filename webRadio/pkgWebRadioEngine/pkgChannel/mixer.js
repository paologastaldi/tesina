var EventEmitter = require("events");
var inherits = require("util").inherits;
var DestroyStream = require("./destroyStream");
var Decoder = require("lame").Decoder;
var audioSettings = require("./audioSettings");
var AudioMixer = require("audio-mixer");

/**
 * Gastaldi Paolo
 * 16/03/2016
 * 
 * class to mix multiple PCM streams together
 */

/**
 * @constructor
 */
function Mixer(){
    if (!(this instanceof Mixer)) return(new Mixer());
    EventEmitter.call(this);
    
    this._mixer = null;
    this._inputs = null,
    this._destroyStream = null;
    
    this._mixer = new AudioMixer();
    this._mixer.on("data", (function(data){
       this.emit("data", data);
    }).bind(this));
    
    this._inputs = [];
    
    this._destroyStream = new DestroyStream();
    this._mixer.pipe(this._destroyStream); //it destroys all mixer output data
}
inherits(Mixer, EventEmitter);

/**
 * method to add a PCM input stream to the mixer
 * the input stream has to be already timed
 * 
 * @return PCM input stream (mixer input)
 */
Mixer.prototype.addPCMInput = function(inputFormat){
    if(typeof(inputFormat) !== "object") inputFormat = audioSettings.DEFAULT_FORMAT;
    
    var mixerInput = this._mixer.input({
        channels: inputFormat.channels,
		bitDepth: inputFormat.bitDepth,
		sampleRate: inputFormat.sampleRate
    });
    this._inputs.push(mixerInput);
    return(mixerInput);
};

/**
 * method to add an input stream to the mixer
 * 
 * @return audio input stream (decoder)
 */
Mixer.prototype.addInput = function(){
    var decoder = new Decoder();
    decoder.on("format", (function(format){
        var mixerInput = this.addPCMInput({
           channels: format.channels,
           bitDepth: format.bitDepth,
           sampleRate: format.sampleRate
        });  
        decoder.pipe(mixerInput);
    }).bind(this));
    return(decoder);
};

module.exports = Mixer;
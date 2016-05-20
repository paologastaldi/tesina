var lame = require("lame");

/**
 * Gastaldi Paolo
 * 16/03/2016
 * 
 * audio constant list
 */

const DEFAULT_BIT_DEPTH  = 16;
const DEFAULT_BIT_RATE = 384; //maximumn quality
const DEFAULT_CHANNELS = 2;
const DEFAULT_SAMPLE_RATE = 44100;

const DEFAULT_MODE = lame.STEREO;
const MODE_MONO = lame.MONO;
const MODE_STEREO = lame.STEREO;
const MODE_JOINTSTEREO = lame.JOINTSTEREO;

const DEFAULT_FORMAT = {
    channels: DEFAULT_CHANNELS,
    bitDepth: DEFAULT_BIT_DEPTH,
    bitRate: DEFAULT_BIT_RATE,
    sampleRate: DEFAULT_SAMPLE_RATE,
    outSampleRate: DEFAULT_SAMPLE_RATE,
    mode: MODE_STEREO
};

module.exports = {
    DEFAULT_BIT_DEPTH,
    DEFAULT_BIT_RATE,
    DEFAULT_CHANNELS,
    DEFAULT_SAMPLE_RATE,
    DEFAULT_MODE,
    MODE_MONO,
    MODE_STEREO,
    MODE_JOINTSTEREO,
    DEFAULT_FORMAT
};
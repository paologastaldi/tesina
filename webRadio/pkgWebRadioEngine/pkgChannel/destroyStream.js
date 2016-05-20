var Writable = require('stream').Writable;
var inherits = require('util').inherits;

/**
 * class to destroy a stream
 */

function DestroyStream () {
  if (!(this instanceof DestroyStream)) return new DestroyStream();
  Writable.call(this);
}
inherits(DestroyStream, Writable);

/**
 * method to avoid to write chunk data into an internal buffer
 * 
 * @param chunk
 * @param encoding
 * @param callback
 */
DestroyStream.prototype.write = function(chunk, encoding, callback){
  if(callback) callback();
};

module.exports = DestroyStream;
var fs = require("fs");
var inherits = require("util").inherits;
var DBManager = require("./pkgDBManager/dbManagerMySql");

/**
 * Gastaldi Paolo
 * 17/03/2016
 * 
 * class to manage data (files and database) access
 * this class wraps many method from other classes
 */

/**
 * @constructor
 * @param dbParam
 */
function DataManager(dbParam){
    if(!(this instanceof DataManager)) return(new DataManager(dbParam));
    
    this._dbManager = null;
    
    this._dbManager = new DBManager();
    if(typeof(dbParam) !== "undefined") this.createDBConnection(dbParam);
}

/**
 * method to create a new read stream
 * 
 * @param path
 * @param option
 * @return readStream
 */
DataManager.prototype.createReadStream = function(path, options){
    var stream = null;
    
    if(fs.existsSync(path)) stream = fs.createReadStream(path, options);
    return(stream);
};

/**
 * method to create a new write stream
 * 
 * @param path
 * @param option
 * @return writeStream
 */
DataManager.prototype.createWriteStream = function(path, options){
    return(fs.createWriteStream(path, options));
};

/**
 * method to read a file asynchronously
 * it calls the callback passing data when it has read them
 * 
 * @param filename
 * @param callback
 */
DataManager.prototype.readFile = function(filename, callback){
    fs.readFile(filename, callback);
};

/**
 * method to write a Data asynchronously
 * it calls the callback passing data when it has written them
 * 
 * @param filename
 * @param data
 * @param encoding
 * @param callback
 */
DataManager.prototype.writeFile = function(filename, data, encoding, callback){
    fs.writeFile(filename, data, encoding, callback);
};

/**
 * method to read a file synchronously
 * 
 * @param filename
 * @param encoding
 */
DataManager.prototype.readFileSync = function(filename, encoding){
    fs.readFileSync(filename, encoding);
};

/**
 * method to write a file synchronously
 * 
 * @param filename
 * @param data
 * @param encoding
 */
DataManager.prototype.writeFileSync = function(filename, data, encoding){
    fs.writeFileSync(filename, data, encoding);
};

/**
 * method to delete a file synchronously
 * 
 * @param filename
 * @param callback
 */
DataManager.prototype.deleteFile = function(filename, callback){
    fs.unlink(filename, callback);
};

/**
 * method to delete a file synchronously
 * 
 * @param filename
 */
DataManager.prototype.deleteFileSync = function(filename){
    fs.unlinkSync(filename);
};

/**
 * method to create a directory asynchronously
 * 
 * @param path
 * @param callback
 */
DataManager.prototype.mkdir = function(path, callback){
    fs.mkdir(path, callback);
};

/**
 * method to remove a directory asynchronously
 * 
 * @param path
 * @param callback
 */
DataManager.prototype.rmdir = function(path, callback){
    fs.rmdir(path, callback);
};

/**
 * method to create a database connection
 * for parametres see dbManager documentation
 * 
 * @param dbParam
 */
DataManager.prototype.createDBConnection = function(dbParam){
    this._dbManager.createConnection(dbParam);
};

/**
 * method to end the database connection
 */
DataManager.prototype.endDBConnection = function(){
    this._dbManager.endConnection();
};

/**
 * method to execute a query asynchronously
 * 
 * @param instruction
 * @param params
 * @param callback
 */
DataManager.prototype.query = function(instruction, params, callback){
    this._dbManager.query(instruction, params, callback);
};

/**
 * method to execute a query synchronously
 * 
 * @param instruction
 * @param parametresArray
 */
DataManager.prototype.querySync = function(instruction, params){
    return(this._dbManager.query(instruction, params));
};
 
module.exports = DataManager;
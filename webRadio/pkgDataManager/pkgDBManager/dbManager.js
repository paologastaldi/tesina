/**
 * Gastaldi Paolo
 * 17/03/2016
 * 
 * class to manage database methods
 * this is an abstract class
 */

/**
 * @constructor
 */
function DBManager(){
    this._connection = null;
    
    if(this.constructor === DBManager) throw new Error("Abstract class");
    if(!(this instanceof DBManager)) return(new DBManager());
}

/**
 * method to create a database connection and connect to it
 * dbParam has to be compiled with host, port, database, user and password
 * eg. dbParam = {host: string, port: string, database: string, user: string, password: string};
 * 
 * @param dbParam
 */
DBManager.prototype.createConnection = function(dbParam){};

/**
 * method to execute an asynchronous query
 * 
 * @param instruction
 * @param params
 * @param callback
 */
DBManager.prototype.query = function(instruction, params, callback){};

/**
 * method to execute a synchronous query
 * 
 * @param instruction
 * @param params
 * @return results
 */
DBManager.prototype.querySync = function(instruction, params){};

/**
 * method to close a database connection
 */
DBManager.prototype.endConnection = function(){};

module.exports = DBManager;
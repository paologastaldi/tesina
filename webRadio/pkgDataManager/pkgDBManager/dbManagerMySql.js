var DBManager = require("./dbManager");
var inherits = require("util").inherits;
var mysql = require("mysql");

/**
 * class to manage a MySql connection
 * for documentation see its parent class
 */

/**
 * @constructor
 */
function DBManagerMySql(){
    if(!(this instanceof DBManagerMySql)) return (new DBManagerMySql());
    DBManager.call(this);
}
inherits(DBManagerMySql, DBManager);

DBManagerMySql.prototype.createConnection = function(dbParam){
    this._connection = mysql.createConnection(dbParam);
    this._connection.connect();
};

DBManagerMySql.prototype.query = function(instruction, params, callback){
    this._connection.query(instruction, params, function(err, rows, fields) {
        callback(err, rows, fields);
    });
};

DBManager.prototype.querySync = function(instruction, params){
};

DBManagerMySql.prototype.endConnection = function(){
    this._connection.end();
};

module.exports = DBManagerMySql;
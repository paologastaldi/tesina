var express = require("express");
var ChannelManager = require("./../pkgWebRadioEngine/channelManager").ChannelManager;
var DataManager = require("./../webRadioDataManager");
var bodyParser = require("body-parser");
var session = require('express-session');
var Website = require("./website");
var Dashboard = require("./dashboard");
var Account = require("./account");
var cookieParser = require("cookie-parser");

/**
 * Gastaldi Paolo
 * 26/03/2016
 * 
 * web this._app to manage all specific this._apps
 */

/**
 * @constructor
 */
function App(dataManager, channelManager){
    if(!(this instanceof App)) return(new App(dataManager, channelManager));
    
    this._app = null;
    this._website = null;
    this._account = null;
    this._dashboard = null;
    this._channelManager = null;
    this._dataManager = null;
    
    if(!(dataManager instanceof DataManager)) throw new Error("Unset dataManager");
    if(!(channelManager instanceof ChannelManager)) throw new Error("Unset channelManager");
    
    this._dataManager = dataManager;
    this._channelManager = channelManager;
    
    this._app = express();
    this._app.use(bodyParser.urlencoded({extended: true})); 
    this._app.use(bodyParser.urlencoded());
    this._app.use(bodyParser.json()); // for page forms
    this._app.use(cookieParser("12345678"));    
    this._app.use(session({secret: "12345678"}));
    this._app.set("view engine", "jade");
    this._app.set('views', (__dirname + "/views"));
    this._app.set("/views", express.static(__dirname + "/views"));
    this._app.use("/css", express.static(__dirname + "/css"));
    this._app.use("/js", express.static(__dirname + "/js"));
    this._app.use("/img", express.static(__dirname + "/img"));
    this._app.use("/fonts", express.static(__dirname + "/fonts"));
    
    this._website = new Website(this._dataManager, this._channelManager);
    this._dashboard = new Dashboard(this._dataManager, this._channelManager);
    this._account = new Account(this._dataManager, this._channelManager);
    
    this._app.use("/website", this._website.getApp());
    this._app.use("/dashboard", this._dashboard.getApp());
    this._app.use("/account", this._account.getApp());
    
    this._app.get("/", function(req, res){
        res.redirect("/website"); 
    });
}

/**
 * method to get the express route this._app
 * 
 * @return this._app
 */
App.prototype.getApp = function(){
    return(this._app);
};

module.exports = App;
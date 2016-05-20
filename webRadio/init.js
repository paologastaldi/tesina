var App = require("./pkgWebsite/app");
var http = require("http");
var ChannelManager = require("./pkgWebRadioEngine/channelManager").ChannelManager;
var DataManager = require("./webRadioDataManager");
var fs = require("fs");
var path = require("path");

/**
 * project initializer
 */

const CONFIG_FILE = path.join(__dirname, "./webRadio.config");

/**
 * function to initialize project parametres and launch the web radio
 */
function init(){
    var config = JSON.parse(fs.readFileSync(CONFIG_FILE));
    
    var projectConfig = config["project"];
    console.log("\n --- " + projectConfig["name"] + " --- \n" + projectConfig["description"] + "\n"); //project logo
    
    var databaseConfig = config["databaseConnection"];
    var systemUser = config["systemUser"];
    var keysPath = config["keysPath"];
    
    var privateKey = fs.readFileSync(path.join(__dirname, keysPath["privateKey"])).toString();
    
    var dataManager = new DataManager({
        host: databaseConfig["host"],
        port: databaseConfig["port"],
        database: databaseConfig["database"],
        user: databaseConfig["user"],
        password: databaseConfig["password"]
    }, privateKey);
    
    dataManager.query("UPDATE Users SET password = ?, inputDate = NOW() WHERE firstName = 'System'", [dataManager.strToAES(systemUser["password"])], function(field, row, err){});
    
    dataManager.setConfigData(config);
    
    var channelManager = new ChannelManager(dataManager);
    var app = new App(dataManager, channelManager);
    app.getApp().on("error", function(err){
        console.log("FATAL ERROR: " + err);
        init();
    });

    var systemConfig = config["system"];
    http.createServer(app.getApp()).listen(systemConfig["serverPort"]);
    http.globalAgent.maxSockets = config["maxClients"];
    console.log("Server running on port " + systemConfig["serverPort"]);
}

module.exports = init;
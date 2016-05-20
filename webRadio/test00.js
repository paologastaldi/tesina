var http = require("http");
var ChannelManager = require("./pkgWebRadioEngine/channelManager").ChannelManager;
var DataManager = require("./webRadioDataManager");

var ChannelStatus = require("./pkgWebRadioEngine/channelManager").ChannelStatus;

/**
 * Gastaldi Paolo
 * 25/03/2016
 * 
 * test channel server
 * completed!
 */
    
var dataManager = new DataManager();
dataManager.createDBConnection({
    host: "localhost",
    port: "3306",
    database: "test",
    user: "paologastaldi",
    password: ""
});
var channelManager = new ChannelManager(dataManager);
channelManager.on("ready", function(){
    var channels = channelManager.getChannels();
    if(channels && channels.length){
        var testChannel = channels[0].server;
        testChannel.once(ChannelStatus.READY, function(){
            console.log("Channel ready");
            
            var qualities = testChannel.getQualities();
            console.log("Qualities broadcasted: " + qualities);
            
            console.log("Listening " + qualities[0] + " bit/s...");
            
            console.log("Starting channel...");
            testChannel.start();
            
            http.createServer(function(req, res){
                res.writeHead(200, {
                    'Content-Type': 'audio/mpeg'
                });
                testChannel.on(qualities[0], function(data){
                    res.write(data);
                });
            }).listen(process.env.PORT);
            
            console.log("Server running on port " + process.env.PORT);
        });
        
        testChannel.once(ChannelStatus.START, function(){
            console.log("Channel started"); 
        });   
    }
    else console.log("Bho");
});
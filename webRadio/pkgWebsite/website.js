var Subapp = require("./subapp");
var inherits = require("util").inherits;

/**
 * file to define what the webite has to provide
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function Website(dataManager, channelManager){
    if(!(this instanceof Website)) return(new Website(dataManager, channelManager));
    Subapp.call(this, dataManager, channelManager);
    
    this._app.get("/", function(req, res){
        res.redirect("/website/homepage");
    });
    
    this._app.get("/homepage", (function(req, res){
        this._dataManager.getGenres(function(genres){
            res.render("./website/homepage.jade", {genres: genres });
        });
    }).bind(this));
    
    this._app.get("/genres", function(req, res){
        res.redirect("/website/homepage#genres");
    });
        
    this._app.get("/genre", (function(req, res){
        if(req.param('id')){
            this._dataManager.getGenre({
                id: req.param('id')
            }, (function(genre){
                this._dataManager.getChannelsFromGenre(genre, function(channels){
                    res.render("./website/genre.jade", { genre : genre, channels : channels });
                });
            }).bind(this));
        }
        else res.redirect("/website/homepage#genres");
    }).bind(this));
    
    this._app.get("/channel", (function(req, res){
        if(req.param('id')){
            var channelId = parseInt(req.param('id'));
            
            this._dataManager.getChannel({
                    id: channelId
                }, (function(channel){
                this._dataManager.getQualities((function(qualities){
                    res.render("./website/channel.jade", { channel: channel, qualities: qualities });
                }).bind(this));
            }).bind(this));
        }
        else res.redirect("/website/homepage#genres");
    }).bind(this));
    
    this._app.get("/listenTo", (function(req, res){ //listen to a channel
        var channelId = req.param('id');
        var quality = parseInt(req.param('quality'));
        
        if(typeof(channelId) !== "undefined" && typeof(quality) !== "undefined"){
            var channel = this._channelManager.getChannel(channelId);
            
            if(typeof(channel) !== "undefined" && channel){
                var channelServer = channel.server;
                
                var writeAudio = function(audioData){ //event callback
                    res.write(audioData);
                };
                
                res.writeHead(200, { 'Content-Type': 'audio/mpeg' }); //defining response head
                channelServer.on(quality, writeAudio);//appending a new listener
                
                req.on("close", function(){ //listener remotion on socket closing
                    channelServer.removeListener(quality, writeAudio);
                });
            }
        }
    }).bind(this));
    
    this._app.post("/getMetadata", (function(req, res){
        var channelId = req.body.channelId;
        var init = req.body.init; //initial metadata
        
        if(typeof(init) !== "undefined" && typeof(channelId) !== "undefined"){
            var channel = this._channelManager.getChannel(channelId);
            
            if(channel){
                var channelServer = channel.server;
                if(init === "true"){
                    res.json(channelServer.getMetadata());
                }
                else{
                    channelServer.once("metadata", function(metadata){ //single-use listener
                        res.json(metadata);
                    });
                }
            }
            else res.json();
        }
    }).bind(this));
    
    this._app.get("/channels", (function(req, res){
        this._dataManager.getChannels(function(channels){
            res.render("./website/channels.jade", {channels: channels});
        });
    }).bind(this));
    
    this._app.get("/privacy", function(req, res){
        res.render("./website/privacy.jade");
    });
}
inherits(Website, Subapp);

module.exports = Website;
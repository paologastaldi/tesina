var Subapp = require("./dashboardSubapp");
var inherits = require("util").inherits;
var SystemDashboard = require("./systemDashboard");
var ChannelDashboard = require("./channelDashboard");
var express = require("express");

/**
 * file to define what the dashboard has to provide
 * every dashboard object manager check users' permissions, get DB data and pass them to the webpage renderer (Jade)
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function Dashboard(dataManager, channelManager){
    if(!(this instanceof Dashboard)) return(new Dashboard(dataManager, channelManager));
    Subapp.call(this, dataManager, channelManager);
    
    this._systemDashboard = null;
    this._channelDashboard = null;
    
    this._systemDashboard = new SystemDashboard(this._dataManager, this._channelManager);
    this._channelDashboard = new ChannelDashboard(this._dataManager, this._channelManager);
    
    this._app.use("/system", this._systemDashboard.getApp());
    this._app.use("/channel", this._channelDashboard.getApp());
    
    this._app.use("/css", express.static(__dirname + "/css"));
    this._app.use("/js", express.static(__dirname + "/js"));
    this._app.use("/img", express.static(__dirname + "/img"));
    this._app.use("/fonts", express.static(__dirname + "/fonts"));
    
    this._app.all("*", (function(req, res, next){
        if(typeof(req.session['userId']) === "undefined") res.redirect("/account/login"); //login is required for dashboard access
        
        //else if(typeof(req.session['channelsId']) === "undefined" || typeof(req.session['systemMember']) === "undefined"){
        else{
            this._dataManager.whichChannelsIsMember({
                id: req.session['userId']
            }, (function(channelsId){
                req.session['channelsId'] = channelsId; //all channels id of which the user is member
                this._dataManager.isSystemMember({
                    id: req.session['userId']
                    }, (function(systemMember){
                    req.session['systemMember'] = systemMember;
                    next();
                }).bind(this));
            }).bind(this));
        }
    }).bind(this));
    
    this._app.get("/", function(req, res){
        req.session['channelDashboard'] = undefined; //selected channel dashboard reset
        res.redirect("/dashboard/select");
    });
    
    this._app.get("/select", (function(req, res){
        this._dataManager.getChannels((function(allChannels){
            var channels = [];
            for(var i=0; i<allChannels.length; i++){
                var channel = allChannels[i];
                if(req.session['channelsId'].indexOf(channel.id) > -1) channels.push(channel); //it gets an array of channels which the user is member of
            }
            //if(typeof(req.session['channelDashboard']) !== "undefined") req.session['channelDashboard'] = "undefined"; //channel dashboard reset
            res.render("./dashboard/select", {
                channels: channels,
                systemMember: req.session['systemMember']
            });
        }).bind(this));
    }).bind(this));
}
inherits(Dashboard, Subapp);

module.exports = Dashboard;
var Subapp = require("./dashboardSubapp");
var inherits = require("util").inherits;

/**
 * file to define what the channel dashboard has to provide
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function ChannelDashboard(dataManager, channelManager){
    if(!(this instanceof ChannelDashboard)) return(new ChannelDashboard(dataManager, channelManager));
    Subapp.call(this, dataManager, channelManager);
    
    this._app.all("*", (function(req, res, next){
        //if(req.session['channelsId'].indexOf(parseInt(req.param('id')))) res.redirect("/dashboard"); //if user isn't a channel member
        
        if(req.param('id') && typeof(req.session['channelsId']) !== "undefined" && req.session['channelsId'].indexOf(parseInt(req.param('id'))) >= 0){ //if user is a channel member
            if(typeof(req.session['channelDashboard']) !== "undefined" && req.session['channelDashboard'] != req.param('id')) this._errors.push(14);
            req.session['channelDashboard'] = req.param('id');
            res.redirect("/dashboard/channel");
        }
        else{
            if(typeof(req.session['channelDashboard']) !== "undefined") next();
            else res.redirect("/dashboard");
        }
    }).bind(this));
    
    this._app.get("/", function(req, res){
        res.redirect("/dashboard/channel/overview");
    });
    
    this._app.get("/overview", (function(req, res){
        this._dataManager.getChannel({
            id: req.session['channelDashboard']
        }, (function(channel){
            if(!channel) this._errors(2);
            res.render("./dashboard/channel/overview.jade", { channel: channel, errors: this._getErrors() });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyChannelThumbnail", this._imageUploader.single("channelThumbnail"), (function(req, res){
        var image = null;
        
        if(typeof(req.file) !== "undefined") image = req.file;
        
        this._dataManager.modifyChannelThumbnail({
            id: req.session['channelDashboard']
        }, image, (function(result){
            if(!result) this._errors.push(3);
            res.redirect("/dashboard/channel/overview");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 24,
                description: "channel id: " + req.session['channelDashboard'] + ", channel id: " + req.session['channelDashboard']
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/members", "/addMember", "/modifyMember", "/removeMember"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "members" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkChannelPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        if(!result) this._errors.push(4);
                        res.redirect("/dashboard/channel/overview");
                    }
                }).bind(this));
            }
            else{
                this._errors.push(1);
                res.redirect("/dashboard/channel/overview");
            }
        }).bind(this));
    }).bind(this));
    
    this._app.get("/members", (function(req, res){
        this._dataManager.getChannelMembers({
            id: req.session['channelDashboard']
        }, (function(members){
            this._dataManager.getRoles({
                systemChannel: false
            }, (function(roles){
                res.render("./dashboard/channel/members.jade", {
                    members: members,
                    roles: roles,
                    errors: this._getErrors()
                });
            }).bind(this));
        }).bind(this));
    }).bind(this));
    
    this._app.post("/addMember", (function(req, res){
        this._dataManager.getUserId({
            email: req.body.txtEmail
        }, (function(userId){
            if(userId){
                this._dataManager.addChannelMember({
                    id: userId
                }, {
                    id: req.body.cmbRoleId
                }, (function(result){
                    if(!result) this._errors.push(5);
                    res.redirect("/dashboard/channel/members");
    
                    this._dataManager.addLog({
                        userId: req.session['userId'],
                        messageId: 1,
                        description: "channel id: " + req.session['channelDashboard'] + ", user email: " + req.body.txtEmail
                    });
                }).bind(this));
            }
            else res.redirect("/dashboard/channel/members");
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyMember", (function(req, res){
        this._dataManager.modifyChannelMember({
            id: req.body.txtUserId
        }, {
            id: req.body.cmbRoleId    
        },function(result){
            if(!result) this._errors.push(5);
            res.redirect("/dashboard/channel/members");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 1,
                description: "channel id: " + req.session['channelDashboard'] + ", member id: " + req.body.txtUserId
            });
        });
    }).bind(this));
    
    this._app.post("/removeMember", (function(req, res){
        this._dataManager.removeChannelMember({
            id: req.body.txtUserId
        }, function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/channel/members");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 2,
                description: "channel id: " + req.session['channelDashboard'] + ", member id: " + req.body.txtUserId
            });
        });
    }).bind(this));
    
    this._app.all(["/roles", "/addRole", "/modifyRole", "/removeRole"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "roles" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkChannelPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/channel/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/channel/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/roles", (function(req, res){
        this._dataManager.getRoles({
            systemChannel: false
        }, (function(roles){
            this._dataManager.getPermissions((function(permissions){
                res.render("./dashboard/channel/roles.jade", {
                    roles: roles,
                    permissions: permissions,
                    errors: this._getErrors()
                });
            }).bind(this));
        }).bind(this));
    }).bind(this));
    
    this._app.post("/addRole", (function(req, res){
        var permissions = [];
        for(var i=0; i<req.body.cmbPermissionsId.length; i++){
            permissions.push({ id: req.body.cmbPermissionsId[i]}); //it creates an object for every selected permission
        }
        
        this._dataManager.addRole({
            description: req.body.txtDescription,
            systemChannel: false
        }, permissions, (function(result){
            if(!result) this._errors.push(6);
            res.redirect("/dashboard/channel/roles");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 7,
                description: "channel id: " + req.session['channelDashboard'] + ", role description: " + req.body.txtDescription
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyRole", (function(req, res){
        var permissions = [];
        for(var i=0; i<req.body.cmbPermissionsId.length; i++){
            permissions.push({ id: req.body.cmbPermissionsId[i]}); //it creates an object for every selected permission
        }
        
        this._dataManager.modifyRole({
            id: req.body.txtRoleId,
            description: req.body.txtDescription,
            systemChannel: false  
        }, permissions, (function(result){
            if(!result) this._errors.push(6);
            res.redirect("/dashboard/channel/roles");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 7,
                description: "channel id: " + req.session['channelDashboard'] + ", role id: " + req.body.txtRoleId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeRole", (function(req, res){
        this._dataManager.removeRole({
            id: req.body.txtRoleId
        }, (function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/channel/roles");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 8,
                description: "channel id: " + req.session['channelDashboard'] + ", role id: " + req.body.txtRoleId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/albums", "/addAlbum", "/modifyAlbums", "/removeAlbums", "/addAlbumTrack", "/modifyAlbumTrack", "/removeAlbumTrack", "/modifyAlbumThumbnail"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "albums" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkChannelPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/channel/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/channel/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/albums", (function(req, res){
        this._dataManager.getAlbums({
            id: req.session['channelDashboard']
        }, function(albums){
            res.render("./dashboard/channel/albums.jade", { albums: albums });
        });
    }).bind(this));
    
    this._app.post("/addAlbum", (function(req, res){
        this._dataManager.addAlbum({
            title: req.body.txtTitle
        }, {
            id: req.session['channelDashboard']
        }, (function(result){
            if(!result) this._errors.push(7);
            res.redirect("/dashboard/channel/albums");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 9,
                description: "channel id: " + req.session['channelDashboard'] + ", album title: " + req.body.txtTitle
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyAlbum", (function(req, res){
        this._dataManager.modifyAlbum({
            id: req.body.txtAlbumId,
            title: req.body.txtTitle
        }, (function(result){
            if(!result) this._errors.push(7);
            res.redirect("/dashboard/channel/albums");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 9,
                description: "channel id: " + req.session['channelDashboard'] + ", album id: " + req.body.txtAlbumId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeAlbum", (function(req, res){
        this._dataManager.removeAlbum({
            id: req.body.txtAlbumId
        }, (function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/channel/albums");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 10,
                description: "channel id: " + req.session['channelDashboard'] + ", album id: " + req.body.txtAlbumId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all("/albumTracks", (function(req, res, next){
        if(req.param('txtAlbumId')){
            req.session['selectedAlbum'] = req.param('txtAlbumId');
            res.redirect("/dashboard/channel/albumTracks");
        }
        else{
            if(req.session['selectedAlbum']) next();
            else res.redirect("/dashboard/channel/albums");
        }
    }).bind(this));
    
    this._app.post("/modifyAlbumThumbnail", this._imageUploader.single("albumThumbnail"), (function(req, res){
        var image = null;
        
        if(typeof(req.file) !== "undefined") image = req.file;
        
        this._dataManager.modifyAlbumThumbnail({
            id: req.session['selectedAlbum']
        }, image, (function(result){
            if(!result) this._errors.push(3);
            res.redirect("/dashboard/channel/albumTracks");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 25,
                description: "channel id: " + req.session['channelDashboard'] + ", album id: " + req.session['selectedAlbum']
            });
        }).bind(this));
    }).bind(this));
    
    this._app.get("/albumTracks", (function(req, res){
        this._dataManager.getAlbum({
            id: req.session['channelDashboard']
        }, {
            id: req.session['selectedAlbum']
        }, (function(album){
            this._dataManager.getAlbumTracks({
                id: req.session['selectedAlbum']
            }, (function(tracks){
                res.render("./dashboard/channel/albumTracks.jade", { album: album, tracks: tracks});
            }).bind(this));
        }).bind(this));
    }).bind(this));
    
    this._app.post("/addAlbumTracks", this._audioUploader.array("tracks"), (function(req, res){
        var tracks = null;
        
        if(typeof(req.files) !== "undefined") tracks = req.files;
        
        this._dataManager.addAlbumTracks({
            id: req.body.txtAlbumId
        }, tracks, (function(result){
            if(!result) this._errors.push(8);
            res.redirect("/dashboard/channel/albumTracks");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 11,
                description: "channel id: " + req.session['channelDashboard'] + ", album id: " + req.session['selectedAlbum']
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyAlbumTrack", (function(req, res){
        this._dataManager.modifyAlbumTrack({
            id: req.body.txtTrackId,
            title: req.body.txtTitle,
            author: req.body.txtAuthor
        }, (function(result){
            if(!result) this._errors.push(8);
            res.redirect("/dashboard/channel/albumTracks");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 11,
                description: "channel id: " + req.session['channelDashboard'] + ", album id: " + req.session['selectedAlbum']
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeAlbumTrack", (function(req, res){
        this._dataManager.removeAlbumTrack({
            id: req.body.txtTrackId
        }, (function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/channel/albumTracks");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 12,
                description: "channel id: " + req.session['channelDashboard'] + ", album id: " + req.session['selectedAlbum']
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/playlists", "/addPlaylist", "/modifyPlaylists", "/removePlaylists", "/addPlaylistTrack", "/removePlaylistTrack"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "playlists" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkChannelPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        if(!result) this._errors.push(4);
                        res.redirect("/dashboard/channel/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/channel/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/playlists", (function(req, res){
        this._dataManager.getPlaylists({
            id: req.session['channelDashboard']
        }, (function(playlists){
            res.render("./dashboard/channel/playlists.jade", { playlists: playlists});
        }).bind(this));
    }).bind(this));
    
    this._app.post("/addPlaylist", (function(req, res){
        this._dataManager.addPlaylist({
            name: req.body.txtName
        }, {
            id: req.session['channelDashboard']
        }, {
            id: req.session['userId']
        }, (function(result){
            if(!result) this._errors.push(9);
            res.redirect("/dashboard/channel/playlists");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 13,
                description: "channel id: " + req.session['channelDashboard'] + ", playlist name: " + req.body.txtName
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyPlaylist", (function(req, res){
        this._dataManager.modifyPlaylist({
            id: req.body.txtPlaylistId,
            name: req.body.txtName
        }, (function(result){
            if(!result) this._errors.push(9);
            res.redirect("/dashboard/channel/playlists");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 13,
                description: "channel id: " + req.session['channelDashboard'] + ", playlist id: " + req.body.txtPlaylistId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removePlaylist", (function(req, res){
        this._dataManager.removePlaylist({
            id: req.body.txtPlaylistId
        }, (function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/channel/playlists");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 14,
                description: "channel id: " + req.session['channelDashboard'] + ", playlist id: " + req.body.txtPlaylistId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/activatePlaylist", (function(req, res){
        this._dataManager.activatePlaylist({
            id: req.session['channelDashboard']
        },{
            id: req.body.txtPlaylistId
        }, (function(result){
            if(!result) this._errors.push(10);
            res.redirect("/dashboard/channel/playlists");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 26,
                description: "channel id: " + req.session['channelDashboard'] + ", playlist id: " + req.body.txtPlaylistId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all("/playlistTracks", (function(req, res, next){
        if(req.param('txtPlaylistId')){
            req.session['selectedPlaylist'] = req.param('txtPlaylistId');
            res.redirect("/dashboard/channel/playlistTracks");
        }
        else{
            if(req.session['selectedPlaylist']) next();
            else res.redirect("/dashboard/channel/playlists");
        }
    }).bind(this));
    
    this._app.get("/playlistTracks", (function(req, res){
        this._dataManager.getPlaylist({
            id: req.session['selectedPlaylist']
        }, (function(playlist){
            this._dataManager.getPlaylistTracks({
                id: req.session['selectedPlaylist']
            }, (function(playlistTracks){
                this._dataManager.getNoPlaylistTracks({
                    id: req.session['channelDashboard']
                }, {
                    id: req.session['selectedPlaylist']
                }, (function(noPlaylistTracks){
                    res.render("./dashboard/channel/playlistTracks.jade", { playlist: playlist, playlistTracks: playlistTracks, noPlaylistTracks: noPlaylistTracks });
                }).bind(this));
            }).bind(this));
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyPlaylistTracks", (function(req, res){
        var tracks = [];
        
        if(typeof(req.body.txtTrackId) !== "undefined"){
            for(var i=0; i<req.body.txtTrackId.length; i++){
                tracks.push({
                    id: req.body.txtTrackId[i],
                    order: i
                }); //it creates an object for every selected track
            }
        }
        
        this._dataManager.modifyPlaylistTracks({
            id: req.body.txtPlaylistId
        }, tracks, (function(result){
            if(!result) this._errors.push(11);
            res.redirect("/dashboard/channel/playlistTracks");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 15,
                description: "channel id: " + req.session['channelDashboard'] + ", playlist id: " + req.body.txtPlaylistId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/settings", "/activeChannel", "/reloadChannel"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "settings" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkChannelPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/channel/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/channel/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/settings", (function(req, res){
        this._dataManager.getChannel({
            id: req.session['channelDashboard']
        }, (function(channel){
            res.render("./dashboard/channel/settings.jade", { channel: channel});
        }).bind(this));
    }).bind(this));
    
    this._app.post("/activeChannel", (function(req, res){
        var channelId = parseInt(req.body.channelId);
        var status = req.body.status;
        var channel = this._channelManager.getChannel(channelId);
        
        if(channel && typeof(channel.data.active) !== "undefined" && channel.data.active !== status){ //"status" and "active" are strings
            status = (status === "true"); //string to boolean
            if(status){
                channel.server.start(); //starting or stopping server
                console.log("Starting channel");
            }
            else{
                channel.server.stop();
                console.log("Stopping channel");
            }
        
            channel.data.active = status; //updating channelManager data
            
            this._dataManager.updateChannelStatus({ //updating DB
                id: channelId,
                status: (status ? true : false) //int to boolean
            });
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 18,
                description: "channel id: " + req.session['channelDashboard']
            });
        }
        
        res.send(JSON.stringify());
    }).bind(this));
    
    this._app.post("/reloadChannel", (function(req, res){
        var channelId = req.session['channelDashboard'];
        var channel = this._channelManager.getChannel(channelId);
            
        if(channel) channel.server.reset();
        
        this._dataManager.addLog({
            userId: req.session['userId'],
            messageId: 17,
            description: "channel id: " + req.session['channelDashboard']
        });
        res.send(JSON.stringify("ok"));
    }).bind(this));
}
inherits(ChannelDashboard, Subapp);

module.exports = ChannelDashboard;
var Subapp = require("./dashboardSubapp");
var inherits = require("util").inherits;

/**
 * file to define what the system dashboard has to provide
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function SystemDashboard(dataManager, channelManager){
    if(!(this instanceof SystemDashboard)) return(new SystemDashboard(dataManager, channelManager));
    Subapp.call(this, dataManager, channelManager);
    
    this._app.get("*", function(req, res, next){
        if(!req.session['systemMember']) res.redirect("/dashboard"); //if user isn't a system member
        else next();
    });
    
    this._app.get("/", function(req, res){
        res.redirect("/dashboard/system/overview");
    });
    
    this._app.get("/overview", (function(req, res){
        var configData = this._dataManager.getConfigData();
        res.render("./dashboard/system/overview.jade", { configData: configData, errors: this._getErrors() });
    }).bind(this));
    
    this._app.all(["/members", "/addMember", "/modifyMember", "/removeMember"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "members" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkSystemPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/system/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/system/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/members", (function(req, res){
        this._dataManager.getSystemMembers((function(members){
            this._dataManager.getRoles({
                systemChannel: true
            }, (function(roles){
                res.render("./dashboard/system/members.jade", {
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
                this._dataManager.addSystemMember({
                    id: userId
                }, {
                    id: req.body.cmbRoleId
                }, (function(result){
                    if(!result) this._errors.push(5);
                    res.redirect("/dashboard/system/members");
    
                    this._dataManager.addLog({
                        userId: req.session['userId'],
                        messageId: 3,
                        description: "user email: " + req.body.txtEmail
                    });
                }).bind(this));
            }
            else res.redirect("/dashboard/system/members");
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyMember", (function(req, res){
        this._dataManager.modifySystemMember({
            id: req.body.txtUserId
        }, {
            id: req.body.cmbRoleId    
        }, (function(result){
            if(!result) this._errors.push(5);
            res.redirect("/dashboard/system/members");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 3,
                description: "user id: " + req.body.txtUserId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeMember", (function(req, res){
        this._dataManager.removeSystemMember({
            id: req.body.txtUserId
        }, function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/system/members");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 4,
                description: "user id: " + req.body.txtUserId
            });
        });
    }).bind(this));
    
    this._app.all(["/roles", "/addRole", "/modifyRole", "/removeRole"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "roles" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkSystemPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/system/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/system/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/roles", (function(req, res){
        this._dataManager.getRoles({
            systemChannel: true
        }, (function(roles){
            this._dataManager.getPermissions((function(permissions){
                res.render("./dashboard/system/roles.jade", {
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
            systemChannel: true
        }, permissions, (function(result){
            if(!result) this._errors.push(6);
            res.redirect("/dashboard/system/roles");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 7,
                description: "role description: " + req.body.txtDescription
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
            systemChannel: true  
        }, permissions, (function(result){
            if(!result) this._errors.push(6);
            res.redirect("/dashboard/system/roles");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 7,
                description: "role id: " + req.body.txtRoleId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeRole", (function(req, res){
        this._dataManager.removeRole({
            id: req.body.txtRoleId
        }, (function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/system/roles");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 8,
                description: "role id: " + req.body.txtRoleId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/genres", "/addGenre", "/modifyGenre", "/removeGenre", "/modifyGenreThumbnail"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "genres" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkSystemPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/system/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/system/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/genres", (function(req, res){
        this._dataManager.getGenres((function(genres){
            res.render("./dashboard/system/genres.jade", {
                genres: genres,
                errors: this._getErrors()
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/addGenre", (function(req, res){
        this._dataManager.addGenre({
            name: req.body.txtName
        }, (function(genre){
            if(!genre) this._errors.push(12);
            res.redirect("/dashboard/system/genres");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 21,
                description: "genre name: " + req.body.txtName
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyGenre", (function(req, res){
        this._dataManager.modifyGenre({
            id: req.body.txtGenreId,
            name: req.body.txtName
        }, (function(result){
            if(!result) this._errors.push(12);
            res.redirect("/dashboard/system/genres");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 21,
                description: "genre id: " + req.body.txtGenreId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeGenre", (function(req, res){
        this._dataManager.removeGenre({
            id: req.body.txtGenreId
        }, (function(result){
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/system/genres");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 20,
                description: "genre id: " + req.body.txtGenreId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyGenreThumbnail", this._imageUploader.single("genreThumbnail"), (function(req, res){
        var image = null;
        
        if(typeof(req.file) !== "undefined") image = req.file;
        
        this._dataManager.modifyGenreThumbnail({
            id: req.body.txtGenreId
        }, image, (function(result){
            if(!result) this._errors.push(3);
            res.redirect("/dashboard/system/genres");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 23,
                description: "genre id: " + req.body.txtGenreId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/channels", "/addChannel", "/modifyChannel", "/removeChannel"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "channels" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkSystemPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/system/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/system/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/channels", (function(req, res){
        this._dataManager.getChannels((function(channels){
            this._dataManager.getGenres((function(genres){
                res.render("./dashboard/system/channels.jade", {
                    channels: channels,
                    genres: genres,
                    errors: this._getErrors()
                });
            }).bind(this));
        }).bind(this));
    }).bind(this));
    
    this._app.post("/addChannel", (function(req, res){
        var channelData = {
            name: req.body.txtName,
            description: req.body.txtDescription
        };
        
        this._dataManager.getRoleId({
            description: "administrator",
            systemChannel: false
        }, (function(roleId){
            this._dataManager.addChannel(channelData, {
                id: req.body.cmbGenreId 
            }, {
                id: req.session['userId']
            }, {
                id: roleId
            }, (function(channelId){
                if(channelId < 0) this._errors.push(13);
                
                if(channelId && channelId >= 0){
                    channelData.id = channelId; //updating channelData
                    this._channelManager.addChannel({
                        id: channelId
                    });
                    req.session['channelsId'].push(channelId);
                }
                
                res.redirect("/dashboard/system/channels");
            
                this._dataManager.addLog({
                    userId: req.session['userId'],
                    messageId: 21,
                    description: "channel name: " + req.body.txtName
                });
            }).bind(this));
        }).bind(this));
    }).bind(this));
    
    this._app.post("/modifyChannel", (function(req, res){
        this._dataManager.modifyChannel({
            id: req.body.txtChannelId,
            name: req.body.txtName,
            description: req.body.txtDescription
        }, {
            id: req.body.cmbGenreId
        }, (function(result){
            if(!result) this._errors.push(13);
                
            //it doesn't update channel data setted into channelManager
            res.redirect("/dashboard/system/channels");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 21,
                description: "channel id: " + req.body.txtChannelId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.post("/removeChannel", (function(req, res){
        var channelId = req.body.txtChannelId;
        
        this._dataManager.removeChannel({
            id: channelId
        }, (function(result){
            this._channelManager.removeChannel({ id: channelId });
            if(!result) this._errors.push(1);
            res.redirect("/dashboard/system/channels");
            
            this._dataManager.addLog({
                userId: req.session['userId'],
                messageId: 22,
                description: "channel id: " + req.body.txtChannelId
            });
        }).bind(this));
    }).bind(this));
    
    this._app.all(["/settings"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "settings" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkSystemPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/system/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/system/overview");
        }).bind(this));
    }).bind(this));
        
    this._app.get("/settings", (function(req, res){
        this._dataManager.getSettings(function(settings){ //IMPORTANT: to implements...
            res.render("./dashboard/system/settings.jade", {
                settings: settings,
                errors: this._getErrors()
            });
        });
    }).bind(this));
    
    this._app.all(["/logs"], (function(req, res, next){ //user's permission check
        this._dataManager.getPermissionId({ description: "logs" }, (function(permissionId){
            if(permissionId){
                this._dataManager.checkSystemPermission({ id: req.session['userId'] }, { id: permissionId }, (function(result){
                    if(result) next(); //if user is allowed to visit this page
                    else{
                        this._errors.push(4);
                        res.redirect("/dashboard/system/overview");
                    }
                }).bind(this));
            }
            else res.redirect("/dashboard/system/overview");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/logs", (function(req, res){
        this._dataManager.getLogs((function(logs){
            res.render("./dashboard/system/logs.jade", {
                logs: logs,
                errors: this._getErrors()
            });
        }).bind(this));
    }).bind(this));
}
inherits(SystemDashboard, Subapp);

module.exports = SystemDashboard;
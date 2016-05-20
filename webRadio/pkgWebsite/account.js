var Subapp = require("./subapp");
var inherits = require("util").inherits;

/**
 * file to define what the account app has to provide
 */

/**
 * @constructor
 * @param dataManager
 * @param channelManager
 */
function Account(dataManager, channelManager){
    if(!(this instanceof Account)) return(new Account(dataManager, channelManager));
    Subapp.call(this, dataManager, channelManager);
    
    this._app.get("/", function(req, res){
        res.redirect("/account/overview");
    });
    
    this._app.all(["/overview", "/modifyUser", "/removeUser"], (function(req, res, next){ //if user is already logged in
        if((typeof(req.session['userId']) === "undefined")) res.redirect("/account/login");
        else next();
    }).bind(this));
    
    this._app.get("/overview", (function(req, res){
        this._dataManager.getUser({
            id: req.session['userId']
        }, function(userData){
            res.render("./account/overview.jade", { userData: userData });
        });
    }).bind(this));
    
    this._app.get("/login", function(req, res){
        res.render("./account/login.jade");
    });
    
    this._app.get("/logout", (function(req, res){
        req.session.destroy(); //session reset
        this._removeCookies(res);
        
        res.redirect("/website/homepage");
    }).bind(this));
    
    this._app.post("/checkLogin", (function(req, res){
        this._dataManager.checkUser({
            email: req.body.txtEmail,
            password: req.body.txtPassword
        }, (function(userId){
            if(userId && userId >= 0) req.session['userId'] = userId;
            
            if(req.body.chkRememberMe) this._setCookies(req, res);
            
            res.redirect("/website/homepage");
        }).bind(this));
    }).bind(this));
    
    this._app.get("/signup", function(req, res){
        res.render("./account/signup.jade");
    });
    
    this._app.post("/addUser", (function(req, res){
        this._dataManager.addUser({
            firstName: req.body.txtFirstName,
            lastName: req.body.txtLastName,
            email: req.body.txtEmail,
            password: req.body.txtPassword
        }, (function(userId){
            if(userId >= 0){
                req.session['userId'] = userId;
                if(typeof(req.session['userId']) !== "undefined") req.session.destroy(); //it deletes old session data
                if(req.body.chkRememberMe) this._setCookies(req, res);
            }
        
            res.redirect("/account/");
        }).bind(this));
        
    }).bind(this));
    
    this._app.post("/modifyUser", (function(req, res){
        this._dataManager.mpdifyUser({
            id: req.session['userId'],
            firstName: req.body.txtFirstName,
            lastName: req.body.txtLastName,
            email: req.body.txtEmail,
            password: req.body.txtPassword
        }, function(userId){
            res.redirect("/account/");
        });
    }).bind(this));
    
    this._app.post("/removeUser", (function(req, res){
        this._dataManager.removeUser({
            id: req.session['userId']
        }, function(result){
            if(result)  res.redirect("/account/logout");
        });
    }).bind(this));
}
inherits(Account, Subapp);

/**
 * method to set cookies for login data
 * 
 * @param client request
 * @param server response
 */
Account.prototype._setCookies = function(req, res){
    var maxAge = 30 * 24 * 60 * 60 * 1000; //milliseconds. 30 days
    
    res.cookie("txtEmail", req.body.txtEmail, {
        path: "/account",
        maxAge: maxAge,
        httpOnly: false //modified also by the client
    });
    res.cookie("txtPassword", req.body.txtPassword, {
        path: "/account",
        maxAge: maxAge,
        httpOnly: false //modified also by the client
    });
};

/**
 * method to remove cookies for login data
 * 
 * @param server response
 */
Account.prototype._removeCookies = function(res){ //IMPORTANT: to test...
    res.clearCookie("txtEmail", { path: "/account" });
    res.clearCookie("txtPassword", { path: "/account" });
};

module.exports = Account;
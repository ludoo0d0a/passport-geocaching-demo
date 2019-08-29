import express from 'express';
import passport from 'passport';
import morgan from 'morgan';
import session from 'express-session';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import expressLayouts from 'express-ejs-layouts';

import config from './config/config-api';

import GeocachingStrategy from 'passport-geocaching'
// Can debug with npm link

// or get sources fron original repository 
//import GeocachingStrategy from '../../passport-geocaching/lib/index'

var port = process.env.PORT || 3000;
var GEOCACHING_APP_ID = "--insert-geocaching-app-id-here--"
var GEOCACHING_APP_SECRET = "--insert-geocaching-app-secret-here--";

var callbackURL = 'http://localhost:'+port+'/auth/callback';

if (config){
  GEOCACHING_APP_ID = config.clientID;
  GEOCACHING_APP_SECRET = config.clientSecret ;
  callbackURL = config.callbackURL; 
}
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GeocachingStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
passport.use(new GeocachingStrategy({
    clientID: GEOCACHING_APP_ID,
    clientSecret: GEOCACHING_APP_SECRET,
    // clientID: GEOCACHING_APP_ID,
    // consumerSecret: GEOCACHING_APP_SECRET,

    //You can skip profile request access
    //skipUserProfile: true,
    
    callbackURL: callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    
    //returns accesstoken to be displayed
    profile.token = accessToken;
    
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's Facebook profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Facebook account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(morgan('combined'))
app.use(cookieParser());
app.use(bodyParser.json());

app.use(methodOverride());
app.use(session({ 
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/geocaching
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to geocaching.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/callback
app.get('/auth/geocaching',
  passport.authenticate('geocaching'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

// GET /auth/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
// Be ware tht this url should now be prooperl registered by Groundspeak. Please contact support to add this url.
// A error message will occured if not properly set : The partner application did not give a secure redirect_uri. Please verify with the application the redirect uri is set up correctly and securely.
//
app.get('/auth/callback', 
  passport.authenticate('geocaching', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(port, function () {
  console.log('Example app for passport-geocaching is listening on http://localhost:%d', port);
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

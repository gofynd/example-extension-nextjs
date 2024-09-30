const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const session = require('express-session'); // Import express-session
const next = require('next'); // Import Next.js
const path = require("path");

const isDev = process.env.NODE_ENV !== 'production';
const nextapp = next({ dev: isDev });
const handle = nextapp.getRequestHandler(); // Get request handler for Next.js
// Extension config constants
const EXTENSION_BASEURL = process.env.EXTENSION_BASE_URL; // localtunnel url
const EXTENSION_ID = process.env.EXTENSION_API_KEY;
const EXTENSION_SECRET = process.env.EXTENSION_API_SECRET;

const app = express();
    
// In-memory storage for access token
let accessToken = null;

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ // Set up session middleware
    secret: 'your-secret-key', // Replace with a secure secret
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Set up Passport OAuth2 strategy
function getOauthStrategy(companyId, applicationId){
    let callbackURL = `${EXTENSION_BASEURL}/fp/auth`
    if(applicationId)
        callbackURL = `${EXTENSION_BASEURL}/fp/auth?application_id=${applicationId}`
    return new OAuth2Strategy({
        authorizationURL: `https://api.fynd.com/service/panel/authentication/v1.0/company/${companyId}/oauth/authorize`,
        tokenURL: `https://api.fynd.com/service/panel/authentication/v1.0/company/${companyId}/oauth/token`,
        clientID: EXTENSION_ID,
        clientSecret: EXTENSION_SECRET,
        callbackURL: callbackURL
    },
        (accessToken, refreshToken, profile, cb) => {
            // Store the access token in memory
            accessToken = accessToken; // Use the accessToken variable
            return cb(null, { accessToken });
        }
    );
}

// OAuth authentication route
app.get('/fp/install', (req, res, next) => {
    const state = Buffer.from(JSON.stringify("abcefg")).toString('base64');

    passport.use(getOauthStrategy(req.query.company_id, req.query.application_id)); // Dynamic company_id

    const authenticator = passport.authenticate('oauth2', { scope: [], state });

    authenticator(req, res, next);
});

// OAuth callback route
app.get('/fp/auth', passport.authenticate('oauth2', { failureRedirect: '/' }), (req, res) => {
    accessToken = req.user.accessToken;
    if(req.query.application_id)
        return res.redirect(301, `${process.env.EXTENSION_BASE_URL}/company/${req.query.company_id}/application/${req.query.application_id}`)
    else
        return res.redirect(301, `${process.env.EXTENSION_BASE_URL}/company/${req.query.company_id}`)
});

// API to get access token
app.get('/api/token', (req, res) => {
    if (accessToken) {
        return res.json({ accessToken });
    } else {
        res.status(404).json({ message: 'No access token available. Authenticate first.' });
    }
});

// Start the server
if(!isDev)
    app.use('/_next', express.static(path.join(__dirname, 'public/build')));
app.all('*', (req, res) => {
    return handle(req, res); // Handle all other requests with Next.js
});

// Start the server
nextapp.prepare().then(() => {
    const PORT = process.env.FRONTEND_PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
});

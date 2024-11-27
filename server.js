// Import required modules and dependencies
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const session = require('express-session');
const next = require('next');
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const sqliteInstance = new sqlite3.Database('session_storage.db');
const SQLiteStorage = require("./sqlite");
const sQLiteStorageInstace = new SQLiteStorage(sqliteInstance, "sqlite_prefix");
const Session = require("./session/session");
const SessionStorage = require("./session/session_storage");
const cookieParser = require('cookie-parser');

// Set up environment and Next.js app
const isDev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev: isDev });
const handle = nextApp.getRequestHandler(); // Next.js request handler

// Extension configuration constants from environment variables
const SESSION_COOKIE_NAME = "ext_session";
const EXTENSION_BASEURL = process.env.EXTENSION_BASE_URL;
const EXTENSION_ID = process.env.EXTENSION_API_KEY;
const EXTENSION_SECRET = process.env.EXTENSION_API_SECRET;
const FP_API_DOMAIN = process.env.FP_API_DOMAIN || 'https://api.fynd.com'

// Initialize Express app
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware to parse cookies with a secret key
app.use(cookieParser("ext.session"));

// Set up session handling with express-session
app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret
    resave: false,
    saveUninitialized: true,
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Serialize user to the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Function to configure and return the OAuth2 strategy
function getOAuthStrategy(companyId, applicationId) {
    const callbackURL = applicationId
        ? `${EXTENSION_BASEURL}/fp/auth?application_id=${applicationId}`
        : `${EXTENSION_BASEURL}/fp/auth`;
    return new OAuth2Strategy({
        authorizationURL: `${FP_API_DOMAIN}/service/panel/authentication/v1.0/company/${companyId}/oauth/authorize`,
        tokenURL: `${FP_API_DOMAIN}/service/panel/authentication/v1.0/company/${companyId}/oauth/token`,
        clientID: EXTENSION_ID,
        clientSecret: EXTENSION_SECRET,
        callbackURL,
        passReqToCallback: true
    },
        (req, accessToken, refreshToken, token, profile, cb) => {
            req.token = token;
            return cb(null, { accessToken });
        }
    );
}

// OAuth authentication route
app.get('/fp/install', async (req, res, next) => {
    try {
        let companyId = parseInt(req.query.company_id);
        const state = Buffer.from(JSON.stringify("abcefg")).toString('base64');
        let extensionScope = [];
        let session = new Session(Session.generateSessionId(true));
        let redirectPath = req.query.redirect_path;
        let sessionExpires = new Date(Date.now() + 900000); // 15 min

        if (session.isNew) {
            session.company_id = companyId;
            session.scope = extensionScope;
            session.expires = sessionExpires;
            session.access_mode = 'online'; // Always generate online mode token for extension launch
            session.extension_id = EXTENSION_ID;
            session.redirect_path = redirectPath;
        } else {
            if (session.expires) {
                session.expires = new Date(session.expires);
            }
        }

        req.fdkSession = session;
        const compCookieName = `${SESSION_COOKIE_NAME}_${companyId}`
        res.header['x-company-id'] = companyId;
        res.cookie(compCookieName, session.id, {
            secure: true,
            httpOnly: true,
            expires: session.expires,
            signed: true,
            sameSite: "None"
        });
        session.state = state;
        passport.use(getOAuthStrategy(req.query.company_id, req.query.application_id));
        const authenticator = passport.authenticate('oauth2', { scope: extensionScope, state });
        authenticator(req, res, next);
        await SessionStorage.saveSession(session, sQLiteStorageInstace);
    }
    catch (error) {
        console.error("Error during /fp/install route:", error.message);
        res.status(500).send({ error: `Error during /fp/install route: ${error.message}` });
    }
});

// OAuth callback route
app.get('/fp/auth', passport.authenticate('oauth2', { failureRedirect: '/' }), sessionMiddleware(false), async (req, res) => {
    try {
        if (!req.fdkSession) {
            throw new Error("Can not complete oauth process as session not found");
        }

        const companyId = req.fdkSession.company_id
        const { token } = req;
        let sessionExpires = new Date(Date.now() + token.expires_in * 1000);

        req.fdkSession.expires = sessionExpires;
        token.access_token_validity = sessionExpires.getTime();
        req.fdkSession.updateToken(token);

        await SessionStorage.saveSession(req.fdkSession, sQLiteStorageInstace);
        const compCookieName = `${SESSION_COOKIE_NAME}_${companyId}`
        res.cookie(compCookieName, req.fdkSession.id, {
            secure: true,
            httpOnly: true,
            expires: sessionExpires,
            signed: true,
            sameSite: "None"
        });
        res.header['x-company-id'] = companyId;

        // Subscribe to a specific event
        await configureWebhookSubscriber(
            token.access_token,
            req.query.company_id,
        );
        // Redirect based on company or application ID
        const redirectUrl = req.query.application_id
            ? `${process.env.EXTENSION_BASE_URL}/company/${req.query.company_id}/application/${req.query.application_id}`
            : `${process.env.EXTENSION_BASE_URL}/company/${req.query.company_id}`;

        return res.redirect(301, redirectUrl);
    }
    catch (error) {
        console.error("Error during /fp/auth route:", error.message);
        res.status(500).send({ error: `Error during /fp/auth route: ${error.message}` });
    }
});

app.post('/fp/uninstall', (req, res) => {
    // Write your cleanup logic to be executed after the extension is uninstalled.
    res.json({ success: true });
});

//TODO: Add check to make sure webhook call is coming through legit source.
app.post('/ext/webhook', (req, res) => {
    try {
        console.log(`Webhook Event: ${JSON.stringify(req.body.event)} received`)
        return res.status(200).json({ "success": true });
    } catch (err) {
        console.error(`Error Processing ${req.body.event} Webhook`);
        return res.status(500).json({ "success": false });
    }
});

// API route to fetch access token
app.get('/api/token', sessionMiddleware(true), async (req, res) => {
    let access_token = req.fdkSession.access_token;
    if (access_token) {
        return res.json({ access_token });
    } else {
        res.status(404).json({ message: 'No access token available. Authenticate first.' });
    }
});


function sessionMiddleware(strict) {
    return async (req, res, next) => {
        try {
            const companyId = req.headers['x-company-id'] || req.query['company_id'];
            const compCookieName = `${SESSION_COOKIE_NAME}_${companyId}`
            let sessionId = req.signedCookies[compCookieName];
            req.fdkSession = await SessionStorage.getSession(sessionId, sQLiteStorageInstace);

            if (strict && !req.fdkSession) {
                return res.status(401).json({ "message": "unauthorized" });
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

// Function to configure webhook subscriber
// Check here for available webhook events https://partners.fynd.com/help/docs/webhooks/overview
async function configureWebhookSubscriber(accessToken, companyId) {
    try {
        const requestOptions = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: process.env.EXTENSION_API_KEY,
                webhook_url: `${process.env.EXTENSION_BASE_URL}/ext/webhook`,
                association: {
                    company_id: companyId,
                    criteria: 'ALL',
                },
                auth_meta: {
                    type: 'hmac',
                    secret: process.env.EXTENSION_API_SECRET,
                },
                email_id: 'dev@gofynd.com',
                events: [
                    { slug: 'company/product/delete/v1' }
                ],
                status: 'active',
                provider: 'rest'
            }),
        };

        const response = await fetch(
            `${FP_API_DOMAIN}/service/platform/webhook/v2.0/company/${companyId}/subscriber`,
            requestOptions
        );
        return response.json(); // Return subscriber config data
    }
    catch (error) {
        console.error(`Error while fetching webhook subscriber configuration, Reason: ${error.message}`);
    }
}

// Serve static files from the 'build' directory in production
if (!isDev)
    app.use('/_next', express.static(path.join(__dirname, 'public/build')));

// Handle all other requests with Next.js
app.all('*', (req, res) => {
    return handle(req, res);
});

// Prepare and start the server
let server;
nextApp.prepare().then(() => {
    const PORT = process.env.FRONTEND_PORT || 3000;
    server = app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
})

const getServerInstance = () => {
    return server
}

module.exports = { app, getServerInstance };
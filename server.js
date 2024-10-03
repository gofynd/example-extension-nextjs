// Import required modules and dependencies
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const session = require('express-session');
const next = require('next');
const path = require("path");

// Set up environment and Next.js app
const isDev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev: isDev });
const handle = nextApp.getRequestHandler(); // Next.js request handler

// Extension configuration constants from environment variables
const EXTENSION_BASEURL = process.env.EXTENSION_BASE_URL;
const EXTENSION_ID = process.env.EXTENSION_API_KEY;
const EXTENSION_SECRET = process.env.EXTENSION_API_SECRET;
const EXTENSION_CLUSTER_URL = process.env.EXTENSION_CLUSTER_URL || 'https://api.fynd.com'

// Extension webhook configuration
// Add/Update this configuration as per need.
const webhookConfig = [
    {
        event_category: 'company',
        event_name: 'product',
        event_type: 'delete',
        version: '1',
    },
]

// Initialize Express app
const app = express();

// In-memory storage for the access token
let accessToken = null;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
        authorizationURL: `${EXTENSION_CLUSTER_URL}/service/panel/authentication/v1.0/company/${companyId}/oauth/authorize`,
        tokenURL: `${EXTENSION_CLUSTER_URL}/service/panel/authentication/v1.0/company/${companyId}/oauth/token`,
        clientID: EXTENSION_ID,
        clientSecret: EXTENSION_SECRET,
        callbackURL
    },
        (accessToken, refreshToken, profile, cb) => {
            // Store access token in memory
            accessToken = accessToken;
            return cb(null, { accessToken });
        }
    );
}

// OAuth authentication route
app.get('/fp/install', (req, res, next) => {
    const state = Buffer.from(JSON.stringify("abcefg")).toString('base64');
    passport.use(getOAuthStrategy(req.query.company_id, req.query.application_id));
    const authenticator = passport.authenticate('oauth2', { scope: [], state });
    authenticator(req, res, next);
});

// Function to query event details
async function queryEventDetails(accessToken) {
    const requestOptions = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookConfig),
    };

    const response = await fetch(
        `${EXTENSION_CLUSTER_URL}/service/common/webhook/v1.0/events/query-event-details`,
        requestOptions
    );
    return response.json(); // Return event data
}

// Function to configure webhook subscriber
async function configureWebhookSubscriber(accessToken, companyId, eventIds) {
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
            event_id: eventIds,
            status: 'active',
        }),
    };

    const response = await fetch(
        `${EXTENSION_CLUSTER_URL}/service/platform/webhook/v1.0/company/${companyId}/subscriber`,
        requestOptions
    );
    return response.json(); // Return subscriber config data
}

// OAuth callback route
app.get('/fp/auth', passport.authenticate('oauth2', { failureRedirect: '/' }), async (req, res) => {
    accessToken = req.user.accessToken;

    const eventData = await queryEventDetails(accessToken);
    const eventIds = eventData.event_configs.map((event) => event.id)
    const subscriberData = await configureWebhookSubscriber(
        accessToken,
        req.query.company_id,
        eventIds
    );

    console.log('Event Data:', eventData);
    console.log('Subscriber Data:', subscriberData);

    // Redirect based on company or application ID
    const redirectUrl = req.query.application_id
        ? `${process.env.EXTENSION_BASE_URL}/company/${req.query.company_id}/application/${req.query.application_id}`
        : `${process.env.EXTENSION_BASE_URL}/company/${req.query.company_id}`;

    return res.redirect(301, redirectUrl);
});

// API route to fetch access token
app.get('/api/token', (req, res) => {
    if (accessToken) {
        return res.json({ accessToken });
    } else {
        res.status(404).json({ message: 'No access token available. Authenticate first.' });
    }
});

app.post('/fp/uninstall', (req, res) => {
    // Write your cleanup logic to be executed after the extension is uninstalled.
    res.json({ success: true });
});

app.post('/ext/webhook', (req, res) => {
    try {
        console.log(`Webhook Event: ${JSON.stringify(req.body.event)} received`)
        return res.status(200).json({ "success": true });
    } catch (err) {
        console.log(`Error Processing ${req.body.event} Webhook`);
        return res.status(500).json({ "success": false });
    }
});

// Serve static files from the 'build' directory in production
if (!isDev)
    app.use('/_next', express.static(path.join(__dirname, 'public/build')));

// Handle all other requests with Next.js
app.all('*', (req, res) => {
    return handle(req, res);
});

// Prepare and start the server
const startServer = async () => {
    await nextApp.prepare();
    const PORT = process.env.FRONTEND_PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
}

module.exports = { app, startServer };
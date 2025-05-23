module.exports = {
    SESSION_COOKIE_NAME: 'ext_session',
    EXTENSION_BASEURL: process.env.EXTENSION_BASE_URL,
    EXTENSION_ID: process.env.EXTENSION_API_KEY,
    EXTENSION_SECRET: process.env.EXTENSION_API_SECRET,
    FP_API_DOMAIN: process.env.FP_API_DOMAIN || 'https://api.fynd.com',
};

module.exports = {
    SECRET_KEY: 'your-secret-key',
    SESSION_COOKIE_NAME: 'ext_session',
    EXTENSION_BASEURL: process.env.EXTENSION_BASE_URL,
    EXTENSION_ID: process.env.EXTENSION_API_KEY,
    EXTENSION_SECRET: process.env.EXTENSION_API_SECRET,
    EXTENSION_CLUSTER_URL: process.env.EXTENSION_CLUSTER_URL || 'https://api.fynd.com',
};
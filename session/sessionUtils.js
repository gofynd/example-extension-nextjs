const SessionStorage = require('../session/session_storage');
const config = require('../config');

const { SESSION_COOKIE_NAME } = config;

async function getSessionFromRequest(req, companyId) {
  try {
    let cookies;

    if (req.signedCookies) {
      // For Express.js requests
      cookies = req.signedCookies;
    } else {
      // For Next.js requests
      cookies = req.headers.cookie || '';
    }

    const compCookieName = `${SESSION_COOKIE_NAME}_${companyId}`;
    const sessionId = cookies[compCookieName];

    if (!sessionId) {
      return null;
    }

    // Retrieve session from storage
    const session = await SessionStorage.getSession(sessionId);
    return session;
  } catch (error) {
    console.error('Error retrieving session:', error);
    throw error;
  }
}

module.exports = {
  getSessionFromRequest
};

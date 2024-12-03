jest.mock('next', () => () => ({
  prepare: jest.fn().mockResolvedValue(true),
  getRequestHandler: jest.fn(() => (req, res) => res.end('Handled by Next.js')),
}));

const request = require('supertest');
const { app } = require('../../server');
const SESSION_COOKIE_NAME = 'ext_session';
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
require('jest-fetch-mock').enableMocks();

app.use(cookieParser('ext.session'));

// Mock external dependencies like passport and OAuth2Strategy
jest.mock('passport', () => ({
  authenticate: jest.fn((strategy, options) => (req, res, next) => {
    if (req.path === '/fp/install') {
      // Simulate redirect to OAuth provider
      res.redirect('/oauth/authorize');
    } else if (req.path === '/fp/auth' && !req.headers.cookie) {
      // Simulate authentication failure
      res.redirect(options.failureRedirect);
    } else {
      // Simulate successful authentication
      req.token = {
        access_token: 'oa-f578996c66883edade7889ba4dc86a3f8dfc897a',
        token_type: 'Bearer',
        expires_in: 7199,
        refresh_token: 'oa-refresh-token',
        scope: ['company/*', 'app/*/*'],
      };
      req.user = { accessToken: req.token.access_token };
      next();
    }
  }),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  use: jest.fn(),
}));

// Mock SessionStorage
jest.mock('../../session/session_storage', () => ({
  saveSession: jest.fn().mockResolvedValue(true),
  getSession: jest.fn().mockImplementation(async (sessionId) => {
    if (!sessionId) return null; // Simulate session not found when sessionId is undefined
    const Session = require('../../session/session');
    const session = new Session(sessionId, false);
    session.company_id = 123;
    session.expires = new Date(Date.now() + 900000);
    session.access_token = 'oa-f578996c66883edade7889ba4dc86a3f8dfc897a';
    return session;
  }),
  deleteSession: jest.fn().mockResolvedValue(true),
}));

// Mock hmacSHA256 to return a predictable signature
jest.mock('crypto-js/hmac-sha256', () => {
  return jest.fn(() => ({
    toString: jest.fn(() => 'mock_signature'),
  }));
});

describe('Custom Next.js server', () => {
  let sessionCookieValue = '';

  it('POST /ext/webhook: Should receive webhook event successfully', async () => {
    const res = await request(app)
      .post('/ext/webhook')
      .set('x-fp-signature', 'mock_signature')
      .send({ event: 'sample_event' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true });
  });

  it('GET /fp/install: Should initiate extension launch flow', async () => {
    const res = await request(app).get('/fp/install?company_id=123&application_id=abc');

    // Extract the session cookie from the Set-Cookie header
    const setCookieHeader = res.headers['set-cookie'][0];
    const cookies = cookie.parse(setCookieHeader);
    const compCookieName = `${SESSION_COOKIE_NAME}_123`;
    const rawCookieValue = cookies[compCookieName];
    sessionCookieValue = decodeURIComponent(rawCookieValue); // Decode URL-encoded cookie value

    expect(res.statusCode).toEqual(302); // Expecting a redirect
    expect(res.headers.location).toEqual('/oauth/authorize');
  });

  it('GET /fp/auth: Should return access token and subscribe to webhook event', async () => {
    // Mock the response for the /subscriber endpoint
    fetch.mockImplementationOnce(async (url) => {
      if (url.includes('/subscriber')) {
        return {
          json: async () => ({
            success: true,
          }),
        };
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const compCookieName = `${SESSION_COOKIE_NAME}_123`;
    const cookieHeader = cookie.serialize(compCookieName, sessionCookieValue);

    const response = await request(app)
      .get('/fp/auth?company_id=123')
      .set('Cookie', [cookieHeader])
      .send();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      `${process.env.FP_API_DOMAIN}/service/platform/webhook/v2.0/company/123/subscriber`,
      expect.any(Object)
    );

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe(`${process.env.EXTENSION_BASE_URL}/company/123`);
  });

  it('GET /fp/auth: Should fail if session not found', async () => {
    const response = await request(app)
      .get('/fp/auth?company_id=123')
      .send();
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('POST /fp/uninstall: Should handle extension uninstall event', async () => {
    const res = await request(app).post('/fp/uninstall');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true });
  });
});

const request = require('supertest');
const { app, getServerInstance } = require('../../server');
const SESSION_COOKIE_NAME = "ext_session";
const cookieParser = require('cookie-parser');
require('jest-fetch-mock').enableMocks();
app.use(cookieParser);

// Mock external dependencies like passport and OAuth2Strategy
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    req.token = {
      access_token: "oa-f578996c66883edade7889ba4dc86a3f8dfc897a",
      token_type: "Bearer",
      expires_in: 7199,
      refresh_token: "oa-refresh-token",
      scope: [
        "company/*",
        "app/*/*"
      ]
    };
    req.user = { accessToken: req.token.access_token };
    next();
  }),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  use: jest.fn(),
}));

// Mock next.js's handler
jest.mock('next', () => () => ({
  prepare: jest.fn().mockResolvedValue(true),
  getRequestHandler: jest.fn(() => (req, res) => res.end('Handled by Next.js')),
}));

describe('Custom Next.js server', () => {
  let cookie = "";
  afterAll((done) => {
    // Close the server after tests are complete
    const server = getServerInstance();
    server.close(done);
  });

  it('POST /ext/webhook: Should recieve webhook event successfully', async () => {
    const res = await request(app)
      .post('/ext/webhook')
      .send({ event: 'sample_event' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true });
  });

  it('GET /fp/install: Should initiate extension launch flow', async () => {
    const res = await request(app).get('/fp/install?company_id=123&application_id=abc');
    cookie = res.headers['set-cookie'][0].split(",")[0].split("=")[1];
    expect(res.statusCode).toEqual(200);
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
    const response = await request(app)
      .get(`/fp/auth?company_id=123`)
      .set('cookie', `${SESSION_COOKIE_NAME}_123=${cookie}`)
      .send();
    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenNthCalledWith(1,
      `${process.env.FP_API_DOMAIN}/service/platform/webhook/v2.0/company/123/subscriber`,
      expect.any(Object)
    );

    expect(response.status).toBe(301);
    expect(response.headers.location).toBe(`${process.env.EXTENSION_BASE_URL}/company/123`);
  });

  it('GET /fp/auth: Should fail if session not found', async () => {
    const response = await request(app)
      .get(`/fp/auth?company_id=123`)
      .send();
    expect(response.status).toBe(500);
  })

  it('POST /fp/uninstall: Should handle extension uninstall event', async () => {
    const res = await request(app).post('/fp/uninstall');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true });
  });

  it('GET /api/token: Should return access token', async () => {
    const res = await request(app).get('/api/token')
      .set('cookie', `${SESSION_COOKIE_NAME}_123=${cookie}`)
      .set('x-company-id', '123')
      .send();
    expect(res.statusCode).toEqual(200);
  });

  it('GET /api/token: Should return 404 with no token', async () => {
    const res = await request(app).get('/api/token')
      .send();
    expect(res.statusCode).toEqual(401);
  });

});

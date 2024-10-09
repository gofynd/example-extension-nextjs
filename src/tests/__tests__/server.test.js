const request = require('supertest');
const { app } = require('../../../server');
require('jest-fetch-mock').enableMocks();

// Mock external dependencies like passport and OAuth2Strategy
jest.mock('passport', () => ({
  authenticate: jest.fn(() => (req, res, next) => {
    req.user = { accessToken: 'mockedAccessToken' };
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
  it('GET /api/token: Should return 404 with no token', async () => {
    const res = await request(app).get('/api/token');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({ message: 'No access token available. Authenticate first.' });
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
    expect(res.statusCode).toEqual(200);
  });
  
  it('GET /fp/auth: Should return access token and subscribe to webhook event', async () => {
    // Mock the fetch request for queryEventDetails
    fetch.mockImplementationOnce(async (url) => {
      if (url.includes('/query-event-details')) {
        return {
          json: async () => ({
            event_configs: [{ id: 'mockedEventId1' }],
          }),
        };
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

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
      .get('/fp/auth')
      .query({ company_id: '123' });
    expect(fetch).toHaveBeenCalledTimes(2);
    
    expect(fetch).toHaveBeenNthCalledWith(1,
      `${process.env.EXTENSION_CLUSTER_URL}/service/common/webhook/v1.0/events/query-event-details`,
      expect.any(Object)
    );

    expect(fetch).toHaveBeenNthCalledWith(2,
      `${process.env.EXTENSION_CLUSTER_URL}/service/platform/webhook/v1.0/company/123/subscriber`,
      expect.any(Object)
    );
    
    expect(response.status).toBe(301);
    expect(response.headers.location).toBe(`${process.env.EXTENSION_BASE_URL}/company/123`);
  });

  it('POST /fp/uninstall: Should handle extension uninstall event', async () => {
    const res = await request(app).post('/fp/uninstall');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ success: true });
  });

  it('GET /api/token: Should return the access token after successfull auth', async () => {
    global.accessToken = 'mockedAccessToken';
    const res = await request(app).get('/api/token');
    expect(res.statusCode).toEqual(200);
    global.accessToken = null;
  });
});

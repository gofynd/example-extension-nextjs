const { getSessionFromRequest } = require('../../../session/sessionUtils');
const SessionStorage = require('../../../session/session_storage');

jest.mock('../../../session/session_storage', () => ({
  getSession: jest.fn(),
}));

describe('Session Utils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get session from Express.js request with signed cookies', async () => {
    const req = {
      signedCookies: {
        ext_session_123: 'session-id',
      },
    };
    SessionStorage.getSession.mockResolvedValue({ id: 'session-id', company_id: 123 });
    const session = await getSessionFromRequest(req, 123);
    expect(SessionStorage.getSession).toHaveBeenCalledWith('session-id');
    expect(session).toEqual({ id: 'session-id', company_id: 123 });
  });

  it('should return null if session ID is missing', async () => {
    const req = {
      signedCookies: {},
    };
    const session = await getSessionFromRequest(req, 123);
    expect(session).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const req = {
      signedCookies: {
        ext_session_123: 'session-id',
      },
    };
    SessionStorage.getSession.mockRejectedValue(new Error('Database error'));
    await expect(getSessionFromRequest(req, 123)).rejects.toThrow('Database error');
  });
});

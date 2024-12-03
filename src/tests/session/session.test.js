const Session = require('../../../session/session');
const { v4: uuidv4 } = require('uuid');

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('Session Class', () => {
  it('should create a new session with default values', () => {
    const session = new Session('session-id');
    expect(session.id).toBe('session-id');
    expect(session.isNew).toBe(true);
    expect(session.company_id).toBeNull();
    // ... check other default properties
  });

  it('should clone a session correctly', () => {
    const originalSession = new Session('original-id');
    originalSession.company_id = 123;
    const clonedSession = Session.cloneSession('cloned-id', originalSession);
    expect(clonedSession.id).toBe('cloned-id');
    expect(clonedSession.company_id).toBe(123);
    expect(clonedSession.isNew).toBe(true);
  });

  it('should serialize to JSON correctly', () => {
    const session = new Session('session-id');
    session.company_id = 123;
    const json = session.toJSON();
    expect(json).toEqual({
      company_id: 123,
      organization_id: null,
      state: null,
      scope: null,
      expires: null,
      access_mode: 'online',
      access_token: null,
      current_user: null,
      refresh_token: null,
      expires_in: null,
      extension_id: null,
      access_token_validity: null,
      redirect_path: null,
    });
  });

  it('should update tokens correctly', () => {
    const session = new Session('session-id');
    const rawToken = {
      access_mode: 'offline',
      access_token: 'access-token',
      current_user: { id: 'user-id' },
      refresh_token: 'refresh-token',
      expires_in: 3600,
      access_token_validity: Date.now() + 3600 * 1000,
    };
    session.updateToken(rawToken);
    expect(session.access_mode).toBe('offline');
    expect(session.access_token).toBe('access-token');
    expect(session.current_user).toEqual({ id: 'user-id' });
    expect(session.refresh_token).toBe('refresh-token');
    expect(session.expires_in).toBe(3600);
    expect(session.access_token_validity).toBe(rawToken.access_token_validity);
  });

  it('should generate a valid session ID', () => {
    const sessionId = Session.generateSessionId();
    expect(sessionId).toBe('mock-uuid');
    expect(uuidv4).toHaveBeenCalled();
  });
});

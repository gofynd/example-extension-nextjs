const SessionStorage = require('../../../session/session_storage');
const Session = require('../../../session/session');

jest.mock('../../../storage/sqliteInstance', () => ({
  setex: jest.fn().mockResolvedValue(true),
  set: jest.fn().mockResolvedValue(true),
  get: jest.fn().mockResolvedValue(JSON.stringify({ company_id: 123 })),
  del: jest.fn().mockResolvedValue(true),
}));

describe('SessionStorage', () => {
  const sQLiteStorageInstance = require('../../../storage/sqliteInstance');

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save a session with TTL', async () => {
    const session = new Session('session-id');
    session.expires = new Date(Date.now() + 3600 * 1000);
    await SessionStorage.saveSession(session);
    expect(sQLiteStorageInstance.setex).toHaveBeenCalled();
  });

  it('should save a session without TTL', async () => {
    const session = new Session('session-id');
    await SessionStorage.saveSession(session);
    expect(sQLiteStorageInstance.set).toHaveBeenCalled();
  });

  it('should retrieve a session', async () => {
    const session = await SessionStorage.getSession('session-id');
    expect(sQLiteStorageInstance.get).toHaveBeenCalledWith('session-id');
    expect(session.company_id).toBe(123);
  });

  it('should return null if session not found', async () => {
    sQLiteStorageInstance.get.mockResolvedValue(null);
    const session = await SessionStorage.getSession('session-id');
    expect(session).toBeNull();
  });

  it('should delete a session', async () => {
    await SessionStorage.deleteSession('session-id');
    expect(sQLiteStorageInstance.del).toHaveBeenCalledWith('session-id');
  });
});

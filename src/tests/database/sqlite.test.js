const SQLiteStorage = require('../../../storage/sqlite');

describe('SQLiteStorage', () => {
  let dbClient;
  let storage;

  beforeEach(() => {
    dbClient = {
      run: jest.fn().mockImplementation((query, params, callback) => callback && callback(null)),
      get: jest.fn().mockImplementation((query, params, callback) => callback(null, { value: 'stored-value', ttl: null })),
    };
    storage = new SQLiteStorage(dbClient, 'test_prefix');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize the storage table', async () => {
    await storage.initializeTable();
    expect(dbClient.run).toHaveBeenCalled();
  });

  it('should get a value', async () => {
    const value = await storage.get('key');
    expect(dbClient.get).toHaveBeenCalledWith(
      'SELECT value, ttl FROM storage WHERE key = ?',
      ['test_prefix:key'],
      expect.any(Function)
    );
    expect(value).toBe('stored-value');
  });

  it('should return null if key not found', async () => {
    dbClient.get.mockImplementation((query, params, callback) => callback(null, undefined));
    const value = await storage.get('key');
    expect(value).toBeNull();
  });

  it('should set a value', async () => {
    await storage.set('key', 'value');
    expect(dbClient.run).toHaveBeenCalledWith(
      'INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['test_prefix:key', 'value']
    );
  });

  it('should set a value with TTL', async () => {
    await storage.setex('key', 'value', 3600);
    expect(dbClient.run).toHaveBeenCalledWith(
      'INSERT INTO storage (key, value, ttl) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, ttl = excluded.ttl',
      ['test_prefix:key', 'value', expect.any(Number)]
    );
  });

  it('should delete a key', async () => {
    await storage.del('key');
    expect(dbClient.run).toHaveBeenCalledWith(
      'DELETE FROM storage WHERE key = ?',
      ['test_prefix:key']
    );
  });
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const SQLiteStorage = require('./sqlite');

const sqliteInstance = new sqlite3.Database(
  path.resolve(process.cwd(), 'session_storage.db')
);

const sQLiteStorageInstance = new SQLiteStorage(sqliteInstance, 'sqlite_prefix');

module.exports = sQLiteStorageInstance;

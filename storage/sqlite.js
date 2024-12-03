'use strict';

class SQLiteStorage {
    constructor(dbClient, prefixKey) {
        if(prefixKey) {
            this.prefixKey = prefixKey + ":";
        } else {
            this.prefixKey = "";
        }
        this.dbClient = dbClient;
        this.initializeTable();
        this.setupTTLChecker();
        this.ttlCheckerInterval = null;
    }

    async initializeTable() {
        const query = `
            CREATE TABLE IF NOT EXISTS storage (
                key TEXT PRIMARY KEY,
                value TEXT,
                ttl INTEGER
            )`;
        await this.dbClient.run(query);
    }

    setupTTLChecker() {
        if (!this.ttlCheckerInterval) {
            this.ttlCheckerInterval = 
                setInterval(async () => {
                    const now = Math.floor(Date.now() / 1000);
                    const deleteQuery = `DELETE FROM storage WHERE ttl < ? AND ttl IS NOT NULL`;
                    await this.dbClient.run(deleteQuery, [now]);
                }, 86400000); // 24 hours in milliseconds
        }
    }

    async get(key) {
        const row = await new Promise((resolve, reject) => {
            this.dbClient.get(`SELECT value, ttl FROM storage WHERE key = ?`, [this.prefixKey + key], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        if (!row) {
            return null;
        }

        const now = Math.floor(Date.now() / 1000);
        if (row.ttl !== null && row.ttl < now) {
            // TTL has expired; delete the key and return null
            await this.del(key);
            return null;
        } else {
            return row.value;
        }
    }

    async set(key, value) {
        return await this.dbClient.run(`INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [this.prefixKey + key, value]);
    }

    async setex(key, value, ttl) {
        const expiresAt = Math.floor(Date.now() / 1000) + ttl;
        return await this.dbClient.run(`INSERT INTO storage (key, value, ttl) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, ttl = excluded.ttl`, [this.prefixKey + key, value, expiresAt]);
    }

    async del(key) {
        return await this.dbClient.run(`DELETE FROM storage WHERE key = ?`, [this.prefixKey + key]);
    }
}

module.exports = SQLiteStorage;
'use strict';
const Session = require("./session");

class SessionStorage {
    constructor() {
    }

    static async saveSession(session, sQLiteStorageInstace) {
        if(session.expires) {
            let ttl = (new Date() - session.expires) / 1000;
            ttl = Math.abs(Math.round(Math.min(ttl, 0)));
            return sQLiteStorageInstace.setex(session.id, JSON.stringify(session.toJSON()), ttl);
        } else {
            return sQLiteStorageInstace.set(session.id, JSON.stringify(session.toJSON()));
        }
    }

    static async getSession(sessionId, sQLiteStorageInstace) {
        let session = await sQLiteStorageInstace.get(sessionId);
        if(session) {
            session = JSON.parse(session);
            session = Session.cloneSession(sessionId, session, false);
        }
        else {
            console.debug(`Session data not found for session id ${sessionId}`);
        }
        return session;
    }

    static async deleteSession(sessionId, sQLiteStorageInstace) {
        return sQLiteStorageInstace.del(sessionId);
    }
}

module.exports = SessionStorage;
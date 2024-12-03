'use strict';
const Session = require("./session");

const sQLiteStorageInstance = require('./../storage/sqliteInstance');

class SessionStorage {
    constructor() {
    }

    static async saveSession(session) {
        if(session.expires) {
            let ttl = (new Date() - session.expires) / 1000;
            ttl = Math.abs(Math.round(Math.min(ttl, 0)));
            return sQLiteStorageInstance.setex(session.id, JSON.stringify(session.toJSON()), ttl);
        } else {
            return sQLiteStorageInstance.set(session.id, JSON.stringify(session.toJSON()));
        }
    }

    static async getSession(sessionId) {
        let session = await sQLiteStorageInstance.get(sessionId);
        if(session) {
            session = JSON.parse(session);
            session = Session.cloneSession(sessionId, session, false);
        }
        else {
            console.debug(`Session data not found for session id ${sessionId}`);
        }
        return session;
    }

    static async deleteSession(sessionId) {
        return sQLiteStorageInstance.del(sessionId);
    }
}

module.exports = SessionStorage;
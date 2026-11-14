export class SyncConflictError extends Error {
    code = 'SYNC_CONFLICT';
    serverEnvelope;
    constructor(serverEnvelope) {
        super('Vault revision conflict');
        this.name = 'SyncConflictError';
        this.serverEnvelope = serverEnvelope;
    }
}
export class AuthError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }
}

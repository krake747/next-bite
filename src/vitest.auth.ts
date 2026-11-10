import { type SessionUser, signedOutAuth } from "@api/auth.identity"
import { type AuthSnapshot, createAuthSnapshot } from "@api/auth.session"

export function authSnapshotFor(user: SessionUser | null): AuthSnapshot {
    const snapshot = createAuthSnapshot()
    snapshot.publish(user === null ? signedOutAuth : { isAuthenticated: true, user })
    return snapshot
}

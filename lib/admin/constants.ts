/**
 * Admin credentials and session cookie config.
 * For now the credentials are hardcoded (single admin user); a future iteration
 * can migrate to a database-backed users collection.
 */
export const ADMIN_USERNAME = 'altaf@vp.com'
export const ADMIN_PASSWORD = 'Altaf123'

export const ADMIN_COOKIE = 'vp_admin_session'
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12 // 12 hours

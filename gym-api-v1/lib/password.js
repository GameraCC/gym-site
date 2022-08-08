const crypto = require('crypto')
const jwt = require('jsonwebtoken')

/**
 * Hashes and salts a password utilizing a global and random hash
 *
 * @param {string} password
 *
 * @returns {Array.<[hash: string, salt: string>}
 */
const generateSaltedHash = (password) => {
    try {
        // Generate random salt
        const salt = crypto.randomBytes(4).toString('hex')

        // Use global salt + random salt to generate password hash
        const hash = crypto
            .createHash('sha256')
            .update(`G$mR4tA_p|${password}|${salt}`)
            .digest('hex')

        return [hash, salt]
    } catch (err) {
        // Don't return errors, log error to cloudwatch
        console.error('Error generating salted hash, error:', err)
        return [null, null]
    }
}

/**
 * Checks whether or not a password & salt match a hash stored in the database
 *
 * @param {string} password - Password to check
 * @param {string} salt - Salt to check
 * @param {string} hash - Hash to compare to
 */
const checkHash = ({password, salt, hash}) => {
    try {
        const generatedHash = crypto
            .createHash('sha256')
            .update(`G$mR4tA_p|${password}|${salt}`)
            .digest('hex')

        if (hash === generatedHash) return true
        else return false
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error checking hash, error:', err)
        return false
    }
}

/**
 * Creates a signed JWT token with payload
 *
 * @param {string} payload - Payload to sign
 * @param {string} key - JWT signing key
 *
 * @returns {string | null} Signed JWT token with base64 encoded payload
 */
const signJWT = (payload, key) => {
    try {
        return jwt.sign(payload, key)
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error signing JWT, error:', err)
        return null
    }
}

/**
 * Verifies a signed JWT token
 *
 * @param {string} token - Signed JWT token to be verified
 * @param {string} key - JWT signing key
 *
 * @returns {Object | false} The verified token payload or false
 */
const verifyJWT = (token, key) => {
    try {
        return jwt.verify(token, key)
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error verifying JWT, error:', err)
        return false
    }
}

module.exports = {
    generateSaltedHash,
    checkHash,
    signJWT,
    verifyJWT
}

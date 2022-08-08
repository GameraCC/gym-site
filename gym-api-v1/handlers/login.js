const {GetUserMetadata} = require('db')
const {
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    UNAUTHORIZED,
    badRequestMessage
} = require('../lib/returns')
const {
    GYM_JWT_ENCRYPTION_KEY,
    GYM_AES_ENCRYPTION_KEY,
    MAX_USERNAME_LENGTH,
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH
} = process.env
const {checkHash, signJWT} = require('../lib/password')
const {encrypt} = require('../lib/crypto')

/**
 * Logs a user in, returning a session token to validate through authorizer-enabled functions
 *
 * @returns {{session: string}} The signed in session token
 */
exports.handler = async (event) => {
    try {
        try {
            // Decode base64 encoded event body if content-type is not application/json
            if (event.isBase64Encoded)
                event.body = Buffer.from(event.body, 'base64').toString('utf-8')

            var {username, password} = JSON.parse(event.body)

            if (!username || !password)
                return badRequestMessage('Falsy input parameters')

            if (username.length > MAX_USERNAME_LENGTH)
                return badRequestMessage('Invalid username length')

            if (
                password.length > MAX_PASSWORD_LENGTH ||
                password.length < MIN_PASSWORD_LENGTH
            ) {
                return badRequestMessage('Invalid password length')
            }
        } catch (err) {
            console.error('Error parsing input parameters, error:', err)
            return BAD_REQUEST
        }

        /**
         * Query user to fetch hash & salt
         *
         * Use salt to hash provided password
         * Compare provided salted & hash password to queried hash
         *
         * if match, generate session token and return success
         * otherwise return invalid username or password
         */

        try {
            var metadata = await GetUserMetadata({username})
        } catch (err) {
            // Username does not exist
            return UNAUTHORIZED
        }

        const isValidPassword = checkHash({
            password,
            salt: metadata.user.salt,
            hash: metadata.user.hash
        })
        if (!isValidPassword) return UNAUTHORIZED

        // Store username & email in client session token to authenticate identity of requests & query database
        // Use returned PK as username for better security, in case of a login exploit in which the user can authenticate to be the provided usernae
        const session = JSON.stringify({
            username: metadata.PK.slice(5), // USER#{USERNAME}
            email: metadata.user.email
        })

        // Generate JWT session token with session info
        const jwt = signJWT(session, GYM_JWT_ENCRYPTION_KEY)
        if (!jwt) return INTERNAL_SERVER_ERROR

        // Encrypt JWT token to protect unencrypted base64 sensitive signed data
        const encrypted = encrypt(jwt, GYM_AES_ENCRYPTION_KEY)
        if (!encrypted) return INTERNAL_SERVER_ERROR

        // Return session token to client
        return {
            statusCode: 200,
            body: JSON.stringify({session: encrypted})
        }
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error logging user in, error:', err)
        return INTERNAL_SERVER_ERROR
    }
}

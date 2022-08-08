const {SignUpUser} = require('db')
const {
    INTERNAL_SERVER_ERROR,
    BAD_REQUEST,
    badRequestMessage
} = require('../lib/returns')
const {generateSaltedHash} = require('../lib/password')
const {generateIat} = require('../lib/tools')
const {signJWT} = require('../lib/password')
const {encrypt} = require('../lib/crypto')
const {
    GYM_JWT_ENCRYPTION_KEY,
    GYM_AES_ENCRYPTION_KEY,
    MAX_USERNAME_LENGTH,
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH
} = process.env

/**
 * Signs up a user, verifying a user with the same email or username does not already exist
 *
 * @returns {{session: string}} The signed in session token
 */
exports.handler = async (event) => {
    try {
        // Parse request input parameters
        try {
            // Decode base64 encoded event body if content-type is not application/json
            if (event.isBase64Encoded)
                event.body = Buffer.from(event.body, 'base64').toString('utf-8')

            var {
                username,
                email,
                password,
                first_name,
                last_name,
                city,
                state,
                country
            } = JSON.parse(event.body)

            // prettier-ignore
            if (
                !username ||
                !email ||
                !password ||
                !first_name ||
                !last_name ||
                !city ||
                !state ||
                !country
            ) throw new Error('Falsy input parameters')

            if (username.length > MAX_USERNAME_LENGTH)
                return badRequestMessage('Invalid username length')

            if (email.length > 320)
                return badRequestMessage('Invalid email length')

            if (
                password.length > MAX_PASSWORD_LENGTH ||
                password.length < MIN_PASSWORD_LENGTH
            ) {
                return badRequestMessage('Invalid password length')
            }

            if (city.length > 32 || state.length > 32 || country.length > 64)
                return badRequestMessage('Invalid location length')

            if (first_name.length >= 32 || last_name.length >= 32)
                return badRequestMessage('Invalid first or last name length')
        } catch (err) {
            console.error('Error parsing input parameters, error:', err)
            return BAD_REQUEST
        }

        // Generate salted hash and random salt to be stored in database for logins
        const [hash, salt] = generateSaltedHash(password)

        try {
            await SignUpUser({
                username,
                email,
                first_name,
                last_name,
                location: {
                    city,
                    state,
                    country
                },
                hash,
                salt,
                ip: event.requestContext.http.sourceIp,
                iat: generateIat()
            })
        } catch (err) {
            return internalServerErrorMessage(
                'Username or email already signed up'
            )
        }

        // Store username & email in client session token to authenticate identity of requests & query database
        const session = JSON.stringify({
            username,
            email
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
        console.error(err)
        return INTERNAL_SERVER_ERROR
    }
}

const {SignUpUser} = require('db')
const {
    INTERNAL_SERVER_ERROR,
    BAD_REQUEST,
    badRequestMessage,
    internalServerErrorMessage
} = require('../lib/returns')
const {generateSaltedHash} = require('../lib/password')
const {generateIat} = require('../lib/tools')
const {signJWT} = require('../lib/password')
const {encrypt} = require('../lib/crypto')
const {GYM_JWT_ENCRYPTION_KEY, GYM_AES_ENCRYPTION_KEY} = process.env
const {
    passwordConstraint,
    emailConstraint,
    usernameConstraint,
    locationConstraint,
    firstNameConstraint,
    lastNameConstraint
} = require('../lib/constraints')

/**
 * Signs up a user, verifying a user with the same email or username does not already exist
 *
 * @param {string} username - The username attempting signup
 * @param {string} email - The email attempting signup
 * @param {string} password - The password attempting signup
 * @param {string} first_name - The first name attempting signup
 * @param {string} last_name - The last name attempting signup
 * @param {string} city - City name attempting signup
 * @param {string} state - State code attempting signup
 * @param {string} country - ISO3 country code attempting signup
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
                !country // Don't valid state or city length as some countries have no states or cities
            ) return badRequestMessage('Falsy input parameters')

            const usernameConstraintCheck = usernameConstraint(username)
            if (usernameConstraintCheck !== true)
                return badRequestMessage(usernameConstraintCheck)

            const emailConstraintCheck = emailConstraint(email)
            if (emailConstraintCheck !== true)
                return badRequestMessage(emailConstraintCheck)

            const passwordConstraintCheck = passwordConstraint(password)
            if (passwordConstraintCheck !== true)
                return badRequestMessage(passwordConstraintCheck)

            const locationConstraintCheck = locationConstraint({
                city,
                state,
                country
            })
            if (locationConstraintCheck !== true)
                return badRequestMessage(locationConstraintCheck)

            const firstNameConstraintCheck = firstNameConstraint(first_name)
            if (firstNameConstraintCheck !== true)
                return badRequestMessage(firstNameConstraintCheck)

            const lastNameConstraintCheck = lastNameConstraint(last_name)
            if (lastNameConstraintCheck !== true)
                return badRequestMessage(lastNameConstraintCheck)
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

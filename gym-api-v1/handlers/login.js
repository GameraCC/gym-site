const {GetUserData} = require('db')
const {
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    UNAUTHORIZED,
    badRequestMessage
} = require('../lib/returns')
const {GYM_JWT_ENCRYPTION_KEY, GYM_AES_ENCRYPTION_KEY} = process.env
const {checkHash, signJWT} = require('../lib/password')
const {encrypt} = require('../lib/crypto')
const {usernameConstraint, passwordConstraint} = require('../lib/constraints')

/**
 * Logs a user in, returning a session token to validate through authorizer-enabled functions
 *
 * @param {string} username - The username to attempting login
 * @param {string} password - The password to attempting login
 *
 * @returns {{session: string}} The signed in session token
 */
exports.handler = async event => {
    try {
        try {
            // Decode base64 encoded event body if content-type is not application/json
            if (event.isBase64Encoded)
                event.body = Buffer.from(event.body, 'base64').toString('utf-8')

            var {username, password} = JSON.parse(event.body)

            // Type check and ensure required properties are present
            if (
                typeof username !== 'string' ||
                typeof password !== 'string' ||
                !username ||
                !password
            )
                return badRequestMessage('Falsy input parameters')

            const usernameConstraintCheck = usernameConstraint(username)
            if (usernameConstraintCheck !== true)
                return badRequestMessage(usernameConstraintCheck)

            const passwordConstraintCheck = passwordConstraint(password)
            if (passwordConstraintCheck !== true)
                return badRequestMessage(passwordConstraintCheck)
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
            const response = await GetUserData({username})

            // Extract metadata & workouts from response
            var metadata = response[0] // Metadata will always be first in response because results are sorted lexicographically descending
            var workouts = response.filter(({SK}) =>
                SK.startsWith(`WORKOUT#${username}`)
            )
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
        const validatedUsername = metadata.PK.slice(5)
        const session = JSON.stringify({
            username: validatedUsername, // USER#{USERNAME}
            email: metadata.user.email
        })

        // Generate JWT session token with session info
        const jwt = signJWT(session, GYM_JWT_ENCRYPTION_KEY)
        if (!jwt) return INTERNAL_SERVER_ERROR

        // Encrypt JWT token to protect unencrypted base64 sensitive signed data
        const encrypted = encrypt(jwt, GYM_AES_ENCRYPTION_KEY)
        if (!encrypted) return INTERNAL_SERVER_ERROR

        // Strip PK, SK, append and return workout name with other workout attributes
        workouts = workouts.map(
            ({SK, workout: {description, exercises, iat}}) => ({
                name: /^(?:.*?#){2}(?<name>.*)/.exec(SK).groups.name, // Extract name from sort key
                description,
                exercises,
                iat
            })
        )

        // Return session token to client
        return {
            statusCode: 200,
            body: JSON.stringify({
                session: encrypted,
                user: {
                    email: metadata.user.email,
                    username: validatedUsername,
                    first_name: metadata.user.first_name,
                    last_name: metadata.user.last_name,
                    profile_picture: metadata.user.profile_picture,
                    bio: metadata.user.bio,
                    location: metadata.user.location
                },
                workouts
            })
        }
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error logging user in, error:', err)
        return INTERNAL_SERVER_ERROR
    }
}

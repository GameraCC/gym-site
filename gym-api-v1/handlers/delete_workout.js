const {DeleteUserWorkout} = require('db')
const {
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    badRequestMessage
} = require('../lib/returns')

/**
 * Creates a workout for a user
 *
 * @param {string} name - The new name of the workout
 */
exports.handler = async event => {
    try {
        const {username} = event.requestContext.authorizer.lambda
        try {
            // Decode base64 encoded event body if content-type is not application/json
            if (event.isBase64Encoded)
                event.body = Buffer.from(event.body, 'base64').toString('utf-8')

            var {name} = JSON.parse(event.body)

            // Type check and ensure required properties are present
            if (typeof name !== 'string' || !name)
                return badRequestMessage('Falsy input parameters')

            if (name.length > 128)
                return badRequestMessage(
                    'Name must be less than 128 characters'
                )
        } catch (err) {
            console.error('Error parsing input parameters, error:', err)
            return BAD_REQUEST
        }

        try {
            await DeleteUserWorkout({
                username,
                name
            })
        } catch (err) {
            return INTERNAL_SERVER_ERROR
        }

        return {
            statusCode: 200
        }
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error editing workout, error:', err)
        return INTERNAL_SERVER_ERROR
    }
}

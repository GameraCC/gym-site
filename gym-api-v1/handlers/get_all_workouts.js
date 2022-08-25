const {GetUserWorkouts} = require('db')
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
            var workouts = await GetUserWorkouts({
                username
            })
        } catch (err) {
            console.error(err)
            return INTERNAL_SERVER_ERROR
        }

        // Strip PK, SK, append and return workout name with other workout attributes
        workouts = workouts.map(
            ({SK, workout: {description, exercises, iat}}) => ({
                name: /^(?:.*?#){2}(?<name>.*)/.exec(SK).groups.name, // Extract name from sort key
                description,
                exercises,
                iat
            })
        )

        return {
            statusCode: 200,
            body: JSON.stringify({workouts})
        }
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error editing workout, error:', err)
        return INTERNAL_SERVER_ERROR
    }
}

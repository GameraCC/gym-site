const {CreateUserWorkout} = require('db')
const {
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR,
    badRequestMessage
} = require('../lib/returns')
const {workoutConstraint} = require('../lib/constraints')
const {generateIat} = require('../lib/tools')

/**
 * A weight
 *
 * @typedef Weight
 *
 * @property {'lb' | 'kg'} unit - The unit of weight
 * @property {number} value - The amount of weight
 */

/**
 * A repetition
 *
 * @typedef Reps
 * @property {'reps' | 'secs' | 'mins' | 'AMRAP'} unit - The unit of reps
 * @property {number} value - The number of reps
 */

/**
 * An exercise
 *
 * @typedef Exercise
 *
 * @property {string} id - Identifier of exercises stored in assets/exercises.json
 * @property {Array.<{sets: number, reps: Reps, weight: Weight}>} parts - Parts of the exercise
 */

/**
 * Creates a workout for a user
 *
 * @param {string} name - Name of workout
 * @param {string} description - Description of workout
 * @param {Array.<Exercise>} exercises - List of exercises in workout
 */
exports.handler = async event => {
    try {
        const {username} = event.requestContext.authorizer.lambda
        try {
            // Decode base64 encoded event body if content-type is not application/json
            if (event.isBase64Encoded)
                event.body = Buffer.from(event.body, 'base64').toString('utf-8')

            var {name, description, exercises} = JSON.parse(event.body)

            // Type check and ensure required properties are present
            if (
                typeof name !== 'string' ||
                typeof description !== 'string' ||
                !Array.isArray(exercises) ||
                !exercises.length ||
                !name
                // Descriptions can be empty, don't validate description length.
            )
                return badRequestMessage('Falsy input parameters')

            const workoutConstraintCheck = workoutConstraint({
                name,
                description,
                exercises
            })
            if (workoutConstraintCheck !== true)
                return badRequestMessage(workoutConstraintCheck)
        } catch (err) {
            console.error('Error parsing input parameters, error:', err)
            return BAD_REQUEST
        }

        try {
            await CreateUserWorkout({
                username,
                name,
                description,
                exercises,
                iat: generateIat()
            })
        } catch (err) {
            // Workout already exists
            return INTERNAL_SERVER_ERROR
        }

        return {
            statusCode: 200
        }
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error creating workout, error:', err)
        return INTERNAL_SERVER_ERROR
    }
}

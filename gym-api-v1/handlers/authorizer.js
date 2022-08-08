const {decrypt} = require('../lib/crypto')
const {verifyJWT} = require('../lib/password')
const {generatePolicy} = require('../lib/policy')

const {GYM_AES_ENCRYPTION_KEY, GYM_JWT_ENCRYPTION_KEY, REGION} = process.env

/**
 * The authorizer is a middleman between API-Gateway
 * and the backend lambda which authorizes requests
 * contingent on the return of this handler
 *
 * Authorizer responses are cached for a period of
 * time, the same session token will utilize
 * a cached policy & context (object containing
 * variables returned from this handler to the
 * backend lambda)
 *
 * More information can be found:
 * - https://www.serverless.com/framework/docs/providers/aws/events/http-api#lambda-request-authorizers
 * - https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html
 * - https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
 */
exports.handler = async (event) => {
    try {
        // prettier-ignore
        // Decrypt the encrypted authorization token
        const decrypted = decrypt(event.identitySource[0], GYM_AES_ENCRYPTION_KEY)
        if (!decrypted) throw new Error()

        // Verify the JWT payload
        const data = verifyJWT(decrypted, GYM_JWT_ENCRYPTION_KEY)
        if (!data) throw new Error()

        /**
         * Generate IAM policy for access to invoke all functions in the lamda gym-api-v1 service, as denoted by the requesting apiId and stage
         *
         * Pass JWT payload claims to backend lambda function via context, context is accessible in a VTL mapping template without a lambda
         * proxy configuration, or by accessing event.requestContext.authorizer.lambda.* in the backend lambda function
         */
        return {
            ...generatePolicy(
                event.identitySource[0],
                'Allow',
                `arn:aws:execute-api:${REGION}:${event.requestContext.accountId}:${event.requestContext.apiId}/${event.requestContext.stage}/*`
            ),
            context: {
                ...data
            }
        }
    } catch (err) {
        // Log error to cloudwatch
        console.error('Error in authorizer handler, error:', err)
        return generatePolicy(
            event.identitySource[0],
            'Deny',
            `arn:aws:execute-api:${REGION}:${event.requestContext.accountId}:${event.requestContext.apiId}/${event.requestContext.stage}/*`
        )
    }
}

/**
 * Generates a lambda access policy, version 1.0 response
 * Version 2.0 is not utilized for compatability with
 * future REST APIs incase AWS WAF is required to be
 * implemented on endpoints such as /signup or /login
 * to prevent malicious attacks
 *
 * @param {*} principalId  - Principal ID of client requesting access
 * @param {string} resource - ARN of resource being granted invocation access
 * @param {'Allow' | 'Deny'} effect - Allow or deny invocation of resource
 * @returns {Object} - Policy to be returned to client, without any context
 */
const generatePolicy = (principalId, effect, resource) => ({
    'principalId': principalId,
    'policyDocument': {
        'Version': '2012-10-17',
        'Statement': [
            {
                'Action': 'execute-api:Invoke',
                'Resource': resource,
                'Effect': effect
            }
        ]
    }
})

module.exports = {generatePolicy}

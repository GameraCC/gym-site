const {DynamoDBClient} = require('@aws-sdk/client-dynamodb')
// Ensure commands are imported from @aws-sdk/lib-dynamodb which marshalls native javascript values
const {
    DynamoDBDocumentClient,
    TransactWriteCommand,
    GetCommand
} = require('@aws-sdk/lib-dynamodb')
const client = new DynamoDBClient({region: 'us-east-1'})

// Use document client to marshall native javascript types instead of defining attribute types in queries
const ddb = new DynamoDBDocumentClient(client)

const {GYM_TABLE_NAME} = process.env

/**
 * Key Structure
 *
 * Signups are ACID transactions to prevent the miniscule chance of a user spamming sign ups and registering a user with the same name or email
 *
 * DEFAULT TABLE
 * PK (HASH)                | SK (RANGE)             | Description
 * USER#{USERNAME}          | #METADATA              | Used to fetch user metadata via username
 * USER#{EMAIL}             | #USER#${USERNAME}      | Used to query all users with an ACID transaction for an existing email, added to table with a signup every time a user is created
 * USER#{USERNAME}          | POST#{TIMESTAMP}       | Used to query posts
 * USER#{USERNAME}          | WORKOUT#{TIMESTAMP}    | Used to query workouts
 * USER#{USERNAME}          | MEAL#{TIMESTAMP}       | Used to query meals
 * USER#{USERNAME}          | #FRIEND#{USERNAME}     | Used to fetch a user's followers accounts
 *
 *
 *
 * INVERSE TABLE (GSI)
 * SK (HASH)                | SK (RANGE)             | Description
 * #FRIEND#{USERNAME}       | USER#{USERNAME}        | Used to fetch a user's following accounts
 */

/**
 * Signs a user up
 *
 * @param {string} username
 * @param {string} email
 * @param {string} first_name
 * @param {string} last_name
 * @param {Object} location
 * @param {string} location.city - Full city name
 * @param {string} location.state - Short form state, e.g: CA, ON, NY
 * @param {string} location.country - Short form country, e.g: USA, CA, FR
 * @param {string} hash
 * @param {string} salt
 * @param {string} ip
 * @param {string} iat
 *
 * @returns {String || false} - Authentication cookie or false if user already exists
 */
const SignUpUser = ({
    username,
    email,
    first_name,
    last_name,
    location: {city, state, country},
    hash,
    salt,
    ip,
    iat
}) =>
    new Promise(async (res, rej) => {
        try {
            const writeEmailIfNonExistant = {
                TableName: GYM_TABLE_NAME,
                ConditionExpression: 'attribute_not_exists(PK)',
                Item: {
                    PK: `USER#${email}`,
                    SK: `#USER#${username}`
                }
            }

            const createUserIfNonExistant = {
                TableName: GYM_TABLE_NAME,
                ConditionExpression: 'attribute_not_exists(PK)',
                Item: {
                    PK: `USER#${username}`,
                    SK: '#METADATA',
                    user: {
                        email,
                        hash,
                        salt,
                        first_name,
                        last_name,
                        profile_picture: '',
                        bio: '',
                        location: {
                            city,
                            state,
                            country
                        },
                        ips: [{iat, ip}]
                    }
                }
            }

            const transaction = new TransactWriteCommand({
                TransactItems: [
                    {Put: writeEmailIfNonExistant},
                    {Put: createUserIfNonExistant}
                ]
            })

            await ddb.send(transaction)

            return res()
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to sign up user, error:',
                err
            )
            return rej()
        }
    })

/**
 * Queries and returns a users metadata
 *
 * @param {string} username
 *
 * @returns
 */
const GetUserMetadata = ({username}) =>
    new Promise(async (res, rej) => {
        try {
            const getUserMetadata = new GetCommand({
                TableName: GYM_TABLE_NAME,
                Key: {
                    PK: `USER#${username}`,
                    SK: '#METADATA'
                },
                ConsistentRead: false // Non-consistent logins don't pose a significant security threat, unlike signups
            })

            const response = await client.send(getUserMetadata)
            if (!response.Item) return rej() // If the polled item is undefined, no items were found

            return res(response.Item)
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to get user metadata, error:',
                err
            )
            return rej()
        }
    })

module.exports = {SignUpUser, GetUserMetadata}

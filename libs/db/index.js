const {DynamoDBClient} = require('@aws-sdk/client-dynamodb')
// Ensure commands are imported from @aws-sdk/lib-dynamodb which marshalls native javascript values
const {
    DynamoDBDocumentClient,
    TransactWriteCommand,
    PutCommand,
    UpdateCommand,
    BatchWriteCommand,
    QueryCommand,
    DeleteCommand
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
 * PK (HASH)                | SK (RANGE)                            | Description
 * USER#{USERNAME}          | #FRIEND#{USERNAME}                    | Used to fetch a user's followers accounts
 * USER#{USERNAME}          | #METADATA                             | Used to fetch user metadata via username
 * USER#{EMAIL}             | #USER#{USERNAME}                      | Used to query all users with an ACID transaction for an existing email, added to table with a signup every time a user is created
 * USER#{USERNAME}          | POST#{USERNAME}#{WORKOUT NAME}        | Used to query posts
 * USER#{USERNAME}          | WORKOUT#{USERNAME}#{WORKOUT NAME}     | Used to query workouts
 * USER#{USERNAME}          | MEAL#{USERNAME}{WORKOUT NAME}         | Used to query meals
 *
 *
 *
 * INVERSE TABLE (GSI)
 * SK (HASH)                | PK (RANGE)             | Description
 * #FRIEND#{USERNAME}       | USER#{USERNAME}        | Used to fetch a user's following accounts
 */

/**
 * Signs a user up
 *
 * @param {Object} args
 * @param {string} args.username
 * @param {string} args.email
 * @param {string} args.first_name
 * @param {string} args.last_name
 * @param {Object} args.location
 * @param {string} args.location.city - Full city name
 * @param {string} args.location.state - Short form state, e.g: CA, ON, NY
 * @param {string} args.location.country - Short form country, e.g: USA, CA, FR
 * @param {string} args.hash
 * @param {string} args.salt
 * @param {string} args.ip
 * @param {number} args.iat
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
 * Queries and returns a users metadata & workouts
 *
 * @param {Object} args
 * @param {string} args.username
 *
 * @returns
 */
const GetUserData = ({username}) =>
    new Promise(async (res, rej) => {
        try {
            const getUserMetadata = new QueryCommand({
                TableName: GYM_TABLE_NAME,
                ExpressionAttributeNames: {
                    '#PK': 'PK',
                    '#SK': 'SK'
                },
                ExpressionAttributeValues: {
                    ':PK': `USER#${username}`,
                    ':metadata': '#METADATA',
                    ':workouts': `WORKOUT#${username}$`
                },
                KeyConditionExpression:
                    '#PK = :PK and #SK between :metadata and :workouts',
                ConsistentRead: false, // Non-consistent logins don't pose a significant security threat, unlike signups
                ReturnConsumedCapacity: 'TOTAL'
            })

            const response = await client.send(getUserMetadata)
            if (!response.Items) return rej() // If the polled item is undefined, no items were found

            return res(response.Items)
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to get user metadata, error:',
                err
            )
            return rej()
        }
    })

/**
 * Creates a user workout if not existant
 *
 * @param {Object} args
 * @param {string} args.username
 * @param {string} args.name
 * @param {string} args.description
 * @param {Array.<{Exercise}>} args.exercises
 * @param {number} args.iat
 */
const CreateUserWorkout = ({username, name, description, exercises, iat}) =>
    new Promise(async (res, rej) => {
        try {
            const createUserWorkout = new PutCommand({
                TableName: GYM_TABLE_NAME,
                ConditionExpression: 'attribute_not_exists(SK)',
                Item: {
                    PK: `USER#${username}`,
                    SK: `WORKOUT#${username}#${name}`,
                    workout: {
                        description,
                        exercises,
                        iat
                    }
                }
            })

            await client.send(createUserWorkout)

            return res()
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to create user workout, error:',
                err
            )
            return rej()
        }
    })

/**
 * Creates a user workout if not existant
 *
 * @param {Object} args
 * @param {string} args.oldName
 * @param {string} args.username
 * @param {string} args.name
 * @param {string} args.description
 * @param {Array.<{Exercise}>} args.exercises
 * @param {number} args.iat
 */
const EditUserWorkout = ({
    oldName,
    username,
    name,
    description,
    exercises,
    iat
}) =>
    new Promise(async (res, rej) => {
        try {
            /**
             * Only update name if necessary, because primary key updates transact additional write request units by propagating to KEYS_ONLY InverseIndex GSI
             *
             * Updating the name requires deleting the workout item, and putting a new workout item in the table because names are stored in the SK key index which
             * can not be updated via UpdateItem
             *
             * Updating the name will cost ~4x more than updating any other parameter, will be 6x more
             *  - Delete Old Item (1x)
             *  - Put New Item (2x)
             *  - Propogate key changes to GSI
             *      - Delete Old Item (3x)
             *      - Put New Item (4x)
             */
            if (oldName === name) {
                var editUserWorkout = new UpdateCommand({
                    TableName: GYM_TABLE_NAME,
                    Key: {
                        PK: `USER#${username}`,
                        SK: `WORKOUT#${username}#${oldName}`
                    },
                    ExpressionAttributeNames: {
                        '#workout': 'workout'
                    },
                    ExpressionAttributeValues: {
                        ':workout': {
                            description,
                            exercises,
                            iat
                        }
                    },
                    UpdateExpression: 'SET #workout = :workout'
                })
            } else {
                // /**
                //  * A transaction can be used over a BatchWriteItem because a condition must be added to ensure the old
                //  * item is deleted & the new item is written only if the new name does not exist
                //  */

                // const deleteOldWorkout = {
                //     TableName: GYM_TABLE_NAME,
                //     Key: {
                //         PK: `USER#${username}`,
                //         SK: `WORKOUT#${username}#${oldName}`
                //     }
                // }

                // const createNewWorkoutIfNotExists = {
                //     TableName: GYM_TABLE_NAME,
                //     ConditionExpression: 'attribute_not_exists(SK)',
                //     Item: {
                //         PK: `USER#${username}`,
                //         SK: `WORKOUT#${username}#${name}`,
                //         workout: {
                //             description,
                //             exercises,
                //             iat
                //         }
                //     },
                // }

                // var editUserWorkout = new TransactWriteCommand({
                //     TransactItems: [
                //         {Delete: deleteOldWorkout},
                //         {Put: createNewWorkoutIfNotExists}
                //     ]
                // })

                /**
                 * A BatchWriteItem is used here as it's cheaper, and we're fine with users overwriting items which have the same new name
                 */
                var editUserWorkout = new BatchWriteCommand({
                    RequestItems: {
                        [GYM_TABLE_NAME]: [
                            {
                                DeleteRequest: {
                                    Key: {
                                        PK: `USER#${username}`,
                                        SK: `WORKOUT#${username}#${oldName}`
                                    }
                                }
                            },
                            {
                                PutRequest: {
                                    Item: {
                                        PK: `USER#${username}`,
                                        SK: `WORKOUT#${username}#${name}`,
                                        workout: {
                                            description,
                                            exercises,
                                            iat
                                        }
                                    }
                                }
                            }
                        ]
                    }
                })
            }

            await client.send(editUserWorkout)

            return res()
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to edit user workout, error:',
                err
            )
            return rej()
        }
    })

/**
 * Deletes a specific user's workout
 *
 * @param {Object} args
 * @param {string} args.username
 * @param {string} args.name
 */
const DeleteUserWorkout = ({username, name}) =>
    new Promise(async (res, rej) => {
        try {
            const deleteUserWorkout = new DeleteCommand({
                TableName: GYM_TABLE_NAME,
                Key: {
                    PK: `USER#${username}`,
                    SK: `WORKOUT#${username}#${name}`
                }
            })

            await client.send(deleteUserWorkout)

            return res()
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to edit user workout, error:',
                err
            )
            return rej()
        }
    })

/**
 * Returns all of a user's workouts
 *
 * @param {Object} args
 * @param {string} args.username
 */
const GetUserWorkouts = ({username}) =>
    new Promise(async (res, rej) => {
        try {
            const getUserWorkouts = new QueryCommand({
                TableName: GYM_TABLE_NAME,
                ExpressionAttributeNames: {
                    '#PK': 'PK',
                    '#SK': 'SK'
                },
                ExpressionAttributeValues: {
                    ':PK': `USER#${username}`
                },
                KeyConditionExpression: '#PK = :PK and begins_with(#SK, :SK)',
                ConsistentRead: false
            })

            const response = await client.send(getUserWorkouts)
            if (!response.hasOwnProperty('Items')) return rej()

            return res(response.Items)
        } catch (err) {
            // Log error to cloudwatch
            console.error(
                'Error while sending database request to edit user workout, error:',
                err
            )
            return rej()
        }
    })

module.exports = {
    SignUpUser,
    GetUserData,
    CreateUserWorkout,
    EditUserWorkout,
    DeleteUserWorkout,
    GetUserWorkouts
}

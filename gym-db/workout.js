/**
 * Workout structure queriable by `USER#{USERNAME}` primary key and `#METADATA` secondary key
 */

const workout = {
    PK: 'USER#TestUsername',
    SK: 'WORKOUT#TestUsername#My workout title #1',
    description: '',
    iat: 123456789, // Initialized at timestamp
    exercises: [
        {
            id: '',
            parts: [
                {
                    sets: 0,
                    reps: {
                        unit: 'reps' | 'secs' | 'mins' | 'AMRAP',
                        value: 0
                    },
                    weight: {
                        unit: 'lb' | 'kg',
                        value: 0
                    }
                }
            ]
        }
    ]
}

const request = require('request')

let session = ''

// prettier-ignore
const signUpLive = () =>
    new Promise((resolve, reject) => {
        const data = {
            username: 'testing.user',
            email: 'testing@gmail.com',
            password: 'TestPassword123',
            first_name: 'TestFirst',
            last_name: 'TestLast',
            city: 'Palo Alto',
            state: 'CA',
            country: 'USA'
        }

        request({
            url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/signup',
            method: 'POST',
            body: JSON.stringify(data)
        }, (err, res) => {
            try {
                if (err) {
                    console.error(err)
                } else {
                    console.log(res.headers)
                    console.log('Status:', res.statusCode)
                    console.log('Body:', res.body)
                    const {session: _session} = JSON.parse(res.body)
                    session = _session
                    return resolve()
                }
            } catch (err) {
                console.error(err)
            }
        })
    })

const testLive = () =>
    new Promise((resolve, reject) => {
        request(
            {
                url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/test',
                method: 'POST',
                headers: {
                    'Authorization':
                        '1y8PPKgsKBAcgt2uuifhiTT+VTEni0OoA25TWaVdCww1PbZoVG44J1BS3kOuvb/OQ0YLZLHm7B8se+rdGpDtjvH1JEU7/4H2ArJMzsN7pmydXDjnf+3ao7eX6VtuI9d+Oz0RrgaGdJzhPcLiujkSTNrVrGS/KMcTHJGdDEaOZLQnSRAHuzOjgU6dGrOIx88d3Vv/BZwtIeY2ysNWx59L6S9fbaN7gvlakecjslotjFaP9C5YFr3UOKF15EfPz5RLSNLnuHVJkXC3GZU2GBqrDtEyL7OoXxXQavWhT8f8oACurmzpJc0Q'
                }
            },
            (err, res) => {
                try {
                    if (err) {
                        console.error(err)
                    } else {
                        console.log(res.headers)
                        console.log('Status:', res.statusCode)
                        console.log('Body:', res.body)
                        return resolve()
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        )
    })

const loginLive = () =>
    new Promise((resolve, reject) => {
        try {
            const data = {
                username: 'testing.user',
                password: 'TestPassword123'
            }

            request(
                {
                    url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/login',
                    method: 'POST',
                    body: JSON.stringify(data)
                },
                (err, res) => {
                    try {
                        if (err) {
                            console.error(err)
                        } else {
                            console.log(res.headers)
                            console.log('Status:', res.statusCode)
                            console.log('Body:', res.body)
                            const {session: _session} = JSON.parse(res.body)
                            session = _session
                            return resolve()
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }
            )
        } catch (err) {
            console.error(err)
        }
    })

const createWorkoutLive = () =>
    new Promise((resolve, reject) => {
        try {
            const data = {
                name: '1',
                description: '',
                exercises: [
                    {
                        id: 'SEATED_BARBELL_OVERHEAD_PRESS',
                        parts: [
                            {
                                sets: 3,
                                reps: {
                                    unit: 'reps',
                                    value: 12
                                },
                                weight: {
                                    unit: 'lbs',
                                    value: 60
                                }
                            }
                        ]
                    }
                ]
            }

            request(
                {
                    url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/workouts/create',
                    method: 'POST',
                    headers: {
                        'authorization': session
                    },
                    body: JSON.stringify(data)
                },
                (err, res) => {
                    try {
                        if (err) {
                            console.error(err)
                        } else {
                            console.log(res.headers)
                            console.log('Status:', res.statusCode)
                            console.log('Body:', res.body)
                            return resolve()
                        }
                    } catch (err) {
                        console.error(err)
                    }
                }
            )
        } catch (err) {
            console.error(err)
        }
    })

const editWorkoutLive = () => {
    try {
        const data = {
            oldName: '1',
            name: '2',
            description: 'aaaaaaaaaaaaaaaaaaaaa',
            exercises: [
                {
                    id: 'SEATED_BARBELL_OVERHEAD_PRESS',
                    parts: [
                        {
                            sets: 3,
                            reps: {
                                unit: 'reps',
                                value: 12
                            },
                            weight: {
                                unit: 'lbs',
                                value: 60
                            }
                        }
                    ]
                }
            ]
        }

        request(
            {
                url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/workouts/edit',
                method: 'POST',
                headers: {
                    'authorization': session
                },
                body: JSON.stringify(data)
            },
            (err, res) => {
                try {
                    if (err) {
                        console.error(err)
                    } else {
                        console.log(res.headers)
                        console.log('Status:', res.statusCode)
                        console.log('Body:', res.body)
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        )
    } catch (err) {
        console.error(err)
    }
}

const deleteWorkoutLive = () => {
    try {
        const data = {
            name: 'My newer workout thing'
        }

        request(
            {
                url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/workouts/delete',
                method: 'POST',
                headers: {
                    'authorization': session
                },
                body: JSON.stringify(data)
            },
            (err, res) => {
                try {
                    if (err) {
                        console.error(err)
                    } else {
                        console.log(res.headers)
                        console.log('Status:', res.statusCode)
                        console.log('Body:', res.body)
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        )
    } catch (err) {
        console.error(err)
    }
}

const getAllUserWorkoutsLive = () => {
    try {
        request(
            {
                url: 'https://22mshiq76j.execute-api.us-east-1.amazonaws.com/workouts',
                method: 'GET',
                headers: {
                    'authorization': session
                }
            },
            (err, res) => {
                try {
                    if (err) {
                        console.error(err)
                    } else {
                        console.log(res.headers)
                        console.log('Status:', res.statusCode)
                        console.log('Body:', res.body)
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        )
    } catch (err) {
        console.error(err)
    }
}

// May need to login first
// prettier-ignore
const main = async (_) => {
    await loginLive()
    await getAllUserWorkoutsLive()
}

main()

const {handler: signup} = require('../../gym-api-v1/handlers/signup')
const {sign} = require('jsonwebtoken')
const request = require('request')

/**
 * endpoints:                                                                                                        
  POST - https://eoqmywmvv0.execute-api.us-east-1.amazonaws.com/signup
 */

const signUpLocal = () => {
    signup()
}

// prettier-ignore
const signUpLive = () => {
    const data = {
        username: 'TestUsername',
        email: 'test@gmail.com',
        password: 'TestPassword123',
        first_name: 'TestFirst',
        last_name: 'TestLast',
        city: 'Palo Alto',
        state: 'CA',
        country: 'USA'
    }

    request({
        url: 'https://eoqmywmvv0.execute-api.us-east-1.amazonaws.com/signup',
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
            }
        } catch (err) {
            console.error(err)
        }
    })
}

const testLive = () => {
    request(
        {
            url: 'https://eoqmywmvv0.execute-api.us-east-1.amazonaws.com/test',
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
                }
            } catch (err) {
                console.error(err)
            }
        }
    )
}

const loginLive = () => {
    try {
        const data = {
            username: 'TestUsername',
            password: 'TestPassword123'
        }

        request(
            {
                url: 'https://eoqmywmvv0.execute-api.us-east-1.amazonaws.com/login',
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

// prettier-ignore
const main = (_) => {
    loginLive()
}

main()

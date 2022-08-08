const INTERNAL_SERVER_ERROR = {
    statusCode: 500,
    body: JSON.stringify({message: 'Internal Server Error'})
}

const BAD_REQUEST = {
    statusCode: 400,
    body: JSON.stringify({message: 'Bad Request'})
}

const UNAUTHORIZED = {
    statusCode: 401,
    body: JSON.stringify({message: 'Unauthorized'})
}

const badRequestMessage = (message) => ({
    statusCode: 400,
    body: JSON.stringify({message})
})

const internalServerErrorMessage = (message) => ({
    statusCode: 500,
    message: JSON.stringify({message})
})

module.exports = {
    INTERNAL_SERVER_ERROR,
    BAD_REQUEST,
    UNAUTHORIZED,
    badRequestMessage,
    internalServerErrorMessage
}

const INTERNAL_SERVER_ERROR = {
    statusCode: 500
}

const BAD_REQUEST = {
    statusCode: 400
}

const UNAUTHORIZED = {
    statusCode: 401
}

const badRequestMessage = (message) => ({
    statusCode: 400,
    body: JSON.stringify({message})
})

const internalServerErrorMessage = (message) => ({
    statusCode: 500,
    body: JSON.stringify({message})
})

module.exports = {
    INTERNAL_SERVER_ERROR,
    BAD_REQUEST,
    UNAUTHORIZED,
    badRequestMessage,
    internalServerErrorMessage
}

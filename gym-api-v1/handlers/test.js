exports.handler = async (event, context) => {
    try {
        console.log('test handler, event:', event)
        console.log('test handler, context:', context)
        console.log('authorizer:', event.requestContext.authorizer)
    } catch (err) {
        console.error('Error in test handler, error:', err)
    }
}

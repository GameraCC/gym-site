const COUNTRIES_STATES_CITIES = require('../assets/countries_states_cities.json')

const MAX_PASSWORD_LENGTH = 100
const MIN_PASSWORD_LENGTH = 8
const MAX_USERNAME_LENGTH = 24
const MIN_USERNAME_LENGTH = 3
const EMAIL_VALIDATION_REGEX =
    /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
const USERNAME_VALIDATION_REGEX =
    /^([a-z0-9_](?:(?:[a-z0-9_]|(?:\.(?!\.))){0,28}(?:[a-z0-9_]))?)$/

/**
 * Methods to apply constraints on inputs
 *
 * Ensure inputs exist prior to validating constriants
 *
 * @param {string} input - The input variable to test constriants upon
 * @returns {string || true} True if the constraints are met, otherwise a human-readable string without a period detailing the constraint
 */

// Minimum 8 characters, maximum 100 characters, must contain an uppercase letter and a number
const passwordConstraint = (password) => {
    // Check length constraints
    if (
        password.length < MIN_PASSWORD_LENGTH ||
        password.length > MAX_PASSWORD_LENGTH
    )
        return 'Password must be between 8-100 characters'

    // Check character constraints
    if (!/[A-Z]/.test(password) || !/\d/.test(password))
        return 'Password must contain an uppercase letter and number'

    return true
}

// Validate email input utilizing regex & ensure email is in al lower case, to prevent users registering with the same email
const emailConstraint = (email) => {
    if (!EMAIL_VALIDATION_REGEX.test(email)) return 'Invalid email address'
    if (email.length > 320) return 'Email too long'
    if (email !== email.toLowerCase())
        return 'Email can not include capital letters'

    return true
}

// Usernames must be alphanumeric, no capital letters, trailing or leading dots, or consecutive dots
const usernameConstraint = (username) => {
    if (
        username.length < MIN_USERNAME_LENGTH ||
        username.length > MAX_USERNAME_LENGTH
    )
        return 'Username must be between 3-24 characters'

    if (!USERNAME_VALIDATION_REGEX.test(username)) return 'Invalid username'

    return true
}

const locationConstraint = ({city, state, country}) => {
    // Check if country exists
    const _country = COUNTRIES_STATES_CITIES[country]
    if (!_country) return 'Invalid country'

    // Check if country without states
    if (!Object.keys(_country).length && !city && !state) return true

    // Check if state exists in country
    const _state = _country[state]
    if (!_state) return 'Invalid state'

    // Check if country without cities
    if (!_state.length && !city) return true

    // Check if city exists in state
    const _city = _state.includes(city)
    if (!_city) return 'Invalid city'

    return true
}

// First name must be less than 32 characters
const firstNameConstraint = (first_name) => {
    if (first_name.length > 32)
        return 'First name must be less than 32 characters'

    return true
}

// First name must be less than 32 characters
const lastNameConstraint = (last_name) => {
    if (last_name.length > 32)
        return 'Last name must be less than 32 characters'

    return true
}

module.exports = {
    passwordConstraint,
    emailConstraint,
    usernameConstraint,
    locationConstraint,
    firstNameConstraint,
    lastNameConstraint
}

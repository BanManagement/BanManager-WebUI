const { isUUID: validatorIsUUID } = require('validator')

// Wrapper around validator's isUUID with 'loose' mode to support Bedrock/Floodgate UUIDs
// Standard isUUID rejects non-RFC 4122 compliant UUIDs (version/variant bits)
// Bedrock UUIDs typically have format: 00000000-0000-0000-XXXX-XXXXXXXXXXXX
const isUUID = (str) => validatorIsUUID(str, 'loose')

module.exports = { isUUID }

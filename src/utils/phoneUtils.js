/**
 * Standardizes phone number format by:
 * 1. Removing '+' and any non-digit characters
 * 2. Removing leading '1' if present
 * 3. Ensuring 10-digit format
 * @param {string} phoneNumber - The phone number to standardize
 * @returns {string} - Standardized 10-digit phone number
 */
const standardizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove '+' and any other non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Remove leading '1' if present and number is 11 digits
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = cleaned.substring(1);
    }
    
    // Verify we have a valid 10-digit number
    if (cleaned.length !== 10) {
        console.warn(`Invalid phone number length: ${cleaned.length} digits for number: ${cleaned}`);
    }
    
    return cleaned;
};

module.exports = { standardizePhoneNumber };
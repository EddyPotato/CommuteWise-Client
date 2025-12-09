// src/utils/mapUtils.js

/**
 * Checks if a given latitude and longitude pair are valid numbers.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {boolean}
 */
export const isValidCoordinate = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
};
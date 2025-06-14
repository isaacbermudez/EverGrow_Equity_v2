// src/utils/dateUtils.js

/**
 * Calculates a date N days ago from the current date.
 * @param {number} daysAgo - The number of days to go back.
 * @returns {string} The date in 'YYYY-MM-DD' format.
 */
export const getDaysAgoDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
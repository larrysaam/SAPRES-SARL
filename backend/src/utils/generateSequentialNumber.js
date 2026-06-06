/**
 * Generates a sequential number with a given prefix and padding.
 * @param {string} prefix - The prefix for the sequential number (e.g., 'SAP-QT-').
 * @param {number} lastNumber - The last sequential number generated.
 * @param {number} padding - The desired length of the numeric part (e.g., 6 for 000001).
 * @returns {string} The generated sequential number (e.g., 'SAP-QT-000001').
 */
const generateSequentialNumber = (prefix, lastNumber, padding = 6) => {
  const nextNumber = lastNumber + 1;
  const paddedNumber = String(nextNumber).padStart(padding, '0');
  return `${prefix}${paddedNumber}`;
};

export { generateSequentialNumber };

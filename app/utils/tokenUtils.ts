/**
 * Utility functions for token amount conversions
 */

/**
 * Convert raw token amount to UI amount based on decimals
 * @param rawAmount The raw token amount as a string
 * @param decimals The number of decimals for the token
 * @returns The UI amount as a string
 */
export const rawToAmount = (rawAmount: string, decimals: number): string => {
  if (!rawAmount || isNaN(parseInt(rawAmount)) || parseInt(rawAmount) <= 0) {
    console.error('Invalid raw amount:', rawAmount);
    return '0';
  }

  try {
    // Convert raw amount to UI amount based on decimals
    const uiAmount = parseInt(rawAmount) / Math.pow(10, decimals);
    return uiAmount.toString();
  } catch (error) {
    console.error('Error converting raw to UI amount:', error);
    return '0';
  }
};

/**
 * Convert UI amount to raw token amount based on decimals
 * @param amount The UI amount as a string
 * @param decimals The number of decimals for the token
 * @returns The raw amount as a string
 */
export const amountToRaw = (amount: string, decimals: number): string => {
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    console.error('Invalid amount:', amount);
    return '0';
  }

  try {
    // Convert UI amount to raw amount based on decimals
    const rawAmount = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(rawAmount).toString(); // Floor to avoid floating point issues
  } catch (error) {
    console.error('Error converting amount to raw:', error);
    return '0';
  }
}; 
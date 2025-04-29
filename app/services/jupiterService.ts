import { createJupiterApiClient, QuoteGetRequest, QuoteResponse } from '@jup-ag/api';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { amountToRaw } from '../utils/tokenUtils';

// Constants - Common token addresses for convenience
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const BONK_MINT = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

// Initialize Jupiter API client
const jupiterApi = createJupiterApiClient({
  basePath: 'https://quote-api.jup.ag/v6'
});

/**
 * Get a swap quote from Jupiter for any valid SPL token pair
 */
export const getQuote = async (
  connection: Connection,
  inputTokenAddress: string,
  outputTokenAddress: string,
  amount: string,
  slippageBps: number = 50 // 0.5% default slippage
): Promise<QuoteResponse> => {
  try {
    // Basic input validation
    if (!inputTokenAddress || !outputTokenAddress) {
      throw new Error('Invalid token addresses provided');
    }

    console.log('Raw token addresses:', {
      input: inputTokenAddress,
      output: outputTokenAddress
    });

    // Clean up token addresses (remove spaces, etc.)
    const cleanInputAddress = inputTokenAddress.trim();
    const cleanOutputAddress = outputTokenAddress.trim();

    // Validate token addresses using PublicKey
    try {
      new PublicKey(cleanInputAddress);
      new PublicKey(cleanOutputAddress);
      console.log('Token addresses validated successfully');
    } catch (error) {
      console.error('Invalid token address format:', error);
      throw new Error('Invalid token address format');
    }

    // Log input parameters
    console.log('Getting quote with parameters:', {
      inputTokenAddress: cleanInputAddress,
      outputTokenAddress: cleanOutputAddress,
      amount,
      slippageBps
    });

    // Convert the UI amount to raw token amount based on decimals
    console.log(`Converting amount ${amount} to raw amount for token ${cleanInputAddress}`);
    
    // For simplified processing, we'll use fixed decimals for common tokens
    let tokenDecimals = 9; // Default to 9 decimals (SOL)
    
    // Set decimals based on common tokens
    if (cleanInputAddress === SOL_MINT) {
      tokenDecimals = 9;
    } else if (cleanInputAddress === USDC_MINT || cleanInputAddress === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
      tokenDecimals = 6;
    } else if (cleanInputAddress === BONK_MINT) {
      tokenDecimals = 5;
    }
    
    // Use the simplified amountToRaw function
    const rawAmount = amountToRaw(amount, tokenDecimals);
    console.log(`Raw amount: ${rawAmount}`);
    
    if (rawAmount === '0') {
      throw new Error('Invalid amount');
    }

    // Create URL parameters
    const queryParams = new URLSearchParams({
      inputMint: cleanInputAddress,
      outputMint: cleanOutputAddress,
      amount: rawAmount,
      slippageBps: slippageBps.toString() // Convert to string for URL params
    }).toString();
    
    const apiUrl = `https://quote-api.jup.ag/v6/quote?${queryParams}`;
    console.log('Fetching quote from:', apiUrl);
    
    // Make direct API request - bypassing the API client that might have issues
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        if (response.status === 404) {
          throw new Error('No route found for this token pair');
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorText}`);
        } else if (response.status === 500) {
          throw new Error('Jupiter API server error');
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }
      
      const quote = await response.json();
      
      if (!quote) {
        throw new Error('No quote found');
      }

      console.log('Quote received:', {
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        otherAmountThreshold: quote.otherAmountThreshold,
        swapMode: quote.swapMode
      });

      return quote;
    } catch (apiError: any) {
      // Detailed API error logging
      console.error('Jupiter API error:', apiError);
      throw apiError;
    }
  } catch (error: any) {
    console.error('Error getting quote:', error);
    throw error;
  }
};

/**
 * Execute a swap transaction between any valid SPL token pair
 */
export const executeSwap = async (
  quote: QuoteResponse,
  walletPublicKey: string,
  connection: Connection,
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>
): Promise<{ txid: string; status: string }> => {
  try {
    console.log('Executing swap with quote:', quote);
    
    // Create the swap request payload - correct format for Jupiter API v6
    const swapRequest = {
      quoteResponse: quote,
      userPublicKey: walletPublicKey,
      wrapUnwrapSOL: true,
      feeAccount: null,
      computeUnitPriceMicroLamports: 10000 // 0.00001 SOL per CU
    };
    
    console.log('Swap request payload:', JSON.stringify(swapRequest, null, 2));
    
    // Make a direct fetch request to the API
    const apiUrl = 'https://quote-api.jup.ag/v6/swap';
    console.log('Posting to swap API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Swap API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Swap API error: ${response.status} - ${errorText}`);
    }
    
    const swapResult = await response.json();
    
    // Check if we received a serialized transaction
    if (!swapResult.swapTransaction) {
      console.error('No swap transaction returned:', swapResult);
      throw new Error('No swap transaction returned');
    }

    console.log('Successfully retrieved swap transaction');
    
    // Deserialize and sign the transaction
    const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
    let transaction: Transaction | VersionedTransaction;

    console.log('Transaction buffer loaded, attempting to deserialize');
    
    // Handle both legacy and versioned transactions
    try {
      transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      console.log('Deserialized as VersionedTransaction');
    } catch (e) {
      console.log('Not a VersionedTransaction, trying legacy format');
      // If versioned transaction deserialization fails, try legacy
      transaction = Transaction.from(swapTransactionBuf);
      console.log('Deserialized as legacy Transaction');
    }

    console.log('Transaction deserialized successfully, signing...');
    
    // Sign the transaction
    const signedTransaction = await signTransaction(transaction);
    console.log('Transaction signed successfully');

    // Serialize the signed transaction based on its type
    const serializedTransaction = 
      signedTransaction instanceof VersionedTransaction
        ? signedTransaction.serialize()
        : (signedTransaction as Transaction).serialize();

    console.log('Transaction serialized, sending to network');
    
    // Send the transaction
    const txid = await connection.sendRawTransaction(serializedTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });

    console.log('Swap transaction sent:', txid);
    
    // Wait for confirmation (tracking status)
    try {
      console.log('Waiting for transaction confirmation...');
      const status = await connection.confirmTransaction(txid, 'confirmed');
      
      if (status.value.err) {
        console.error('Transaction failed:', status.value.err);
        return { txid, status: 'failed' };
      }
      
      console.log('Swap transaction confirmed successfully');
      return { txid, status: 'confirmed' };
    } catch (error) {
      console.error('Error confirming transaction:', error);
      return { txid, status: 'unknown' };
    }
  } catch (error) {
    console.error('Error executing swap:', error);
    throw error;
  }
};

/**
 * Direct test function for Jupiter API quote
 * This bypasses all the token validation and directly calls the Jupiter API
 */
export const testDirectQuote = async (): Promise<any> => {
  try {
    console.log('Testing direct quote with Jupiter API');
    
    // Fixed values for SOL to USDC
    const inputMint = 'So11111111111111111111111111111111111111112';
    const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const amount = 100000000; // 0.1 SOL (9 decimals)
    
    // Create the same request object used in the curl command
    const queryParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: '50'
    }).toString();
    
    console.log('Direct test quote URL:', `https://quote-api.jup.ag/v6/quote?${queryParams}`);
    
    // Make a direct fetch request to the API
    try {
      const response = await fetch(`https://quote-api.jup.ag/v6/quote?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const quote = await response.json();
      console.log('Direct test quote successful:', quote);
      return quote;
    } catch (apiError: any) {
      console.error('Direct test Jupiter API error:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error in direct test quote:', error);
    throw error;
  }
};

/**
 * Test function for SOL to USDC swap with fixed amount
 */
export const getFixedSolToUsdcQuote = async (
  connection: Connection
): Promise<any> => {
  try {
    console.log('Getting fixed SOL to USDC quote');
    
    // Fixed parameters that we know work with curl
    const inputMint = SOL_MINT;
    const outputMint = USDC_MINT;
    const fixedAmount = '100000000'; // 0.1 SOL
    
    const queryParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: fixedAmount,
      slippageBps: '50'
    }).toString();
    
    const apiUrl = `https://quote-api.jup.ag/v6/quote?${queryParams}`;
    console.log('Fixed test URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fixed test API error:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const quote = await response.json();
    console.log('Fixed test successful:', quote);
    return quote;
  } catch (error) {
    console.error('Error in fixed test:', error);
    throw error;
  }
};

/**
 * Test function for SOL to BONK swap with fixed amount
 */
export const getFixedSolToBonkQuote = async (
  connection: Connection
): Promise<any> => {
  try {
    console.log('Getting fixed SOL to BONK quote');
    
    // Fixed parameters for testing
    const inputMint = SOL_MINT;
    const outputMint = BONK_MINT;
    const fixedAmount = '100000000'; // 0.1 SOL
    
    const queryParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: fixedAmount,
      slippageBps: '50'
    }).toString();
    
    const apiUrl = `https://quote-api.jup.ag/v6/quote?${queryParams}`;
    console.log('Fixed SOL to BONK test URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fixed SOL to BONK test API error:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const quote = await response.json();
    console.log('Fixed SOL to BONK test successful:', quote);
    console.log('BONK amount received:', quote.outAmount);
    
    // Calculate the number of decimal places needed
    const solAmount = 0.1; // The amount we're sending (0.1 SOL)
    const bonkAmount = parseInt(quote.outAmount);
    console.log(`For ${solAmount} SOL, received ${bonkAmount} raw BONK units`);
    
    // Test with different decimals to see which matches market rate
    const decimal5 = bonkAmount / 100_000; // if BONK has 5 decimals
    const decimal8 = bonkAmount / 100_000_000; // if BONK has 8 decimals
    const decimal9 = bonkAmount / 1_000_000_000; // if BONK has 9 decimals
    
    console.log('BONK amount with 5 decimals:', decimal5);
    console.log('BONK amount with 8 decimals:', decimal8);
    console.log('BONK amount with 9 decimals:', decimal9);
    
    return quote;
  } catch (error) {
    console.error('Error in fixed SOL to BONK test:', error);
    throw error;
  }
};

/**
 * Test function for direct swap API access
 * This is for debugging API issues with the swap endpoint
 */
export const testDirectSwap = async (
  connection: Connection,
  walletPublicKey: string
): Promise<any> => {
  try {
    console.log('Testing direct swap API access');
    
    // First get a quote
    console.log('Getting a test quote for SOL to USDC');
    const inputMint = SOL_MINT;
    const outputMint = USDC_MINT;
    const amount = '10000000'; // 0.01 SOL
    
    const quoteParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps: '100' // 1%
    }).toString();
    
    const quoteUrl = `https://quote-api.jup.ag/v6/quote?${quoteParams}`;
    console.log('Quote URL:', quoteUrl);
    
    // Get the quote
    const quoteResponse = await fetch(quoteUrl);
    
    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('Quote API error:', {
        status: quoteResponse.status,
        statusText: quoteResponse.statusText,
        body: errorText
      });
      throw new Error(`Quote API error: ${quoteResponse.status} - ${errorText}`);
    }
    
    const quote = await quoteResponse.json();
    console.log('Test quote successful:', quote);
    
    // Now try to create the swap request
    const swapRequest = {
      quoteResponse: quote,
      userPublicKey: walletPublicKey,
      wrapUnwrapSOL: true,
      feeAccount: null,
      computeUnitPriceMicroLamports: 10000 // 0.00001 SOL per CU
    };
    
    console.log('Test swap request payload:', JSON.stringify(swapRequest, null, 2));
    
    // Test against the swap API
    const swapUrl = 'https://quote-api.jup.ag/v6/swap';
    console.log('Test posting to swap API:', swapUrl);
    
    const swapResponse = await fetch(swapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(swapRequest),
    });
    
    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      console.error('Test swap API error:', {
        status: swapResponse.status,
        statusText: swapResponse.statusText,
        body: errorText
      });
      throw new Error(`Swap API error: ${swapResponse.status} - ${errorText}`);
    }
    
    const swapResult = await swapResponse.json();
    console.log('Test swap transaction creation successful:', swapResult);
    
    // We don't actually want to execute the swap in test mode
    return {
      success: true,
      message: 'Swap API test successful'
    };
  } catch (error) {
    console.error('Error in direct swap test:', error);
    throw error;
  }
};

/**
 * Simple version of getQuote that ensures consistent types
 */
export const getQuoteV2 = async (
  connection: Connection,
  inputTokenAddress: string,
  outputTokenAddress: string,
  amount: string,
  slippageBps: number // Takes a number, converts internally
): Promise<QuoteResponse> => {
  // Convert slippageBps to string for URL params
  const slippageBpsStr = slippageBps.toString();
  
  console.log(`getQuoteV2 using slippage: ${slippageBps} bps (${slippageBpsStr})`);
  
  // Clean up addresses
  const cleanInputAddress = inputTokenAddress.trim();
  const cleanOutputAddress = outputTokenAddress.trim();
  
  // Create URL parameters
  const queryParams = new URLSearchParams({
    inputMint: cleanInputAddress,
    outputMint: cleanOutputAddress,
    amount,
    slippageBps: slippageBpsStr
  }).toString();
  
  const apiUrl = `https://quote-api.jup.ag/v6/quote?${queryParams}`;
  console.log('getQuoteV2 fetching from:', apiUrl);
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupiter API error: ${response.status} - ${errorText}`);
  }
  
  const quote = await response.json();
  return quote;
}; 
import { getQuote, executeSwap } from './jupiterService';
import { rawToAmount, amountToRaw } from '../utils/tokenUtils';
import { fetchTokenBalances } from './tokenService';
import { Connection } from '@solana/web3.js';

// Common token addresses
export const BONK_TOKEN_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
export const SOL_TOKEN_ADDRESS = 'So11111111111111111111111111111111111111112';

export interface SwapParams {
  inputTokenAddress: string;
  outputTokenAddress: string;
  inputAmount: string;
  slippage: number;
  wallet: any; // This should be a PublicKey or similar type
  connection: Connection;
}

export interface SwapResult {
  success: boolean;
  txid?: string;
  error?: string;
  outAmount?: string;
}

/**
 * Execute a swap of tokens using Jupiter API
 * @param params The swap parameters
 * @returns The result of the swap
 */
export const swap = async (params: SwapParams): Promise<SwapResult> => {
  try {
    const { inputTokenAddress, outputTokenAddress, inputAmount, slippage, wallet, connection } = params;
    
    if (!inputTokenAddress || !outputTokenAddress || !inputAmount || !wallet || !connection) {
      throw new Error('Missing required parameters for swap');
    }

    // Fetch the token balances to get decimals
    const balances = await fetchTokenBalances(connection, wallet.publicKey.toString());
    const inputToken = balances.find(token => token.mint === inputTokenAddress);
    const outputToken = balances.find(token => token.mint === outputTokenAddress);
    
    if (!inputToken || !outputToken) {
      throw new Error('Could not find token information');
    }

    // Convert input amount to raw amount
    const rawInputAmount = amountToRaw(inputAmount, inputToken.decimals);
    
    // Get the quote from Jupiter
    const quoteResponse = await getQuote(
      connection,
      inputTokenAddress,
      outputTokenAddress,
      rawInputAmount,
      slippage
    );

    if (!quoteResponse) {
      throw new Error('Failed to get quote for swap');
    }

    // Execute the swap
    const swapResult = await executeSwap(
      quoteResponse,
      wallet.publicKey.toString(),
      connection,
      wallet.signTransaction.bind(wallet)
    );

    if (!swapResult || !swapResult.txid) {
      throw new Error('Swap execution failed');
    }

    // Convert output amount to UI amount
    const outAmount = rawToAmount(quoteResponse.outAmount, outputToken.decimals);

    return {
      success: true,
      txid: swapResult.txid,
      outAmount
    };
  } catch (error) {
    console.error('Swap error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during swap'
    };
  }
};

/**
 * Get a quote for a token swap without executing it
 * @param params The swap parameters
 * @returns The quote result
 */
export const getSwapQuote = async (params: Omit<SwapParams, 'wallet'> & { wallet: any }): Promise<{ 
  inAmount: string; 
  outAmount: string; 
  price: string;
  priceImpact: string;
  success: boolean;
  error?: string;
}> => {
  try {
    const { inputTokenAddress, outputTokenAddress, inputAmount, slippage, wallet } = params;
    
    if (!inputTokenAddress || !outputTokenAddress || !inputAmount || !wallet) {
      throw new Error('Missing required parameters for quote');
    }

    // Fetch the token balances to get decimals
    const balances = await fetchTokenBalances(wallet.connection, wallet.publicKey.toString());
    const inputToken = balances.find(token => token.mint === inputTokenAddress);
    const outputToken = balances.find(token => token.mint === outputTokenAddress);
    
    if (!inputToken || !outputToken) {
      throw new Error('Could not find token information');
    }

    // Convert input amount to raw amount
    const rawInputAmount = amountToRaw(inputAmount, inputToken.decimals);
    
    // Get the quote from Jupiter
    const quoteResponse = await getQuote(
      wallet.connection,
      inputTokenAddress,
      outputTokenAddress,
      rawInputAmount,
      slippage
    );

    if (!quoteResponse) {
      throw new Error('Failed to get quote');
    }

    // Convert amounts to UI amounts
    const outAmount = rawToAmount(quoteResponse.outAmount, outputToken.decimals);
    
    // Calculate price as outAmount/inAmount
    const inAmountNum = parseFloat(quoteResponse.inAmount);
    const outAmountNum = parseFloat(quoteResponse.outAmount);
    const calculatedPrice = inAmountNum > 0 ? (outAmountNum / inAmountNum).toString() : '0';

    return {
      inAmount: inputAmount,
      outAmount,
      price: calculatedPrice,
      priceImpact: quoteResponse.priceImpactPct || '0',
      success: true
    };
  } catch (error) {
    console.error('Quote error:', error);
    return {
      inAmount: '0',
      outAmount: '0',
      price: '0',
      priceImpact: '0',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred getting quote'
    };
  }
};

/**
 * Swap BONK for another token
 * @param outputTokenAddress The address of the token to swap to
 * @param bonkAmount The amount of BONK to swap
 * @param slippage The allowable slippage percentage
 * @param wallet The wallet to use for the swap
 * @returns The result of the swap
 */
export const swapBonkForToken = async (
  outputTokenAddress: string, 
  bonkAmount: string, 
  slippage: number, 
  wallet: any
): Promise<SwapResult> => {
  return swap({
    inputTokenAddress: BONK_TOKEN_ADDRESS,
    outputTokenAddress,
    inputAmount: bonkAmount,
    slippage,
    wallet,
    connection: wallet.connection
  });
};

/**
 * Swap a token for BONK
 * @param inputTokenAddress The address of the token to swap from
 * @param inputAmount The amount of the input token to swap
 * @param slippage The allowable slippage percentage
 * @param wallet The wallet to use for the swap
 * @returns The result of the swap
 */
export const swapTokenForBonk = async (
  inputTokenAddress: string, 
  inputAmount: string, 
  slippage: number, 
  wallet: any
): Promise<SwapResult> => {
  return swap({
    inputTokenAddress,
    outputTokenAddress: BONK_TOKEN_ADDRESS,
    inputAmount,
    slippage,
    wallet,
    connection: wallet.connection
  });
};

/**
 * Swap SOL for BONK
 * @param solAmount The amount of SOL to swap
 * @param slippage The allowable slippage percentage
 * @param wallet The wallet to use for the swap
 * @returns The result of the swap
 */
export const swapSolForBonk = async (
  solAmount: string, 
  slippage: number, 
  wallet: any
): Promise<SwapResult> => {
  return swap({
    inputTokenAddress: SOL_TOKEN_ADDRESS,
    outputTokenAddress: BONK_TOKEN_ADDRESS,
    inputAmount: solAmount,
    slippage,
    wallet,
    connection: wallet.connection
  });
};

/**
 * Swap BONK for SOL
 * @param bonkAmount The amount of BONK to swap
 * @param slippage The allowable slippage percentage
 * @param wallet The wallet to use for the swap
 * @returns The result of the swap
 */
export const swapBonkForSol = async (
  bonkAmount: string, 
  slippage: number, 
  wallet: any
): Promise<SwapResult> => {
  return swap({
    inputTokenAddress: BONK_TOKEN_ADDRESS,
    outputTokenAddress: SOL_TOKEN_ADDRESS,
    inputAmount: bonkAmount,
    slippage,
    wallet,
    connection: wallet.connection
  });
}; 
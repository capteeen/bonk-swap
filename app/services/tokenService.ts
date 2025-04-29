import { 
  Connection, 
  PublicKey, 
  TokenAccountBalancePair, 
  LAMPORTS_PER_SOL,
  AccountInfo,
  ParsedAccountData
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Token metadata cache to reduce API calls
const tokenMetadataCache = new Map<string, TokenMetadata>();

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isValid: boolean;
}

/**
 * Validate if an address is a valid SPL token
 */
export const validateSplToken = async (
  connection: Connection,
  address: string
): Promise<TokenMetadata> => {
  try {
    console.log('Starting token validation for:', address);
    
    // Check if token is already in cache
    if (tokenMetadataCache.has(address)) {
      console.log('Token found in cache');
      const cachedMetadata = tokenMetadataCache.get(address)!;
      console.log('Cached token metadata:', cachedMetadata);
      return cachedMetadata;
    }

    // Handle native SOL
    if (address === 'So11111111111111111111111111111111111111112') {
      console.log('Handling native SOL token');
      const solMetadata = {
        address,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        isValid: true
      };
      tokenMetadataCache.set(address, solMetadata);
      return solMetadata;
    }
    
    // Validate address format before creating PublicKey
    if (!address || typeof address !== 'string' || address.trim() === '') {
      console.error('Empty or invalid token address');
      throw new Error('Empty or invalid token address');
    }
    
    // Allow addresses of any length but clean them up
    const cleanedAddress = address.trim();
    console.log('Cleaned token address:', cleanedAddress);
    
    // Try to parse as PublicKey to check basic address validity
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(cleanedAddress);
      console.log('Public key validation passed');
    } catch (error) {
      console.error('Invalid public key format:', error);
      throw new Error('Invalid token address format');
    }
    
    // Get token account info
    console.log('Fetching account info from Solana...');
    const accountInfo = await connection.getParsedAccountInfo(pubkey);
    
    if (!accountInfo.value) {
      console.error('Account not found on Solana');
      throw new Error('Token not found');
    }
    
    console.log('Account found, checking if it\'s a valid SPL token mint...');
    
    // Default metadata with fallback values
    const metadata: TokenMetadata = {
      address: cleanedAddress,
      symbol: `TOKEN-${cleanedAddress.slice(0, 4)}`, // Default symbol
      name: `Token ${cleanedAddress.slice(0, 8)}...`, // Default name
      decimals: 9, // Default to 9 decimals as a fallback
      isValid: true // Assume valid by default
    };
    
    // Try to extract data from the account if possible
    try {
      const parsedData = accountInfo.value.data as ParsedAccountData;
      
      if (parsedData && parsedData.parsed) {
        // Check if it's a token mint
        if (parsedData.parsed.type === 'mint' && parsedData.parsed.info) {
          console.log('Found token mint with info:', parsedData.parsed.info);
          
          // Extract decimals if available
          if (parsedData.parsed.info.decimals !== undefined) {
            metadata.decimals = parsedData.parsed.info.decimals;
            console.log(`Found token decimals from mint data: ${metadata.decimals}`);
          }
        } else {
          console.log(`Account is not a standard mint type: ${parsedData.parsed.type || 'unknown'}`);
          // Allow non-standard tokens, but log for debugging
        }
      } else {
        console.log('Account data could not be parsed as SPL token mint');
        // Continue with default values
      }
    } catch (error) {
      console.error('Error parsing account data:', error);
      // Continue with default values
    }
    
    // Try to get token metadata from Moralis API
    let gotMetadataFromExternalApi = false;
    
    try {
      console.log('Attempting to fetch metadata from Moralis API...');
      const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVjYzAxZDliLTdjYWItNDgzYy1hZDUzLTY4ZGMxMTkwZjZjNCIsIm9yZ0lkIjoiNDkyMTEiLCJ1c2VySWQiOiI0ODg3NiIsInR5cGVJZCI6IjUwMTgwNWE5LTVkNWEtNDI3OC1hMjE4LWIxNGFhYTU0OTljMCIsInR5cGUiOiJQUk9KRUNUIiwiaWF0IjoxNzQ0NTYzODI2LCJleHAiOjQ5MDAzMjM4MjZ9.XxbCVueyjps5wYAkl8AwuywxhBcw1xkieimSI_yOtfA';
      
      const response = await fetch(
        `https://solana-gateway.moralis.io/token/mainnet/${cleanedAddress}/metadata`,
        {
          headers: {
            'accept': 'application/json',
            'X-API-Key': MORALIS_API_KEY
          }
        }
      );
      
      if (response.ok) {
        const moralisData = await response.json();
        
        if (moralisData) {
          console.log('Successfully received data from Moralis:', moralisData);
          
          // Update metadata with Moralis data
          if (moralisData.symbol) metadata.symbol = moralisData.symbol;
          if (moralisData.name) metadata.name = moralisData.name;
          if (moralisData.decimals !== undefined) metadata.decimals = moralisData.decimals;
          if (moralisData.logo) metadata.logoURI = moralisData.logo;
          else if (moralisData.logoURI) metadata.logoURI = moralisData.logoURI;
          else if (moralisData.metaplex?.metadataUri) metadata.logoURI = moralisData.metaplex.metadataUri;
          
          gotMetadataFromExternalApi = true;
        }
      } else {
        console.log(`Moralis API returned status ${response.status}`);
      }
    } catch (error) {
      console.log('Could not fetch Moralis token metadata, trying fallback:', error);
    }
    
    // If Moralis failed, try Solscan API as fallback
    if (!gotMetadataFromExternalApi) {
      try {
        console.log('Attempting to fetch metadata from Solscan API...');
        const response = await fetch(`https://api.solscan.io/token/meta?token=${cleanedAddress}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.success && data.data) {
            console.log('Successfully received data from Solscan:', data);
            
            // Update metadata with Solscan data
            if (data.data.symbol) metadata.symbol = data.data.symbol;
            if (data.data.name) metadata.name = data.data.name;
            if (data.data.decimals !== undefined) metadata.decimals = data.data.decimals;
            if (data.data.icon) metadata.logoURI = data.data.icon;
            
            gotMetadataFromExternalApi = true;
          } else {
            console.log('Solscan returned data but without expected format');
          }
        } else {
          console.log(`Solscan API returned status ${response.status}`);
        }
      } catch (error) {
        console.log('Could not fetch token metadata from solscan, using defaults:', error);
      }
    }
    
    // If no data was found from external APIs and the account doesn't look like a mint,
    // we might want to mark the token as invalid, but for user flexibility we'll allow it
    if (!gotMetadataFromExternalApi) {
      console.log('No metadata found from external APIs, using default values');
    }
    
    // Save to cache
    console.log('Saving token metadata to cache:', metadata);
    tokenMetadataCache.set(cleanedAddress, metadata);
    return metadata;
    
  } catch (error) {
    console.error('Error validating token:', error);
    // Return a simplified error metadata for clear error messages
    const errorMetadata = {
      address: typeof address === 'string' ? address : '',
      symbol: 'UNKNOWN',
      name: 'Invalid Token',
      decimals: 9,
      isValid: false
    };
    console.log('Returning error metadata:', errorMetadata);
    return errorMetadata;
  }
};

/**
 * Get token balance for a specific token and owner
 */
export const getTokenBalance = async (
  connection: Connection,
  walletAddress: string,
  tokenAddress: string
): Promise<{ amount: number; uiAmount: string }> => {
  try {
    // Handle native SOL
    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      const balance = await connection.getBalance(new PublicKey(walletAddress));
      return {
        amount: balance,
        uiAmount: (balance / LAMPORTS_PER_SOL).toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 9
        })
      };
    }
    
    // Get all token accounts for wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: TOKEN_PROGRAM_ID
      }
    );
    
    // Find the specific token account
    const tokenAccount = tokenAccounts.value.find(account => {
      const parsedAccountInfo = account.account.data.parsed.info;
      return parsedAccountInfo.mint === tokenAddress;
    });
    
    if (!tokenAccount) {
      return { amount: 0, uiAmount: '0' };
    }
    
    // Get token metadata to know decimals
    const metadata = await validateSplToken(connection, tokenAddress);
    const parsedAccountInfo = tokenAccount.account.data.parsed.info;
    const balance = Number(parsedAccountInfo.tokenAmount.amount);
    const uiAmount = (balance / Math.pow(10, metadata.decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: metadata.decimals
    });
    
    return { amount: balance, uiAmount };
  } catch (error) {
    console.error('Error getting token balance:', error);
    return { amount: 0, uiAmount: '0' };
  }
};

/**
 * Convert amount to lamports or raw token amount
 */
export const amountToRaw = async (
  connection: Connection,
  tokenAddress: string,
  amount: string
): Promise<string> => {
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    console.error('Invalid amount:', amount);
    return '0';
  }

  try {
    console.log(`Converting ${amount} to raw amount for token: ${tokenAddress}`);
    
    // Handle known tokens with fixed decimals for faster processing
    // SOL (9 decimals)
    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      console.log('Using fixed decimals (9) for SOL');
      const rawAmount = parseFloat(amount) * 1_000_000_000; // 10^9
      console.log(`Converted amount: ${rawAmount}`);
      return Math.floor(rawAmount).toString();
    }
    
    // USDC (6 decimals)
    if (tokenAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      console.log('Using fixed decimals (6) for USDC');
      const rawAmount = parseFloat(amount) * 1_000_000; // 10^6
      console.log(`Converted amount: ${rawAmount}`);
      return Math.floor(rawAmount).toString();
    }
    
    // BONK (5 decimals)
    if (tokenAddress === 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263') {
      console.log('Using fixed decimals (5) for BONK');
      const rawAmount = parseFloat(amount) * 100_000; // 10^5
      console.log(`Converted amount: ${rawAmount}`);
      return Math.floor(rawAmount).toString();
    }
    
    // TRUMP (9 decimals)
    if (tokenAddress === '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN') {
      console.log('Using fixed decimals (9) for TRUMP');
      const rawAmount = parseFloat(amount) * 1_000_000_000; // 10^9
      console.log(`Converted amount: ${rawAmount}`);
      return Math.floor(rawAmount).toString();
    }
    
    // USDT (6 decimals)
    if (tokenAddress === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
      console.log('Using fixed decimals (6) for USDT');
      const rawAmount = parseFloat(amount) * 1_000_000; // 10^6
      console.log(`Converted amount: ${rawAmount}`);
      return Math.floor(rawAmount).toString();
    }
    
    // For other tokens, use the validation flow
    // Get token metadata to know decimals
    console.log('Getting token metadata for decimals...');
    const metadata = await validateSplToken(connection, tokenAddress);
    
    if (!metadata.isValid) {
      console.error('Invalid token address:', tokenAddress);
      return '0';
    }

    console.log(`Custom token decimals: ${metadata.decimals}`);
    
    // Convert UI amount to raw amount based on decimals
    const rawAmount = parseFloat(amount) * Math.pow(10, metadata.decimals);
    console.log(`Converted amount (${amount} * 10^${metadata.decimals}) = ${rawAmount}`);
    return Math.floor(rawAmount).toString(); // Floor to avoid floating point issues
  } catch (error) {
    console.error('Error converting amount to raw:', error);
    return '0';
  }
};

/**
 * Convert raw token amount to UI amount
 */
export const rawToUiAmount = async (
  connection: Connection,
  tokenAddress: string,
  rawAmount: string
): Promise<string> => {
  if (!rawAmount || isNaN(parseInt(rawAmount)) || parseInt(rawAmount) <= 0) {
    console.error('Invalid raw amount:', rawAmount);
    return '0';
  }

  try {
    // Handle known tokens with fixed decimals for faster processing
    // SOL (9 decimals)
    if (tokenAddress === 'So11111111111111111111111111111111111111112') {
      console.log('Using fixed decimals (9) for SOL');
      const uiAmount = parseInt(rawAmount) / 1_000_000_000; // 10^9
      return uiAmount.toString();
    }
    
    // USDC (6 decimals)
    if (tokenAddress === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      console.log('Using fixed decimals (6) for USDC');
      const uiAmount = parseInt(rawAmount) / 1_000_000; // 10^6
      return uiAmount.toString();
    }
    
    // BONK (5 decimals)
    if (tokenAddress === 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263') {
      console.log('Using fixed decimals (5) for BONK');
      const uiAmount = parseInt(rawAmount) / 100_000; // 10^5
      return uiAmount.toString();
    }
    
    // TRUMP (9 decimals)
    if (tokenAddress === '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN') {
      console.log('Using fixed decimals (9) for TRUMP');
      const uiAmount = parseInt(rawAmount) / 1_000_000_000; // 10^9
      return uiAmount.toString();
    }
    
    // USDT (6 decimals)
    if (tokenAddress === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') {
      console.log('Using fixed decimals (6) for USDT');
      const uiAmount = parseInt(rawAmount) / 1_000_000; // 10^6
      return uiAmount.toString();
    }
    
    // For other tokens, use the validation flow
    // Get token metadata to know decimals
    const metadata = await validateSplToken(connection, tokenAddress);
    
    if (!metadata.isValid) {
      console.error('Invalid token address:', tokenAddress);
      return '0';
    }

    // Convert raw amount to UI amount based on decimals
    const uiAmount = parseInt(rawAmount) / Math.pow(10, metadata.decimals);
    return uiAmount.toString();
  } catch (error) {
    console.error('Error converting raw to UI amount:', error);
    return '0';
  }
};

/**
 * Convert raw token amount to UI amount using decimals
 */
export const rawToAmount = (
  rawAmount: string,
  decimals: number
): string => {
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
 * Validate Solana address
 */
export const validateSolAddress = (address: string): boolean => {
  try {
    if (!address || typeof address !== 'string' || address.trim() === '') {
      console.error('Invalid Solana address: empty or not a string');
      return false;
    }
    
    // Check address length (Solana addresses are 32-44 characters)
    if (address.length < 32 || address.length > 44) {
      console.error(`Invalid Solana address length: ${address.length}`);
      return false;
    }
    
    // Basic format validation: Solana addresses are base58 encoded
    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(address)) {
      console.error('Invalid Solana address format: contains invalid characters');
      return false;
    }
    
    // Attempt to create a PublicKey to validate the address format
    // This is the most comprehensive check as it validates the checksum
    new PublicKey(address);
    return true;
  } catch (error) {
    console.error('Invalid Solana address format:', error);
    return false;
  }
};

/**
 * Fetch balances for all tokens in a wallet
 * @param connection The Solana connection
 * @param walletAddress The wallet address to check
 * @returns Array of token balances with mint addresses
 */
export const fetchTokenBalances = async (
  connection: Connection,
  walletAddress: string
): Promise<Array<{mint: string, amount: number, decimals: number}>> => {
  try {
    // Initialize results array
    const results: Array<{mint: string, amount: number, decimals: number}> = [];
    
    // Get SOL balance
    const solBalance = await connection.getBalance(new PublicKey(walletAddress));
    results.push({
      mint: 'So11111111111111111111111111111111111111112',
      amount: solBalance,
      decimals: 9
    });
    
    // Get all token accounts for wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(walletAddress),
      {
        programId: TOKEN_PROGRAM_ID
      }
    );
    
    // Process each token account
    for (const account of tokenAccounts.value) {
      const parsedAccountInfo = account.account.data.parsed.info;
      const mintAddress = parsedAccountInfo.mint;
      const balance = Number(parsedAccountInfo.tokenAmount.amount);
      const decimals = parsedAccountInfo.tokenAmount.decimals;
      
      // Only include tokens with balance > 0
      if (balance > 0) {
        results.push({
          mint: mintAddress,
          amount: balance,
          decimals
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
};

/**
 * Fetch token metadata from Moralis API
 * @param tokenAddress The token address to fetch metadata for
 * @returns Token metadata including symbol, name and decimals
 */
export const fetchTokenMetadataFromMoralis = async (
  tokenAddress: string
): Promise<{ symbol: string; name: string; decimals: number } | null> => {
  try {
    console.log(`Fetching token metadata for ${tokenAddress} from Moralis`);
    const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVjYzAxZDliLTdjYWItNDgzYy1hZDUzLTY4ZGMxMTkwZjZjNCIsIm9yZ0lkIjoiNDkyMTEiLCJ1c2VySWQiOiI0ODg3NiIsInR5cGVJZCI6IjUwMTgwNWE5LTVkNWEtNDI3OC1hMjE4LWIxNGFhYTU0OTljMCIsInR5cGUiOiJQUk9KRUNUIiwiaWF0IjoxNzQ0NTYzODI2LCJleHAiOjQ5MDAzMjM4MjZ9.XxbCVueyjps5wYAkl8AwuywxhBcw1xkieimSI_yOtfA';
    
    const response = await fetch(
      `https://solana-gateway.moralis.io/token/mainnet/${tokenAddress}/metadata`,
      {
        headers: {
          'accept': 'application/json',
          'X-API-Key': MORALIS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      console.error(`Error fetching metadata for ${tokenAddress}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`Metadata for ${tokenAddress}:`, data);
    
    if (!data || !data.symbol) {
      console.error(`Invalid metadata for ${tokenAddress}`);
      return null;
    }
    
    return {
      symbol: data.symbol,
      name: data.name || data.symbol,
      decimals: data.decimals || 9
    };
  } catch (error) {
    console.error(`Error fetching token metadata:`, error);
    return null;
  }
}; 
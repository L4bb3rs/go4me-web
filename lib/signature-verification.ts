/**
 * Signature verification utilities for Chia wallet authentication via WalletConnect
 */

import { SignatureVerificationData } from './types/links'

/**
 * Verify a Chia signature using WalletConnect signMessage
 */
export async function verifyChiaSignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    // Basic validation
    if (!signature || signature.length < 64) {
      console.warn('Invalid signature format')
      return false
    }

    // Check if address looks like a valid Chia address
    if (!address || !address.startsWith('xch1') || address.length !== 62) {
      console.warn('Invalid Chia address format')
      return false
    }

    // Check if message is not empty
    if (!message || message.trim().length === 0) {
      console.warn('Empty message')
      return false
    }

    // TODO: Implement actual Chia signature verification
    // This would use Chia's cryptographic libraries to verify:
    // 1. Parse the signature hex
    // 2. Verify against the message and public key derived from address
    // 3. Ensure the signature was created by the private key corresponding to the address

    console.log('WalletConnect signature verification (placeholder):', {
      message,
      signature: signature.substring(0, 16) + '...',
      address,
      valid: true
    })

    // For development, accept all properly formatted signatures
    return true
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Verify signature data with additional checks
 */
export async function verifySignatureData(
  data: SignatureVerificationData,
  expectedUsername: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check timestamp (must be within last 5 minutes)
    const now = Date.now()
    const timeDiff = now - data.timestamp
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    if (timeDiff > maxAge) {
      return { valid: false, error: 'Signature timestamp too old' }
    }
    
    if (timeDiff < -60000) { // Allow 1 minute clock skew
      return { valid: false, error: 'Signature timestamp in future' }
    }
    
    // Verify the signature
    const isValidSignature = await verifyChiaSignature(
      data.message,
      data.signature,
      data.address
    )
    
    if (!isValidSignature) {
      return { valid: false, error: 'Invalid signature' }
    }
    
    // Check if message contains expected username
    if (!data.message.includes(expectedUsername)) {
      return { valid: false, error: 'Message does not match username' }
    }
    
    return { valid: true }
  } catch (error) {
    console.error('Signature data verification error:', error)
    return { valid: false, error: 'Verification failed' }
  }
}

/**
 * Get the user's wallet address from their profile
 * This should match the address used for signing
 */
export async function getUserWalletAddress(username: string): Promise<string | null> {
  try {
    // TODO: Implement actual user address lookup
    // This would query your user database to get the wallet address
    // associated with the username
    
    // For now, return a placeholder
    console.log('Getting wallet address for user:', username)
    
    // In production, you'd query your database:
    // const user = await db.users.findOne({ username })
    // return user?.wallet_address || null
    
    return null
  } catch (error) {
    console.error('Error getting user wallet address:', error)
    return null
  }
}

/**
 * Validate that the signing address matches the user's registered address
 */
export async function validateUserAddress(
  username: string,
  signingAddress: string
): Promise<boolean> {
  try {
    const userAddress = await getUserWalletAddress(username)
    
    if (!userAddress) {
      console.warn('No wallet address found for user:', username)
      return false
    }
    
    return userAddress === signingAddress
  } catch (error) {
    console.error('Error validating user address:', error)
    return false
  }
}

/**
 * Create a message for signing
 */
export function createSigningMessage(
  action: string,
  username: string,
  additionalData?: string
): { message: string; timestamp: number } {
  const timestamp = Date.now()
  const baseMessage = `${action} for ${username} at ${timestamp}`
  const message = additionalData ? `${baseMessage} - ${additionalData}` : baseMessage
  
  return { message, timestamp }
}

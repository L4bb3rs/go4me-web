/**
 * Domain ownership verification utilities for Chia addresses
 * Client-side utilities for message creation and API communication
 */

/**
 * Validate a Chia address format
 */
export function isValidChiaAddress(address: string): boolean {
  // Chia addresses start with 'xch1' and are 62 characters long
  return /^xch1[a-z0-9]{58}$/.test(address)
}

/**
 * Create a unique message for domain ownership verification
 * This message will be signed by the user's wallet using chia_signMessageByAddress
 * Includes nonce for replay attack prevention
 */
export function createDomainOwnershipMessage(domain: string, timestamp: number, nonce: string): string {
  return `Verify ownership of domain ${domain} at ${timestamp} with nonce ${nonce}`
}

/**
 * Verify domain ownership by calling the server-side verification API
 * The server will use chia-wallet-sdk to properly verify the BLS signature
 */
export async function verifyDomainOwnership(
  domain: string,
  expectedAddress: string,
  signedMessage: string,
  signature: string,
  publicKey: string,
  timestamp: number,
  signingAddress: string,
  nonce: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic client-side validation
    if (!isValidChiaAddress(expectedAddress)) {
      return { valid: false, error: 'Invalid expected address format' }
    }

    if (!isValidChiaAddress(signingAddress)) {
      return { valid: false, error: 'Invalid signing address format' }
    }

    if (signingAddress !== expectedAddress) {
      return { valid: false, error: `Address mismatch: expected ${expectedAddress}, but signed with ${signingAddress}` }
    }

    // Call the server-side verification API
    const response = await fetch('/api/domain-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        expectedAddress,
        message: signedMessage,
        signature,
        publicKey,
        timestamp,
        signingAddress,
        nonce
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return { valid: true }
    } else {
      return { valid: false, error: result.error || 'Server verification failed' }
    }

  } catch (error) {
    console.error('Domain ownership verification error:', error)
    return { valid: false, error: 'Verification request failed' }
  }
}

/**
 * Generate a verification challenge for a domain
 */
export function generateVerificationChallenge(domain: string): {
  message: string
  timestamp: number
  nonce: string
} {
  const timestamp = Date.now()
  const nonce = generateSecureNonce()
  const message = createDomainOwnershipMessage(domain, timestamp, nonce)

  return {
    message,
    timestamp,
    nonce
  }
}

/**
 * Remove domain ownership verification
 */
export async function unverifyDomainOwnership(domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Making DELETE request for domain:', domain)

    const url = '/api/domain-verification?' + new URLSearchParams({ domain })
    console.log('📡 DELETE URL:', url)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('📊 DELETE response status:', response.status)

    const data = await response.json()
    console.log('📋 DELETE response data:', data)

    if (response.ok && data.success) {
      console.log('✅ Domain verification removed successfully:', domain)
      return { success: true }
    }

    console.error('❌ Failed to remove domain verification:', data.error || data.message)
    return { success: false, error: data.error || data.message || 'Failed to remove verification' }
  } catch (error) {
    console.error('Domain ownership unverification error:', error)
    return { success: false, error: 'Network error during unverification' }
  }
}

/**
 * Generate a cryptographically secure nonce for replay attack prevention
 */
function generateSecureNonce(): string {
  // Generate 32 random bytes and convert to hex
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

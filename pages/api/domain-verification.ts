/**
 * API endpoint for domain ownership verification
 * POST /api/domain-verification - Verify and store domain ownership verification result
 * GET /api/domain-verification?domain=username - Get verification status for a domain
 */

import { NextApiRequest, NextApiResponse } from 'next'

// Production-ready BLS signature verification with Chia SDK

// WASM SDK singleton with proper initialization
let chiaSDK: any = null
let initializationPromise: Promise<any> | null = null

async function initializeChiaSDK() {
  // Ensure we only initialize once
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      console.log('🔄 Initializing Chia BLS SDK...')

      // Dynamic import with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SDK load timeout')), 10000)
      )

      const loadPromise = import('chia-wallet-sdk-wasm')

      chiaSDK = await Promise.race([loadPromise, timeoutPromise])

      console.log('✅ Chia BLS SDK initialized - Production cryptographic verification enabled')
      return chiaSDK

    } catch (error) {
      console.error('❌ CRITICAL: Failed to initialize Chia BLS SDK:', error)
      console.error('❌ Domain ownership verification is NOT SECURE without BLS verification')
      throw new Error(`BLS verification unavailable: ${error.message}`)
    }
  })()

  return initializationPromise
}

// Server-side BLS signature verification using chia-wallet-sdk
async function verifyBLSSignature(
  message: string,
  signature: string,
  publicKey: string,
  expectedAddress: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Load Chia SDK
    const sdk = await initializeChiaSDK()
    const { PublicKey, Signature, fromHex } = sdk

    // Clean hex strings
    const cleanSignature = signature.replace(/^0x/, '')
    const cleanPubKey = publicKey.replace(/^0x/, '')

    // Validate BLS signature format (should be 192 hex characters = 96 bytes)
    if (!/^[0-9a-fA-F]{192}$/.test(cleanSignature)) {
      return { valid: false, error: 'Invalid BLS signature format. Expected 192 hex characters.' }
    }

    // Validate BLS public key format (should be 96 hex characters = 48 bytes)
    if (!/^[0-9a-fA-F]{96}$/.test(cleanPubKey)) {
      return { valid: false, error: 'Invalid BLS public key format. Expected 96 hex characters.' }
    }

    // Basic message validation
    if (!message || message.length === 0) {
      return { valid: false, error: 'Empty message' }
    }

    // SECURITY: Verify public key derives to expected address
    // This prevents public key substitution attacks
    const derivedAddress = await deriveChiaAddressFromPublicKey(cleanPubKey)
    if (derivedAddress !== expectedAddress) {
      return {
        valid: false,
        error: `Public key does not derive to expected address. Expected: ${expectedAddress}, Derived: ${derivedAddress}`
      }
    }

    // REAL BLS SIGNATURE VERIFICATION using chia-wallet-sdk
    try {
      // Convert hex strings to Uint8Array
      const publicKeyBytes = fromHex(cleanPubKey)
      const signatureBytes = fromHex(cleanSignature)
      const messageBytes = new TextEncoder().encode(message)

      // Create PublicKey and Signature objects
      const blsPublicKey = PublicKey.fromBytes(publicKeyBytes)
      const blsSignature = Signature.fromBytes(signatureBytes)

      // Verify the signature
      const isValid = blsPublicKey.verify(messageBytes, blsSignature)

      console.log('✅ Real BLS signature verification completed:', {
        messageLength: message.length,
        signatureValid: isValid,
        publicKeyValid: blsPublicKey.isValid(),
        signatureValidFormat: blsSignature.isValid()
      })

      if (!isValid) {
        return { valid: false, error: 'BLS signature verification failed' }
      }

      return { valid: true }

    } catch (cryptoError) {
      console.error('BLS cryptographic verification error:', cryptoError)
      return { valid: false, error: `Cryptographic verification failed: ${cryptoError.message}` }
    }

  } catch (error) {
    console.error('BLS signature verification error:', error)
    return { valid: false, error: 'Signature verification failed' }
  }
}

// Derive Chia address from public key using chia-wallet-sdk
async function deriveChiaAddressFromPublicKey(publicKey: string): Promise<string> {
  try {
    // Load Chia SDK
    const sdk = await initializeChiaSDK()
    const { PublicKey, standardPuzzleHash, Address, fromHex } = sdk

    // Convert hex string to Uint8Array
    const publicKeyBytes = fromHex(publicKey)

    // Create PublicKey object
    const blsPublicKey = PublicKey.fromBytes(publicKeyBytes)

    // Derive synthetic public key (standard wallet derivation)
    const syntheticPublicKey = blsPublicKey.deriveSynthetic()

    // Get the standard puzzle hash
    const puzzleHash = standardPuzzleHash(syntheticPublicKey)

    // Create address with 'xch' prefix
    const address = new Address(puzzleHash, 'xch')

    // Return the encoded address
    return address.encode()

  } catch (error) {
    console.error('Address derivation error:', error)
    throw new Error(`Failed to derive address from public key: ${error.message}`)
  }
}

function createDomainOwnershipMessage(domain: string, timestamp: number, nonce: string): string {
  return `Verify ownership of domain ${domain} at ${timestamp} with nonce ${nonce}`
}

/**
 * Sanitize and validate domain name to prevent injection attacks
 */
function sanitizeDomainName(domain: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!domain || typeof domain !== 'string') {
    return { valid: false, error: 'Domain must be a non-empty string' }
  }

  // Remove any potential injection characters
  const sanitized = domain.replace(/[^a-zA-Z0-9_-]/g, '')

  // Validate length
  if (sanitized.length === 0) {
    return { valid: false, error: 'Domain contains no valid characters' }
  }

  if (sanitized.length > 100) {
    return { valid: false, error: 'Domain name too long' }
  }

  // Validate format (alphanumeric, underscore, hyphen only)
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { valid: false, error: 'Domain contains invalid characters' }
  }

  return { valid: true, sanitized }
}

function isValidChiaAddress(address: string): boolean {
  return /^xch1[a-z0-9]{58}$/.test(address)
}

// In-memory storage for development (replace with database in production)
const verificationStorage = new Map<string, {
  domain: string
  address: string
  verified: boolean
  verifiedAt: number
  signature: string
  publicKey: string
  message: string
  nonce: string
}>()

// Nonce tracking to prevent replay attacks
const usedNonces = new Set<string>()
const NONCE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes
const nonceTimestamps = new Map<string, number>()

// Load existing verifications from a JSON file for persistence in development
import fs from 'fs'
import path from 'path'
const STORAGE_FILE = path.join(process.cwd(), '.domain-verifications.json')

// Load existing verifications on startup
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const data = fs.readFileSync(STORAGE_FILE, 'utf8')
    const verifications = JSON.parse(data)
    Object.entries(verifications).forEach(([domain, verification]) => {
      verificationStorage.set(domain, verification as any)
    })
    console.log('📂 Loaded', verificationStorage.size, 'existing verifications from file')
  }
} catch (error) {
  console.warn('⚠️ Could not load existing verifications:', error.message)
}

// Save verifications to file
function saveVerifications() {
  try {
    const data = Object.fromEntries(verificationStorage.entries())
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2))
    console.log('💾 Saved verifications to file')
  } catch (error) {
    console.warn('⚠️ Could not save verifications:', error.message)
  }
}

interface VerificationRequest {
  domain: string
  expectedAddress: string
  message: string
  signature: string
  publicKey: string
  timestamp: number
  signingAddress: string
  nonce: string
}

/**
 * Clean up expired nonces to prevent memory leaks
 */
function cleanupExpiredNonces() {
  const now = Date.now()
  for (const [nonce, timestamp] of nonceTimestamps.entries()) {
    if (now - timestamp > NONCE_EXPIRY_TIME) {
      usedNonces.delete(nonce)
      nonceTimestamps.delete(nonce)
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Production readiness check - only needed for verification (POST)
    try {
      await initializeChiaSDK()
    } catch (error) {
      console.error('❌ CRITICAL: BLS verification system unavailable')
      return res.status(503).json({
        error: 'Domain verification service unavailable',
        message: 'Cryptographic verification system is not properly initialized'
      })
    }
    try {
      // Clean up expired nonces periodically
      cleanupExpiredNonces()

      const verificationData: VerificationRequest = req.body

      // Validate required fields
      if (!verificationData.domain || !verificationData.expectedAddress ||
          !verificationData.message || !verificationData.signature ||
          !verificationData.publicKey || !verificationData.timestamp ||
          !verificationData.signingAddress || !verificationData.nonce) {
        return res.status(400).json({
          error: 'Missing required fields: domain, expectedAddress, message, signature, publicKey, timestamp, signingAddress, nonce'
        })
      }

      // Sanitize domain name to prevent injection attacks
      const domainValidation = sanitizeDomainName(verificationData.domain)
      if (!domainValidation.valid) {
        return res.status(400).json({ error: domainValidation.error })
      }
      const sanitizedDomain = domainValidation.sanitized!

      // Check for nonce reuse (replay attack prevention)
      if (usedNonces.has(verificationData.nonce)) {
        return res.status(400).json({ error: 'Nonce has already been used (replay attack detected)' })
      }

      // Validate address formats
      if (!isValidChiaAddress(verificationData.expectedAddress)) {
        return res.status(400).json({ error: 'Invalid expected address format' })
      }

      if (!isValidChiaAddress(verificationData.signingAddress)) {
        return res.status(400).json({ error: 'Invalid signing address format' })
      }

      // Check that signing address matches expected address
      if (verificationData.signingAddress !== verificationData.expectedAddress) {
        return res.status(400).json({
          error: `Address mismatch: expected ${verificationData.expectedAddress}, but signed with ${verificationData.signingAddress}`
        })
      }

      // Check timestamp (reduced to 2 minutes for better security)
      const now = Date.now()
      const timeDiff = now - verificationData.timestamp
      const maxAge = 2 * 60 * 1000 // 2 minutes (reduced from 10 for security)

      if (timeDiff > maxAge) {
        return res.status(400).json({ error: 'Verification timestamp too old (max 2 minutes)' })
      }

      if (timeDiff < -30000) { // Allow 30 seconds clock skew (reduced from 1 minute)
        return res.status(400).json({ error: 'Verification timestamp in future' })
      }

      // Verify the message format (now includes nonce)
      const expectedMessage = createDomainOwnershipMessage(sanitizedDomain, verificationData.timestamp, verificationData.nonce)
      if (verificationData.message !== expectedMessage) {
        return res.status(400).json({ error: 'Message format does not match expected format' })
      }

      // Mark nonce as used to prevent replay attacks
      usedNonces.add(verificationData.nonce)
      nonceTimestamps.set(verificationData.nonce, now)

      // Verify the BLS signature using chia-wallet-sdk
      const signatureVerification = await verifyBLSSignature(
        verificationData.message,
        verificationData.signature,
        verificationData.publicKey,
        verificationData.expectedAddress
      )

      if (!signatureVerification.valid) {
        // Remove nonce from used set if verification fails
        usedNonces.delete(verificationData.nonce)
        nonceTimestamps.delete(verificationData.nonce)
        return res.status(400).json({ error: signatureVerification.error || 'Invalid BLS signature' })
      }

      // Store the successful verification
      const verificationRecord = {
        domain: sanitizedDomain,
        address: verificationData.expectedAddress,
        verified: true,
        verifiedAt: Date.now(),
        signature: verificationData.signature,
        publicKey: verificationData.publicKey,
        message: verificationData.message,
        nonce: verificationData.nonce
      }

      console.log('💾 Storing verification for domain:', sanitizedDomain)
      verificationStorage.set(sanitizedDomain, verificationRecord)
      saveVerifications() // Persist to file
      console.log('✅ Verification stored. Storage now contains:', Array.from(verificationStorage.keys()))

      return res.status(200).json({
        success: true,
        verified: true,
        domain: verificationData.domain,
        address: verificationData.expectedAddress,
        verifiedAt: Date.now()
      })

    } catch (error: any) {
      console.error('Domain verification API error:', error)
      return res.status(500).json({ 
        error: 'Internal server error during verification',
        details: error.message 
      })
    }

  } else if (req.method === 'GET') {
    try {
      const { domain } = req.query

      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain parameter is required' })
      }

      const verification = verificationStorage.get(domain)

      console.log('🔍 GET /api/domain-verification - Looking up domain:', domain)
      console.log('📊 Current storage contents:', Array.from(verificationStorage.keys()))
      console.log('📋 Verification found:', verification ? 'YES' : 'NO')

      if (verification) {
        console.log('✅ Returning verified status for domain:', domain)
        return res.status(200).json({
          domain: verification.domain,
          address: verification.address,
          verified: verification.verified,
          verifiedAt: verification.verifiedAt
        })
      } else {
        console.log('❌ No verification found for domain:', domain)
        return res.status(404).json({
          domain,
          verified: false,
          message: 'No verification found for this domain'
        })
      }

    } catch (error: any) {
      console.error('Domain verification lookup error:', error)
      return res.status(500).json({
        error: 'Internal server error during lookup',
        details: error.message
      })
    }

  } else if (req.method === 'DELETE') {
    try {
      console.log('🗑️ DELETE request received')
      console.log('📋 Query params:', req.query)

      const { domain } = req.query

      if (!domain || typeof domain !== 'string') {
        console.log('❌ Missing or invalid domain parameter')
        return res.status(400).json({ error: 'Domain parameter is required' })
      }

      console.log('🔍 Raw domain from query:', domain)

      // Sanitize domain name
      const domainValidation = sanitizeDomainName(domain)
      if (!domainValidation.valid) {
        console.log('❌ Domain validation failed:', domainValidation.error)
        return res.status(400).json({ error: domainValidation.error })
      }
      const sanitizedDomain = domainValidation.sanitized!

      console.log('🗑️ DELETE /api/domain-verification - Removing verification for domain:', sanitizedDomain)
      console.log('📊 Current storage before deletion:', Array.from(verificationStorage.keys()))

      // Check if verification exists
      const verification = verificationStorage.get(sanitizedDomain)
      if (!verification) {
        return res.status(404).json({
          domain: sanitizedDomain,
          verified: false,
          message: 'No verification found for this domain'
        })
      }

      // Remove the verification
      verificationStorage.delete(sanitizedDomain)
      saveVerifications() // Persist to file

      console.log('✅ Verification removed for domain:', sanitizedDomain)
      console.log('📊 Storage now contains:', Array.from(verificationStorage.keys()))

      return res.status(200).json({
        success: true,
        domain: sanitizedDomain,
        verified: false,
        message: 'Domain verification removed successfully'
      })

    } catch (error: any) {
      console.error('Error removing verification:', error)
      return res.status(500).json({
        error: 'Internal server error during removal',
        details: error.message
      })
    }

  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}

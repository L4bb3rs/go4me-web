/**
 * API endpoint for creating new links
 * POST /api/links/create - Create a new link with signature verification
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { UserLink, CreateLinkRequest } from '../../../lib/types/links'
import { verifySignatureData, validateUserAddress } from '../../../lib/signature-verification'
import { v4 as uuidv4 } from 'uuid'

// In-memory storage for development (replace with database in production)
const linksStorage = new Map<string, UserLink[]>()

// Mock user addresses for development (replace with database lookup in production)
const userAddresses = new Map<string, string>()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const linkData: CreateLinkRequest = req.body

    // Validate required fields
    if (!linkData.title || !linkData.url || !linkData.username) {
      return res.status(400).json({ error: 'Title, URL, and username are required' })
    }

    if (!linkData.signature || !linkData.message || !linkData.address) {
      return res.status(400).json({ error: 'Signature, message, and address are required' })
    }

    // Validate URL format
    try {
      new URL(linkData.url)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Extract timestamp from message (basic parsing)
    const timestampMatch = linkData.message.match(/at (\d+)/)
    if (!timestampMatch) {
      return res.status(400).json({ error: 'Invalid message format' })
    }

    const timestamp = parseInt(timestampMatch[1])

    // Verify signature
    const signatureData = {
      message: linkData.message,
      signature: linkData.signature,
      address: linkData.address,
      action: 'create' as const,
      timestamp
    }

    const verificationResult = await verifySignatureData(signatureData, linkData.username)
    if (!verificationResult.valid) {
      return res.status(401).json({ error: verificationResult.error || 'Invalid signature' })
    }

    // For development, store the user's address if not already stored
    if (!userAddresses.has(linkData.username)) {
      userAddresses.set(linkData.username, linkData.address)
    }

    // Validate that the signing address matches the user's registered address
    const isValidUser = await validateUserAddress(linkData.username, linkData.address)
    if (!isValidUser) {
      // For development, allow if no address is registered yet
      if (!userAddresses.has(linkData.username)) {
        userAddresses.set(linkData.username, linkData.address)
      } else if (userAddresses.get(linkData.username) !== linkData.address) {
        return res.status(403).json({ error: 'Address does not match registered user address' })
      }
    }

    // Get existing links for the user
    const existingLinks = linksStorage.get(linkData.username) || []

    // Determine the order for the new link
    const maxOrder = existingLinks.length > 0 
      ? Math.max(...existingLinks.map(link => link.order))
      : 0
    const newOrder = linkData.order || (maxOrder + 1)

    // Create the new link
    const newLink: UserLink = {
      id: uuidv4(),
      username: linkData.username,
      title: linkData.title.trim(),
      url: linkData.url.trim(),
      description: linkData.description?.trim() || undefined,
      icon: linkData.icon || '🔗',
      order: newOrder,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add the new link to storage
    const updatedLinks = [...existingLinks, newLink]
    linksStorage.set(linkData.username, updatedLinks)

    console.log(`Created new link for ${linkData.username}:`, {
      id: newLink.id,
      title: newLink.title,
      url: newLink.url
    })

    return res.status(201).json({ 
      success: true, 
      link: newLink,
      message: 'Link created successfully'
    })

  } catch (error) {
    console.error('Error creating link:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

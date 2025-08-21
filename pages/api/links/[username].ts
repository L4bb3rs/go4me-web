/**
 * API endpoint for managing user links
 * GET /api/links/[username] - Get all links for a user
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { UserLink } from '../../../lib/types/links'

// In-memory storage for development (replace with database in production)
const linksStorage = new Map<string, UserLink[]>()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { username } = req.query

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetLinks(res, username)
      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Links API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleGetLinks(
  res: NextApiResponse,
  username: string
) {
  try {
    // Get links for the user
    const userLinks = linksStorage.get(username) || []
    
    // Filter active links and sort by order
    const activeLinks = userLinks
      .filter(link => link.is_active)
      .sort((a, b) => a.order - b.order)

    // Add some demo data if no links exist
    if (activeLinks.length === 0 && username === 'demo') {
      const demoLinks: UserLink[] = [
        {
          id: 'demo-1',
          username: 'demo',
          title: 'My Website',
          url: 'https://example.com',
          description: 'Check out my personal website',
          icon: '🌐',
          order: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          username: 'demo',
          title: 'Twitter',
          url: 'https://twitter.com/demo',
          description: 'Follow me on Twitter',
          icon: '🐦',
          order: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-3',
          username: 'demo',
          title: 'NFT Collection',
          url: 'https://mintgarden.io/collections/demo',
          description: 'View my NFT collection',
          icon: '🖼️',
          order: 3,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      linksStorage.set(username, demoLinks)
      return res.status(200).json({ links: demoLinks })
    }

    return res.status(200).json({ links: activeLinks })
  } catch (error) {
    console.error('Error getting links:', error)
    return res.status(500).json({ error: 'Failed to get links' })
  }
}

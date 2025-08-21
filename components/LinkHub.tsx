/**
 * Link-in-Bio Hub component
 * Displays custom links for a user's domain page
 */

import { useState, useEffect } from 'react'
import { Button, Icon, Loader, Message } from 'semantic-ui-react'
import { UserLink } from '../lib/types/links'
import { AddLinkModal } from './AddLinkModal'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'
import styles from '../styles/Home.module.css'

interface LinkHubProps {
  username: string
  isOwner?: boolean
  rootHostForLinks?: string
}

export function LinkHub({ username, isOwner = false, rootHostForLinks }: LinkHubProps) {
  const [links, setLinks] = useState<UserLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const { isConnected, getConnectedAddress, chiaSignMessage } = useJsonRpc()

  // Load links on component mount
  useEffect(() => {
    loadLinks()
  }, [username])

  const loadLinks = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/links/${username}`)
      if (!response.ok) {
        throw new Error('Failed to load links')
      }

      const data = await response.json()
      setLinks(data.links || [])
    } catch (err: any) {
      console.error('Error loading links:', err)
      setError(err.message || 'Failed to load links')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkAdded = () => {
    setShowAddModal(false)
    loadLinks() // Refresh the links
  }

  const handleLinkClick = (url: string) => {
    // Track click analytics here if needed
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Loader active inline='centered' size='medium' />
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--color-text-subtle)' }}>
          Loading links...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Message negative>
          <Message.Header>Error Loading Links</Message.Header>
          <p>{error}</p>
          <Button onClick={loadLinks} size='small'>
            Try Again
          </Button>
        </Message>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 20 }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20 
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: 18, 
          fontWeight: 600,
          color: 'var(--color-text)' 
        }}>
          Links
        </h3>
        
        {isOwner && (
          <Button
            primary
            size='small'
            icon='plus'
            content='Add Link'
            onClick={() => setShowAddModal(true)}
            disabled={!isConnected()}
            title={!isConnected() ? 'Connect your wallet to add links' : 'Add a new link'}
          />
        )}
      </div>

      {/* Wallet connection status for owner */}
      {isOwner && !isConnected() && (
        <Message info size='small' style={{ marginBottom: 20 }}>
          <Icon name='wallet' />
          Connect your wallet to manage your links
        </Message>
      )}

      {/* Links display */}
      {links.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: 'var(--color-text-subtle)',
          fontSize: 14
        }}>
          {isOwner ? (
            <>
              <Icon name='link' size='large' style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>No links added yet.</div>
              <div style={{ marginTop: 8 }}>
                {isConnected() ? 'Click "Add Link" to get started!' : 'Connect your wallet to add links.'}
              </div>
            </>
          ) : (
            <>
              <Icon name='link' size='large' style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>@{username} hasn't added any links yet.</div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {links.map((link) => (
            <div
              key={link.id}
              className={styles.linkCard}
              onClick={() => handleLinkClick(link.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                e.currentTarget.style.borderColor = 'var(--color-link)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              {/* Icon */}
              <div style={{
                fontSize: 24,
                marginRight: 16,
                flexShrink: 0
              }}>
                {link.icon || '🔗'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {link.title}
                </div>
                {link.description && (
                  <div style={{
                    fontSize: 14,
                    color: 'var(--color-text-subtle)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {link.description}
                  </div>
                )}
              </div>

              {/* External link icon */}
              <Icon 
                name='external alternate' 
                size='small' 
                style={{ 
                  color: 'var(--color-text-subtle)',
                  flexShrink: 0,
                  marginLeft: 12
                }} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Link Modal */}
      {showAddModal && (
        <AddLinkModal
          username={username}
          chiaSignMessage={chiaSignMessage}
          getConnectedAddress={getConnectedAddress}
          onClose={() => setShowAddModal(false)}
          onLinkAdded={handleLinkAdded}
        />
      )}
    </div>
  )
}

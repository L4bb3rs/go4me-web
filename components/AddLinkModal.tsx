/**
 * Modal for adding/editing links with WalletConnect authentication
 */

import { useState } from 'react'
import { Modal, Form, Button, Message, Dropdown, Icon } from 'semantic-ui-react'
import { LINK_ICONS, LinkIconType } from '../lib/types/links'
import { signLinkCreation } from '../lib/wallet-connect-signing'

interface AddLinkModalProps {
  username: string
  chiaSignMessage: (data: { message: string; address: string }) => Promise<{ signature: string; message: string; address: string }>
  getConnectedAddress: () => string | null
  onClose: () => void
  onLinkAdded: () => void
}

export function AddLinkModal({ username, chiaSignMessage, getConnectedAddress, onClose, onLinkAdded }: AddLinkModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<LinkIconType>('custom')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create dropdown options for icons
  const iconOptions = Object.entries(LINK_ICONS).map(([key, emoji]) => ({
    key,
    value: key,
    text: `${emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}`,
    content: (
      <span>
        <span style={{ marginRight: 8 }}>{emoji}</span>
        {key.charAt(0).toUpperCase() + key.slice(1)}
      </span>
    )
  }))

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required')
      return false
    }

    if (!url.trim()) {
      setError('URL is required')
      return false
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      return false
    }

    const walletAddress = getConnectedAddress()
    if (!walletAddress) {
      setError('Wallet not connected')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    const walletAddress = getConnectedAddress()
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Sign the link creation request
      const signResult = await signLinkCreation(chiaSignMessage, username, walletAddress)

      if (!signResult.success) {
        throw new Error(signResult.error || 'Failed to sign request')
      }

      // Submit the link to the API
      const response = await fetch('/api/links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || undefined,
          icon: LINK_ICONS[selectedIcon],
          signature: signResult.signature,
          message: signResult.message,
          address: walletAddress,
          username
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create link')
      }

      // Success!
      onLinkAdded()
    } catch (err: any) {
      console.error('Error creating link:', err)
      setError(err.message || 'Failed to create link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} size='small'>
      <Modal.Header>
        <Icon name='plus' />
        Add New Link
      </Modal.Header>
      
      <Modal.Content>
        <Form>
          <Form.Field required>
            <label>Title</label>
            <Form.Input
              placeholder='e.g., My Website, Twitter, Portfolio'
              value={title}
              onChange={(_, { value }) => setTitle(value)}
              maxLength={100}
            />
          </Form.Field>

          <Form.Field required>
            <label>URL</label>
            <Form.Input
              placeholder='https://example.com'
              value={url}
              onChange={(_, { value }) => setUrl(value)}
              maxLength={500}
            />
          </Form.Field>

          <Form.Field>
            <label>Description (optional)</label>
            <Form.Input
              placeholder='Brief description of this link'
              value={description}
              onChange={(_, { value }) => setDescription(value)}
              maxLength={200}
            />
          </Form.Field>

          <Form.Field>
            <label>Icon</label>
            <Dropdown
              selection
              value={selectedIcon}
              options={iconOptions}
              onChange={(_, { value }) => setSelectedIcon(value as LinkIconType)}
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)'
              }}
            />
          </Form.Field>

          {error && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {!getConnectedAddress() && (
            <Message warning>
              <Message.Header>Wallet Not Connected</Message.Header>
              <p>Please connect your wallet to add links.</p>
            </Message>
          )}
        </Form>
      </Modal.Content>

      <Modal.Actions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          primary
          onClick={handleSubmit}
          loading={loading}
          disabled={!getConnectedAddress() || loading}
        >
          <Icon name='checkmark' />
          Add Link
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

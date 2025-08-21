/**
 * Modal for adding/editing links with WalletConnect authentication
 */

import { useState } from 'react'
import { Modal, Form, Button, Message, Dropdown, Icon } from 'semantic-ui-react'
import { LINK_ICONS, LinkIconType } from '../lib/types/links'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'

interface AddLinkModalProps {
  username: string
  onClose: () => void
  onLinkAdded: () => void
}

export function AddLinkModal({ username, onClose, onLinkAdded }: AddLinkModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<LinkIconType>('custom')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { chiaSignMessage, chiaGetAddress, isConnected } = useJsonRpc()

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

    if (!isConnected()) {
      setError('Wallet not connected')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get the wallet address
      const addressResult = await chiaGetAddress()
      const walletAddress = addressResult.address

      if (!walletAddress) {
        throw new Error('Could not get wallet address')
      }

      // Create the message to sign
      const timestamp = Date.now()
      const message = `Create link for ${username} at ${timestamp}`

      console.log('🔍 Signing link creation request:', { message, address: walletAddress })

      // Sign the message
      const signResult = await chiaSignMessage({
        message,
        address: walletAddress
      })

      console.log('✅ Link creation signed:', signResult)

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
          message: message,
          address: walletAddress,
          username
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create link')
      }

      const result = await response.json()
      console.log('✅ Link created successfully:', result)

      // Success!
      onLinkAdded()
    } catch (err: any) {
      console.error('❌ Error creating link:', err)

      // Handle user rejection gracefully
      if (err.message && err.message.toLowerCase().includes('rejected')) {
        setError('Signature request was rejected. Please try again.')
      } else {
        setError(err.message || 'Failed to create link')
      }
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

          {!isConnected() && (
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
          disabled={!isConnected() || loading}
        >
          <Icon name='checkmark' />
          Add Link
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

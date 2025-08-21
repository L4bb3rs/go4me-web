/**
 * Debug panel for testing WalletConnect methods
 */

import { useState } from 'react'
import { Button, Message, Segment, Header, Divider } from 'semantic-ui-react'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'

interface WalletDebugPanelProps {
  domainAddress?: string
}

export function WalletDebugPanel({ domainAddress }: WalletDebugPanelProps) {
  const { isConnected, getCurrentAddress, chiaSignMessage, chiaGetAddress, chiaGetWalletAddresses } = useJsonRpc()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [customMessage, setCustomMessage] = useState('')

  const addResult = (method: string, result: any, error?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    setResults(prev => [...prev, {
      timestamp,
      method,
      result,
      error,
      id: Date.now()
    }])
  }

  const testGetAddress = async () => {
    setLoading(true)
    try {
      console.log('🔍 Testing chia_getAddress (no params)...')
      const result = await chiaGetAddress()
      console.log('✅ chia_getAddress result:', result)
      addResult('chia_getAddress', result)
    } catch (error: any) {
      console.error('❌ chia_getAddress error:', error)
      addResult('chia_getAddress', null, error.message)
    } finally {
      setLoading(false)
    }
  }

  const testSignMessage = async () => {
    setLoading(true)
    try {
      // First get the current address from the wallet
      const currentAddress = await getCurrentAddress()
      if (!currentAddress) {
        throw new Error('Could not get current address from wallet')
      }

      const testMessage = `Test message at ${Date.now()}`
      console.log('🔍 Testing chia_signMessageByAddress...', { message: testMessage, address: currentAddress })

      const result = await chiaSignMessage({
        message: testMessage,
        address: currentAddress
      })

      console.log('✅ chia_signMessageByAddress result:', result)
      addResult('chia_signMessageByAddress', result)
    } catch (error: any) {
      console.error('❌ chia_signMessageByAddress error:', error)
      addResult('chia_signMessageByAddress', null, error.message)
    } finally {
      setLoading(false)
    }
  }

  const testCustomMessage = async () => {
    setLoading(true)
    try {
      // Get the current address from the wallet
      const addressResult = await chiaGetAddress()
      const currentAddress = addressResult.address

      if (!currentAddress) {
        throw new Error('Could not get current address from wallet')
      }

      const messageToSign = customMessage || `Custom message at ${Date.now()}`
      console.log('🔍 Testing custom message signing...', { message: messageToSign, address: currentAddress })

      const result = await chiaSignMessage({
        message: messageToSign,
        address: currentAddress
      })

      console.log('✅ Custom message signed:', result)
      addResult('chia_signMessageByAddress (custom)', {
        message: messageToSign,
        ...result
      })
    } catch (error: any) {
      console.error('❌ Custom message signing error:', error)
      addResult('chia_signMessageByAddress (custom)', null, error.message)
    } finally {
      setLoading(false)
    }
  }

  const testGetAllAddresses = async () => {
    setLoading(true)
    try {
      console.log('🔍 Testing chia_getWalletAddresses...')
      const result = await chiaGetWalletAddresses()
      console.log('✅ chia_getWalletAddresses result:', result)

      // Check which address matches the domain
      const matchingAddress = result.addresses.find(addr => addr === domainAddress)

      addResult('chia_getWalletAddresses', {
        ...result,
        domainAddress,
        matchingAddress: matchingAddress || 'No match found',
        totalAddresses: result.addresses.length
      })
    } catch (error: any) {
      console.error('❌ chia_getWalletAddresses error:', error)
      addResult('chia_getWalletAddresses', null, error.message)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  if (!isConnected()) {
    return (
      <Segment>
        <Header size='small'>🔧 Wallet Debug Panel</Header>
        <Message warning>
          <Message.Header>Wallet Not Connected</Message.Header>
          <p>Please connect your wallet to test the methods.</p>
        </Message>
      </Segment>
    )
  }

  return (
    <Segment>
      <Header size='small'>🔧 Wallet Debug Panel</Header>
      
      <div style={{ marginBottom: 16 }}>
        <Button
          primary
          size='small'
          onClick={testGetAddress}
          loading={loading}
          disabled={loading}
        >
          Test chia_getAddress
        </Button>
        
        <Button
          secondary
          size='small'
          onClick={testSignMessage}
          loading={loading}
          disabled={loading}
          style={{ marginLeft: 8 }}
        >
          Test chia_signMessageByAddress
        </Button>

        <Button
          color='teal'
          size='small'
          onClick={testGetAllAddresses}
          loading={loading}
          disabled={loading}
          style={{ marginLeft: 8 }}
        >
          Get All Addresses
        </Button>

        <Button
          basic
          size='small'
          onClick={clearResults}
          disabled={results.length === 0}
          style={{ marginLeft: 8 }}
        >
          Clear Results
        </Button>
      </div>

      {results.length > 0 && (
        <>
          <Divider />
          <Header size='tiny'>Results:</Header>
          <div style={{ 
            maxHeight: 300, 
            overflowY: 'auto', 
            fontSize: 12, 
            fontFamily: 'monospace',
            backgroundColor: '#f8f9fa',
            padding: 12,
            borderRadius: 4,
            border: '1px solid #e9ecef'
          }}>
            {results.map((result) => (
              <div key={result.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #dee2e6' }}>
                <div style={{ color: '#6c757d', fontSize: 10 }}>
                  [{result.timestamp}] <strong>{result.method}</strong>
                </div>
                {result.error ? (
                  <div style={{ color: '#dc3545', marginTop: 4 }}>
                    ❌ Error: {result.error}
                  </div>
                ) : (
                  <div style={{ color: '#28a745', marginTop: 4 }}>
                    ✅ Success: {JSON.stringify(result.result, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />
      <div style={{ fontSize: 11, color: '#6c757d' }}>
        💡 Check browser console for detailed logs
      </div>
    </Segment>
  )
}

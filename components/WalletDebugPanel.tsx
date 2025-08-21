/**
 * Debug panel for testing WalletConnect methods
 */

import { useState } from 'react'
import { Button, Message, Segment, Header, Divider } from 'semantic-ui-react'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'

export function WalletDebugPanel() {
  const { isConnected, getCurrentAddress, chiaSignMessage } = useJsonRpc()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

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
      console.log('🔍 Testing chia_getAddress...')
      const address = await getCurrentAddress()
      console.log('✅ chia_getAddress result:', address)
      addResult('chia_getAddress', { address })
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
      // First get the address
      const address = await getCurrentAddress()
      if (!address) {
        throw new Error('No address available')
      }

      const testMessage = `Test message at ${Date.now()}`
      console.log('🔍 Testing chia_signMessageByAddress...', { message: testMessage, address })
      
      const result = await chiaSignMessage({
        message: testMessage,
        address: address
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

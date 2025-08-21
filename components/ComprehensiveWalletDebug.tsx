/**
 * Comprehensive debug panel for all WalletConnect commands
 */

import { useState } from 'react'
import { Button, Message, Segment, Header, Divider, Grid, Form, Input } from 'semantic-ui-react'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'
import { useWalletConnect } from '../lib/wallet/WalletConnectContext'

interface DebugResult {
  timestamp: string
  method: string
  result: any
  error?: any
  id: number
}

export function ComprehensiveWalletDebug() {
  const { isConnected } = useJsonRpc()
  const { client, session, chainId } = useWalletConnect()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugResult[]>([])

  // Form inputs for parameterized commands
  const [customMessage, setCustomMessage] = useState('Test message')
  const [targetAddress, setTargetAddress] = useState('')
  const [offerString, setOfferString] = useState('')
  const [assetId, setAssetId] = useState('')
  const [amount, setAmount] = useState('1000')
  const [fee, setFee] = useState('1')

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

  const executeCommand = async (command: string, params: any = {}) => {
    if (!client || !session) {
      addResult(command, null, 'Client or session not available')
      return
    }

    setLoading(true)
    try {
      console.log(`🔍 Testing ${command}...`, params)
      
      const result = await client.request({
        topic: session.topic,
        chainId,
        request: { method: command, params },
      })
      
      console.log(`✅ ${command} result:`, result)
      addResult(command, result)
    } catch (error: any) {
      console.error(`❌ ${command} error:`, error)

      // Categorize error types
      let errorType = 'Unknown Error'
      if (error.message.includes('Missing or invalid')) {
        errorType = 'Method Not Supported'
      } else if (error.message.includes('rejected')) {
        errorType = 'User Rejected'
      } else if (error.message.includes('insufficient')) {
        errorType = 'Insufficient Funds'
      }

      addResult(command, null, `${errorType}: ${error.message}`)
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
        <Header size='small'>🔧 Comprehensive Wallet Debug Panel</Header>
        <Message warning>
          <Message.Header>Wallet Not Connected</Message.Header>
          <p>Please connect your wallet to test the methods.</p>
        </Message>
      </Segment>
    )
  }

  return (
    <Segment>
      <Header size='small'>🔧 Comprehensive Wallet Debug Panel</Header>
      
      {/* Input Forms */}
      <Segment>
        <Header size='tiny'>Parameters for Testing:</Header>
        <Form>
          <Form.Group widths='equal'>
            <Form.Field>
              <label>Custom Message</label>
              <Input
                value={customMessage}
                onChange={(_, { value }) => setCustomMessage(value)}
                placeholder="Message to sign"
              />
            </Form.Field>
            <Form.Field>
              <label>Target Address</label>
              <Input
                value={targetAddress}
                onChange={(_, { value }) => setTargetAddress(value)}
                placeholder="xch1..."
              />
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field>
              <label>Offer String</label>
              <Input
                value={offerString}
                onChange={(_, { value }) => setOfferString(value)}
                placeholder="Offer string for takeOffer"
              />
            </Form.Field>
            <Form.Field>
              <label>Asset ID</label>
              <Input
                value={assetId}
                onChange={(_, { value }) => setAssetId(value)}
                placeholder="Asset ID for CAT/NFT operations"
              />
            </Form.Field>
          </Form.Group>
          <Form.Group widths='equal'>
            <Form.Field>
              <label>Amount</label>
              <Input
                value={amount}
                onChange={(_, { value }) => setAmount(value)}
                placeholder="Amount in mojos"
              />
            </Form.Field>
            <Form.Field>
              <label>Fee</label>
              <Input
                value={fee}
                onChange={(_, { value }) => setFee(value)}
                placeholder="Fee in mojos"
              />
            </Form.Field>
          </Form.Group>
        </Form>
      </Segment>

      {/* Command Buttons */}
      <Grid columns={3} stackable>
        
        {/* CHIP-0002 Commands */}
        <Grid.Column>
          <Header size='tiny'>CHIP-0002 Commands</Header>
          
          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chip0002_chainId')}
            loading={loading} disabled={loading}>
            chip0002_chainId
          </Button>
          
          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chip0002_connect')}
            loading={loading} disabled={loading}>
            chip0002_connect
          </Button>
          
          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chip0002_getPublicKeys')}
            loading={loading} disabled={loading}>
            chip0002_getPublicKeys
          </Button>
          
          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chip0002_getAssetBalance', { type: 'cat', assetId: null })}
            loading={loading} disabled={loading}>
            chip0002_getAssetBalance (XCH)
          </Button>
          
          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chip0002_getAssetCoins', { type: null, assetId: null })}
            loading={loading} disabled={loading}>
            chip0002_getAssetCoins (XCH)
          </Button>
        </Grid.Column>

        {/* Chia Commands - Basic */}
        <Grid.Column>
          <Header size='tiny'>Chia Commands - Confirmed Working</Header>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chia_getAddress')}
            loading={loading} disabled={loading}>
            chia_getAddress ✅
          </Button>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => targetAddress && executeCommand('chia_signMessageByAddress', {
              message: customMessage,
              address: targetAddress
            })}
            loading={loading} disabled={loading || !targetAddress}>
            chia_signMessageByAddress ✅
          </Button>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => offerString && executeCommand('chia_takeOffer', {
              offer: offerString,
              fee: fee
            })}
            loading={loading} disabled={loading || !offerString}>
            chia_takeOffer ✅
          </Button>
        </Grid.Column>

        {/* Chia Commands - Experimental */}
        <Grid.Column>
          <Header size='tiny'>Chia Commands - Experimental</Header>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chia_getNfts', { limit: 10 })}
            loading={loading} disabled={loading}>
            chia_getNfts ⚠️
          </Button>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => targetAddress && executeCommand('chia_send', {
              address: targetAddress,
              amount: amount,
              fee: fee
            })}
            loading={loading} disabled={loading || !targetAddress}>
            chia_send ⚠️
          </Button>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chia_createOffer', {
              offerAssets: [{ assetId: '', amount: amount }],
              requestAssets: [{ assetId: assetId || '', amount: '1000' }],
              fee: fee
            })}
            loading={loading} disabled={loading}>
            chia_createOffer ⚠️
          </Button>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chia_cancelOffer', {
              id: 'test-offer-id',
              fee: fee
            })}
            loading={loading} disabled={loading}>
            chia_cancelOffer ⚠️
          </Button>

          <Button fluid size='mini' style={{ marginBottom: 4 }}
            onClick={() => executeCommand('chia_bulkMintNfts', {
              did: 'test-did',
              nfts: [{ address: targetAddress }],
              fee: fee
            })}
            loading={loading} disabled={loading}>
            chia_bulkMintNfts ⚠️
          </Button>
        </Grid.Column>
      </Grid>

      <Divider />
      
      <Button
        basic
        size='small'
        onClick={clearResults}
        disabled={results.length === 0}
      >
        Clear Results
      </Button>

      {/* Results Display */}
      {results.length > 0 && (
        <>
          <Divider />
          <Header size='tiny'>Results:</Header>
          <div style={{ 
            maxHeight: 400, 
            overflowY: 'auto', 
            fontSize: 11, 
            fontFamily: 'monospace',
            backgroundColor: '#f8f9fa',
            padding: 12,
            borderRadius: 4,
            border: '1px solid #e9ecef'
          }}>
            {results.slice(-10).map((result) => (
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
        💡 Check browser console for detailed logs. Showing last 10 results.
      </div>
    </Segment>
  )
}

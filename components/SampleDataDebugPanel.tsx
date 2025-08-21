/**
 * Comprehensive debug panel with sample data for all WalletConnect commands
 */

import { useState } from 'react'
import { Button, Message, Segment, Header, Divider, Grid, Accordion, Icon } from 'semantic-ui-react'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'
import { useWalletConnect } from '../lib/wallet/WalletConnectContext'

interface DebugResult {
  timestamp: string
  method: string
  params: any
  result: any
  error?: any
  id: number
}

export function SampleDataDebugPanel() {
  const { isConnected } = useJsonRpc()
  const { client, session, chainId } = useWalletConnect()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DebugResult[]>([])
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const addResult = (method: string, params: any, result: any, error?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    setResults(prev => [...prev, {
      timestamp,
      method,
      params,
      result,
      error,
      id: Date.now()
    }])
  }

  const executeCommand = async (command: string, params: any = {}) => {
    if (!client || !session) {
      addResult(command, params, null, 'Client or session not available')
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
      addResult(command, params, result)
    } catch (error: any) {
      console.error(`❌ ${command} error:`, error)

      let errorType = 'Unknown Error'
      if (error.message.includes('Missing or invalid')) {
        errorType = 'Method Not Supported'
      } else if (error.message.includes('rejected')) {
        errorType = 'User Rejected'
      } else if (error.message.includes('insufficient')) {
        errorType = 'Insufficient Funds'
      }

      addResult(command, params, null, `${errorType}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (e: any, titleProps: any) => {
    const { index } = titleProps
    const newIndex = activeIndex === index ? -1 : index
    setActiveIndex(newIndex)
  }

  const clearResults = () => {
    setResults([])
  }

  if (!isConnected()) {
    return (
      <Segment>
        <Header size='small'>🧪 Sample Data Debug Panel</Header>
        <Message warning>
          <Message.Header>Wallet Not Connected</Message.Header>
          <p>Please connect your wallet to test the methods.</p>
        </Message>
      </Segment>
    )
  }

  // Sample data for testing
  const sampleAddress = "xch19z5wehgk85002ey69llg5yk05crpnxym5k5w33ljkgf68x7d3zqs8jnzsm"
  const samplePublicKey = "b7a86a544b0b2610ecddf7a3bb30bc54bf11fd2c5fa0dd39e7606df920338f8905f8751440c752941220e70aa1062e9e"
  const sampleOffer = "offer1qqr83wcuu2rykcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhxhmzdsjhdx7p0hhzq6pxqgqxs"
  const sampleAssetId = "a628c1c2c6fcb74d53746157e438e108eab5c0bb54b5e3b5b2b5e5b5b5b5b5b5"
  const sampleDID = "did:chia:1jaax8rvs8gxk7z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8z8"

  return (
    <Segment>
      <Header size='small'>🧪 Sample Data Debug Panel</Header>
      <Message info size='small'>
        <Icon name='info circle' />
        All commands include realistic sample data. Click to expand and see parameters.
      </Message>

      <Accordion styled>

        {/* CHIP-0002 Commands */}
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          CHIP-0002 Commands (Blockchain Level)
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 0}>
          <Grid columns={2} stackable>
            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_chainId')}
                loading={loading} disabled={loading}>
                chip0002_chainId
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({})}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_connect', { eager: true })}
                loading={loading} disabled={loading}>
                chip0002_connect
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ eager: true })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_getPublicKeys', { limit: 5, offset: 0 })}
                loading={loading} disabled={loading}>
                chip0002_getPublicKeys
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ limit: 5, offset: 0 })}
              </div>
            </Grid.Column>

            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_getAssetBalance', { type: null, assetId: null })}
                loading={loading} disabled={loading}>
                chip0002_getAssetBalance (XCH)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ type: null, assetId: null })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_getAssetCoins', {
                  type: null,
                  assetId: null,
                  includedLocked: false,
                  offset: 0,
                  limit: 10
                })}
                loading={loading} disabled={loading}>
                chip0002_getAssetCoins (XCH)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ type: null, assetId: null, includedLocked: false, offset: 0, limit: 10 })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_getAssetBalance', { type: 'cat', assetId: sampleAssetId })}
                loading={loading} disabled={loading}>
                chip0002_getAssetBalance (CAT)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ type: 'cat', assetId: sampleAssetId })}
              </div>
            </Grid.Column>
          </Grid>
        </Accordion.Content>

        {/* Chia Commands - Basic */}
        <Accordion.Title
          active={activeIndex === 1}
          index={1}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          Chia Commands - Basic ✅
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 1}>
          <Grid columns={2} stackable>
            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_getAddress')}
                loading={loading} disabled={loading}>
                chia_getAddress
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({})}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_signMessageByAddress', {
                  message: `Test message at ${Date.now()}`,
                  address: sampleAddress
                })}
                loading={loading} disabled={loading}>
                chia_signMessageByAddress
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ message: "Test message at [timestamp]", address: sampleAddress })}
              </div>
            </Grid.Column>

            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_takeOffer', {
                  offer: sampleOffer,
                  fee: "1000000"
                })}
                loading={loading} disabled={loading}>
                chia_takeOffer
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ offer: sampleOffer, fee: "1000000" })}
              </div>
            </Grid.Column>
          </Grid>
        </Accordion.Content>

        {/* Chia Commands - Advanced */}
        <Accordion.Title
          active={activeIndex === 2}
          index={2}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          Chia Commands - Advanced ⚠️
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 2}>
          <Grid columns={2} stackable>
            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_getNfts', {
                  limit: 10,
                  offset: 0,
                  collectionId: null
                })}
                loading={loading} disabled={loading}>
                chia_getNfts
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ limit: 10, offset: 0, collectionId: null })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_send', {
                  address: sampleAddress,
                  amount: "1000000",
                  fee: "1000",
                  memos: ["Test memo"]
                })}
                loading={loading} disabled={loading}>
                chia_send (XCH)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ address: sampleAddress, amount: "1000000", fee: "1000", memos: ["Test memo"] })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_send', {
                  assetId: sampleAssetId,
                  address: sampleAddress,
                  amount: "1000",
                  fee: "1000"
                })}
                loading={loading} disabled={loading}>
                chia_send (CAT)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ assetId: sampleAssetId, address: sampleAddress, amount: "1000", fee: "1000" })}
              </div>
            </Grid.Column>

            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_createOffer', {
                  offerAssets: [{ assetId: "", amount: "1000000" }],
                  requestAssets: [{ assetId: sampleAssetId, amount: "1000" }],
                  fee: "1000"
                })}
                loading={loading} disabled={loading}>
                chia_createOffer (XCH for CAT)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ offerAssets: [{ assetId: "", amount: "1000000" }], requestAssets: [{ assetId: sampleAssetId, amount: "1000" }], fee: "1000" })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_cancelOffer', {
                  id: "sample-offer-id-12345",
                  fee: "1000"
                })}
                loading={loading} disabled={loading}>
                chia_cancelOffer
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ id: "sample-offer-id-12345", fee: "1000" })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chia_bulkMintNfts', {
                  did: sampleDID,
                  nfts: [{
                    address: sampleAddress,
                    royaltyAddress: sampleAddress,
                    royaltyTenThousandths: 300,
                    dataUris: ["https://example.com/nft1.png"],
                    metadataUris: ["https://example.com/metadata1.json"],
                    editionNumber: 1,
                    editionTotal: 100
                  }],
                  fee: "1000000"
                })}
                loading={loading} disabled={loading}>
                chia_bulkMintNfts
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: Complex NFT mint data (see console)
              </div>
            </Grid.Column>
          </Grid>
        </Accordion.Content>

        {/* CHIP-0002 Advanced */}
        <Accordion.Title
          active={activeIndex === 3}
          index={3}
          onClick={handleClick}
        >
          <Icon name='dropdown' />
          CHIP-0002 Advanced Commands ⚠️
        </Accordion.Title>
        <Accordion.Content active={activeIndex === 3}>
          <Grid columns={2} stackable>
            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_signMessage', {
                  message: `Test message at ${Date.now()}`,
                  publicKey: samplePublicKey
                })}
                loading={loading} disabled={loading}>
                chip0002_signMessage
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ message: "Test message at [timestamp]", publicKey: samplePublicKey })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_filterUnlockedCoins', {
                  coinNames: ["sample_coin_name_1", "sample_coin_name_2"]
                })}
                loading={loading} disabled={loading}>
                chip0002_filterUnlockedCoins
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ coinNames: ["sample_coin_name_1", "sample_coin_name_2"] })}
              </div>
            </Grid.Column>

            <Grid.Column>
              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_getAssetCoins', {
                  type: 'nft',
                  assetId: "nft_launcher_id_sample",
                  includedLocked: true,
                  offset: 0,
                  limit: 5
                })}
                loading={loading} disabled={loading}>
                chip0002_getAssetCoins (NFT)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ type: 'nft', assetId: "nft_launcher_id_sample", includedLocked: true, offset: 0, limit: 5 })}
              </div>

              <Button fluid size='mini' style={{ marginBottom: 4 }}
                onClick={() => executeCommand('chip0002_getAssetBalance', {
                  type: 'did',
                  assetId: sampleDID
                })}
                loading={loading} disabled={loading}>
                chip0002_getAssetBalance (DID)
              </Button>
              <div style={{ fontSize: 10, color: 'gray', marginBottom: 8 }}>
                Params: {JSON.stringify({ type: 'did', assetId: sampleDID })}
              </div>
            </Grid.Column>
          </Grid>
        </Accordion.Content>

      </Accordion>

      <Divider />

      <Button
        basic
        size='small'
        onClick={clearResults}
        disabled={results.length === 0}
      >
        Clear Results ({results.length})
      </Button>

      {/* Results Display */}
      {results.length > 0 && (
        <>
          <Divider />
          <Header size='tiny'>Recent Results (Last 5):</Header>
          <div style={{
            maxHeight: 300,
            overflowY: 'auto',
            fontSize: 11,
            fontFamily: 'monospace',
            backgroundColor: '#f8f9fa',
            padding: 12,
            borderRadius: 4,
            border: '1px solid #e9ecef'
          }}>
            {results.slice(-5).map((result) => (
              <div key={result.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #dee2e6' }}>
                <div style={{ color: '#6c757d', fontSize: 10, marginBottom: 4 }}>
                  [{result.timestamp}] <strong>{result.method}</strong>
                </div>
                <div style={{ color: '#495057', fontSize: 10, marginBottom: 4 }}>
                  📤 Params: {JSON.stringify(result.params)}
                </div>
                {result.error ? (
                  <div style={{ color: '#dc3545', marginTop: 4 }}>
                    ❌ {result.error}
                  </div>
                ) : (
                  <div style={{ color: '#28a745', marginTop: 4 }}>
                    ✅ Success: {JSON.stringify(result.result, null, 1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Divider />
      <div style={{ fontSize: 11, color: '#6c757d' }}>
        💡 All commands include realistic sample data. Check browser console for full details.
        <br />
        ✅ = Usually supported | ⚠️ = May not be supported by all wallets
      </div>
    </Segment>
  )
}
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useWalletConnect } from './WalletConnectContext'
import { useGoby } from './GobyContext'
import { ChiaMethod } from '../wc/wallet-connect'

interface ChiaTakeOfferRequest {
  offer: string
  fee?: number | string
}

interface ChiaSignMessageRequest {
  message: string
  address: string
}

interface ChiaSignMessageResponse {
  publicKey: string
  signature: string
}

interface JsonRpcShape {
  chiaTakeOffer: (data: ChiaTakeOfferRequest) => Promise<{ id: string }>
  chiaSignMessage: (data: ChiaSignMessageRequest) => Promise<ChiaSignMessageResponse>
  chiaGetAddress: () => Promise<{ address: string }>
  getCurrentAddress: () => Promise<string | null>
  getConnectedAddress: () => string | null
  isConnected: () => boolean
}

export const JsonRpcContext = createContext<JsonRpcShape>({} as JsonRpcShape)

export function JsonRpcProvider({ children }: PropsWithChildren) {
  const { client, session, chainId, accounts } = useWalletConnect()
  const { isAvailable: gobyAvailable, isConnected: gobyConnected, request: gobyRequest, connect: gobyConnect } = useGoby()

  // Mobile detection - disable Goby functionality on mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  async function request<T>(method: ChiaMethod, params: unknown): Promise<T> {
    // Prefer Goby when available and connected (desktop only)
    if (gobyAvailable && gobyConnected && !isMobile) {
      return await gobyRequest<T>(method, params)
    }

    // Fallback to WalletConnect
    if (!client) throw new Error('WalletConnect is not initialized')
    if (!session) throw new Error('Session is not connected')

    try {
      const result = await client.request<T | { error: unknown }>({
        topic: session.topic,
        chainId,
        request: { method, params },
      })
      if (result && typeof result === 'object' && 'error' in result) {
        throw new Error(JSON.stringify((result as any).error))
      }
      return result as T
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('user rejected') || msg.includes('rejected') || msg.includes('denied')) throw new Error('Request rejected in wallet')
      if (msg.includes('no matching key') || msg.includes('pairing') || msg.includes('history:')) throw new Error('Wallet session not found. Please reconnect.')
      throw e
    }
  }

  async function chiaTakeOffer(data: ChiaTakeOfferRequest) {
    // If Goby is available but not connected, try to connect once transparently (desktop only)
    if (gobyAvailable && !gobyConnected && !isMobile) {
      try { await gobyConnect() } catch {}
    }
    return await request<{ id: string }>(ChiaMethod.TakeOffer, data)
  }

  async function chiaSignMessage(data: ChiaSignMessageRequest): Promise<ChiaSignMessageResponse> {
    const result = await request<ChiaSignMessageResponse>(ChiaMethod.SignMessageByAddress, data)
    return result
  }

  async function chiaGetAddress(): Promise<{ address: string }> {
    const result = await request<{ address: string }>(ChiaMethod.GetAddress, {})
    return result
  }

  async function getCurrentAddress(): Promise<string | null> {
    try {
      const result = await chiaGetAddress()
      return result.address || null
    } catch (error) {
      console.error('Error getting current address:', error)
      return null
    }
  }

  function getConnectedAddress(): string | null {
    if (!session || !accounts || accounts.length === 0) {
      return null
    }
    // Extract address from account string (format: "chia:mainnet:address")
    const account = accounts[0]
    console.log('Raw account data:', account, 'Type:', typeof account)

    // Handle different possible formats
    if (typeof account === 'string') {
      // If it's already a chia address, return it
      if (account.startsWith('xch1')) {
        return account
      }
      // If it's in "chia:mainnet:address" format, extract the address
      const parts = account.split(':')
      if (parts.length >= 3) {
        return parts[2]
      }
    }

    // If account is an object, it might have an address property
    if (typeof account === 'object' && account !== null) {
      if ('address' in account) {
        return (account as any).address
      }
      if ('account' in account) {
        return (account as any).account
      }
    }

    console.warn('Unable to extract address from account:', account)
    return null
  }

  function isConnected(): boolean {
    return !!(client && session && accounts && accounts.length > 0)
  }

  return (
    <JsonRpcContext.Provider value={{
      chiaTakeOffer,
      chiaSignMessage,
      chiaGetAddress,
      getCurrentAddress,
      getConnectedAddress,
      isConnected
    }}>
      {children}
    </JsonRpcContext.Provider>
  )
}

export function useJsonRpc() {
  const ctx = useContext(JsonRpcContext)
  if (!ctx) throw new Error('useJsonRpc must be used within JsonRpcProvider')
  return ctx
}


import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Minimal Goby wallet typings per official docs: window.chia
// https://docs.goby.app/methods
declare global {
  interface Window {
    chia?: unknown & {
      request?: (args: { method: string; params?: unknown }) => Promise<unknown>
      connect?: () => Promise<unknown>
      disconnect?: () => Promise<unknown>
      takeOffer?: (args: { offer: string }) => Promise<unknown>
    }
  }
}

interface GobyContextValue {
  isAvailable: boolean
  isConnected: boolean
  accounts: string[]
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  request: <T = unknown>(method: string, params?: unknown) => Promise<T>
}

const GobyContext = createContext<GobyContextValue>({} as unknown as GobyContextValue)

export function GobyProvider({ children }: PropsWithChildren) {
  const [available, setAvailable] = useState(false)
  const [connected, setConnected] = useState(false)
  const [accounts, setAccounts] = useState<string[]>([])

  // Detect extension
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setAvailable(!!window.chia)
    check()
    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [])

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.chia) throw new Error('Goby is not available')
    const provider = window.chia as {
      request?: (args: { method: string; params?: unknown }) => Promise<unknown>
      connect?: () => Promise<unknown>
    }

    const normaliseAccounts = (input: unknown): string[] => {
      if (!input) return []
      const src = Array.isArray(input)
        ? input
        : (input as { accounts?: unknown[]; addresses?: unknown[]; wallets?: unknown[] } | undefined)?.accounts ||
          (input as { accounts?: unknown[]; addresses?: unknown[]; wallets?: unknown[] } | undefined)?.addresses ||
          (input as { accounts?: unknown[]; addresses?: unknown[]; wallets?: unknown[] } | undefined)?.wallets ||
          []
      const out: string[] = []
      for (const a of src as Array<unknown>) {
        if (typeof a === 'string') out.push(a)
        else if (a && typeof a === 'object')
          out.push(
            (a as { address?: string; account?: string; addr?: string }).address ||
              (a as { address?: string; account?: string; addr?: string }).account ||
              (a as { address?: string; account?: string; addr?: string }).addr ||
              '',
          )
      }
      return out.filter(Boolean)
    }

    // 1) Direct connect()
    try {
      if (typeof provider.connect === 'function') {
        const res = await provider.connect()
        let accs = normaliseAccounts(res)
        if (!accs.length && typeof provider.request === 'function') {
          try {
            accs = normaliseAccounts(await provider.request({ method: 'chia_getWalletAddresses' }))
          } catch {}
        }
        if (accs.length) {
          setAccounts(accs)
          setConnected(true)
          return
        }
      }
    } catch {}

    // 2) request({ method: 'requestAccounts' })
    try {
      if (typeof provider.request === 'function') {
        const res = await provider.request({ method: 'requestAccounts' })
        let accs = normaliseAccounts(res)
        if (!accs.length) {
          try {
            accs = normaliseAccounts(await provider.request({ method: 'chia_getWalletAddresses' }))
          } catch {}
        }
        if (accs.length) {
          setAccounts(accs)
          setConnected(true)
          return
        }
      }
    } catch {}

    // 3) request({ method: 'chia_logIn' })
    try {
      if (typeof provider.request === 'function') {
        const res = await provider.request({ method: 'chia_logIn', params: {} })
        let accs = normaliseAccounts(res)
        if (!accs.length) {
          try {
            accs = normaliseAccounts(await provider.request({ method: 'chia_getWalletAddresses' }))
          } catch {}
        }
        if (accs.length) {
          setAccounts(accs)
          setConnected(true)
          return
        }
      }
    } catch {}

    // 4) As a last attempt, try get addresses only
    try {
      if (typeof provider.request === 'function') {
        const accs = normaliseAccounts(await provider.request({ method: 'chia_getWalletAddresses' }))
        if (accs.length) {
          setAccounts(accs)
          setConnected(true)
          return
        }
      }
    } catch {}

    throw new Error('Unable to connect to Goby')
  }, [])

  const disconnect = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.chia && typeof window.chia.disconnect === 'function') {
        await window.chia.disconnect()
      }
    } catch {}
    setConnected(false)
    setAccounts([])
  }, [])

  const request = useCallback(
    async <T,>(method: string, params?: unknown): Promise<T> => {
      if (!available || !window.chia) throw new Error('Goby is not available')
      const provider = window.chia as {
        request?: (args: { method: string; params?: unknown }) => Promise<unknown>
        takeOffer?: (args: { offer: string }) => Promise<unknown>
        [k: string]: unknown
      }

      const isTakeOffer = (m: string) => /takeoffer|acceptoffer|chia_takeoffer/i.test(m)
      const extractOffer = (p: unknown): string | null => {
        if (!p) return null
        if (typeof p === 'string' && p.startsWith('offer')) return p
        if (
          typeof (p as { offer?: string })?.offer === 'string' &&
          (p as { offer?: string }).offer!.startsWith('offer')
        )
          return (p as { offer?: string }).offer as string
        if (
          Array.isArray(p) &&
          typeof (p as Array<unknown>)[0] === 'string' &&
          (p as Array<string>)[0].startsWith('offer')
        )
          return (p as Array<string>)[0]
        return null
      }

      if (isTakeOffer(method)) {
        const offer = extractOffer(params)
        if (!offer) throw new Error('Goby: missing offer string for takeOffer')

        // Official mapping per docs: window.chia.request({ method: 'takeOffer', params: { offer } })
        if (typeof provider.request === 'function') {
          const res = await provider.request({ method: 'takeOffer', params: { offer } })
          const id = res?.id || res?.txId || res?.txid || res?.hash || (typeof res === 'string' ? res : 'goby')
          return { id } as unknown as T
        }
        if (typeof provider.takeOffer === 'function') {
          const res = await provider.takeOffer({ offer })
          const id = res?.id || res?.txId || res?.txid || res?.hash || (typeof res === 'string' ? res : 'goby')
          return { id } as unknown as T
        }
        throw new Error('Goby takeOffer not supported by this version')
      }

      // Default path
      if (typeof provider.request === 'function') {
        return await provider.request({ method, params })
      }
      if (typeof provider[method] === 'function') {
        return await provider[method](params)
      }
      throw new Error('Goby does not support request API')
    },
    [available],
  )

  const value = useMemo(
    () => ({
      isAvailable: available,
      isConnected: connected,
      accounts,
      connect,
      disconnect,
      request,
    }),
    [available, connected, accounts, connect, disconnect, request],
  )

  return <GobyContext.Provider value={value}>{children}</GobyContext.Provider>
}

export function useGoby() {
  const ctx = useContext(GobyContext)
  if (!ctx) throw new Error('useGoby must be used within GobyProvider')
  return ctx
}

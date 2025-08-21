/**
 * WalletConnect signing utilities for Link-in-Bio Hub
 * These functions should be used within components that have access to JsonRpcContext
 */

import { createSigningMessage } from './signature-verification'

/**
 * Sign a message using WalletConnect via JsonRpcContext
 * This function should be called from within a component that has access to useJsonRpc
 */
export async function signMessageWithWalletConnect(
  chiaSignMessage: (data: { message: string; address: string }) => Promise<{ signature: string; message: string; address: string }>,
  message: string,
  address: string
): Promise<{ signature: string; success: boolean; error?: string }> {
  try {
    const result = await chiaSignMessage({ message, address })

    if (result && result.signature) {
      return { signature: result.signature, success: true }
    } else {
      return { signature: '', success: false, error: 'Failed to get signature' }
    }
  } catch (error: any) {
    console.error('WalletConnect signing error:', error)

    // Handle common error messages
    const errorMessage = error.message || 'Signing failed'
    if (errorMessage.includes('rejected')) {
      return { signature: '', success: false, error: 'Signature request was rejected' }
    }
    if (errorMessage.includes('not connected')) {
      return { signature: '', success: false, error: 'Wallet not connected' }
    }

    return {
      signature: '',
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Sign a link creation request
 */
export async function signLinkCreation(
  chiaSignMessage: (data: { message: string; address: string }) => Promise<{ signature: string; message: string; address: string }>,
  username: string,
  address: string
): Promise<{ message: string; signature: string; timestamp: number; success: boolean; error?: string }> {
  const { message, timestamp } = createSigningMessage('Create link', username)

  const result = await signMessageWithWalletConnect(chiaSignMessage, message, address)

  return {
    message,
    timestamp,
    signature: result.signature,
    success: result.success,
    error: result.error
  }
}

/**
 * Sign a link update request
 */
export async function signLinkUpdate(
  chiaSignMessage: (data: { message: string; address: string }) => Promise<{ signature: string; message: string; address: string }>,
  username: string,
  linkId: string,
  address: string
): Promise<{ message: string; signature: string; timestamp: number; success: boolean; error?: string }> {
  const { message, timestamp } = createSigningMessage('Update link', username, linkId)

  const result = await signMessageWithWalletConnect(chiaSignMessage, message, address)

  return {
    message,
    timestamp,
    signature: result.signature,
    success: result.success,
    error: result.error
  }
}

/**
 * Sign a link deletion request
 */
export async function signLinkDeletion(
  chiaSignMessage: (data: { message: string; address: string }) => Promise<{ signature: string; message: string; address: string }>,
  username: string,
  linkId: string,
  address: string
): Promise<{ message: string; signature: string; timestamp: number; success: boolean; error?: string }> {
  const { message, timestamp } = createSigningMessage('Delete link', username, linkId)

  const result = await signMessageWithWalletConnect(chiaSignMessage, message, address)

  return {
    message,
    timestamp,
    signature: result.signature,
    success: result.success,
    error: result.error
  }
}

// Note: The wallet connection functions are now handled by JsonRpcContext
// Components should use useJsonRpc() to access:
// - getConnectedAddress(): string | null
// - isConnected(): boolean
// - chiaSignMessage(data): Promise<ChiaSignMessageResponse>

// These functions are kept for backward compatibility but should be replaced
// with direct usage of JsonRpcContext in components

/**
 * @deprecated Use useJsonRpc().getConnectedAddress() instead
 */
export function getConnectedWalletAddress(): string | null {
  console.warn('getConnectedWalletAddress is deprecated. Use useJsonRpc().getConnectedAddress() instead.')
  return null
}

/**
 * @deprecated Use useJsonRpc().isConnected() instead
 */
export function isWalletConnected(): boolean {
  console.warn('isWalletConnected is deprecated. Use useJsonRpc().isConnected() instead.')
  return false
}

/**
 * @deprecated Use WalletConnect context directly instead
 */
export async function ensureWalletConnected(): Promise<{ connected: boolean; address?: string; error?: string }> {
  console.warn('ensureWalletConnected is deprecated. Use WalletConnect context directly instead.')
  return { connected: false, error: 'Function deprecated' }
}

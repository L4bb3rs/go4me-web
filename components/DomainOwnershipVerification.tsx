/**
 * Domain ownership verification component
 * Allows users to verify they own a domain by signing a message with their wallet
 */

import React, { useState, useEffect } from 'react'
import { Button, Message, Modal, Header, Segment, Icon } from 'semantic-ui-react'
import { useJsonRpc } from '../lib/wallet/JsonRpcContext'
import {
  generateVerificationChallenge,
  verifyDomainOwnership,
  unverifyDomainOwnership
} from '../lib/domain-ownership-verification'

interface DomainOwnershipVerificationProps {
  domain: string
  expectedAddress: string
  onVerificationComplete?: (verified: boolean, address?: string) => void
}

export function DomainOwnershipVerification({
  domain,
  expectedAddress,
  onVerificationComplete
}: DomainOwnershipVerificationProps) {
  const { chiaSignMessage, isConnected } = useJsonRpc()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    message: string
    address?: string
  } | null>(null)

  const handleVerifyOwnership = async () => {
    if (!isConnected()) {
      setVerificationResult({
        success: false,
        message: 'Please connect your wallet first'
      })
      return
    }

    // If already verified, handle unverification
    if (isVerified) {
      const confirmed = window.confirm(
        `Are you sure you want to remove verification for domain "${domain}"?\n\nThis will remove the cryptographic proof that you own this domain.`
      )

      if (!confirmed) {
        return
      }

      setIsVerifying(true)
      setVerificationResult(null)

      try {
        console.log('🗑️ Removing domain verification for:', domain)

        const unverifyResult = await unverifyDomainOwnership(domain)
        console.log('📋 Unverify result:', unverifyResult)

        if (unverifyResult.success) {
          console.log('✅ Domain verification removed successfully')
          setIsVerified(false)

          // Remove from localStorage
          const localKey = `domain-verified-${domain}`
          localStorage.removeItem(localKey)
          console.log('💾 Removed verification from localStorage')

          setVerificationResult({
            success: true,
            message: `✅ Domain verification removed successfully. You can verify ownership again at any time.`
          })

          onVerificationComplete?.(false, expectedAddress)
        } else {
          setVerificationResult({
            success: false,
            message: `❌ Failed to remove verification: ${unverifyResult.error}`
          })
        }
      } catch (error: any) {
        console.error('Unverification error:', error)
        setVerificationResult({
          success: false,
          message: `❌ Error removing verification: ${error.message}`
        })
      } finally {
        setIsVerifying(false)
      }
      return
    }

    // Original verification logic
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Generate verification challenge
      const challenge = generateVerificationChallenge(domain)

      console.log('🔍 Starting domain ownership verification:', {
        domain,
        expectedAddress,
        message: challenge.message
      })

      // Sign the message with the expected address (the one shown on the domain page)
      const signResult = await chiaSignMessage({
        message: challenge.message,
        address: expectedAddress
      })

      console.log('✅ Message signed:', {
        publicKey: signResult.publicKey.substring(0, 16) + '...',
        signature: signResult.signature.substring(0, 16) + '...'
      })

      // Verify the signature and address
      const verificationResult = await verifyDomainOwnership(
        domain,
        expectedAddress,
        challenge.message,
        signResult.signature,
        signResult.publicKey,
        challenge.timestamp,
        expectedAddress, // The address that was used to sign
        challenge.nonce
      )

      if (verificationResult.valid) {
        console.log('🎉 Verification successful! Setting verified state to true')
        setIsVerified(true)

        // Save to localStorage for immediate persistence
        const localKey = `domain-verified-${domain}`
        localStorage.setItem(localKey, 'true')
        console.log('💾 Saved verification to localStorage')

        setVerificationResult({
          success: true,
          message: `✅ Domain ownership verified! Your wallet address ${expectedAddress} matches the domain's registered address.`,
          address: expectedAddress
        })

        onVerificationComplete?.(true, expectedAddress)
      } else {
        setVerificationResult({
          success: false,
          message: `❌ Verification failed: ${verificationResult.error}`
        })

        onVerificationComplete?.(false)
      }

    } catch (error: any) {
      console.error('Domain ownership verification error:', error)
      
      let errorMessage = 'Verification failed'
      if (error.message?.includes('rejected')) {
        errorMessage = 'Signature request was rejected in wallet'
      } else if (error.message?.includes('session')) {
        errorMessage = 'Wallet session expired. Please reconnect.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setVerificationResult({
        success: false,
        message: `❌ ${errorMessage}`
      })

      onVerificationComplete?.(false)
    } finally {
      setIsVerifying(false)
    }
  }

  // Check if domain is already verified when component mounts
  useEffect(() => {
    async function checkInitialStatus() {
      try {
        // First check localStorage for immediate feedback
        const localKey = `domain-verified-${domain}`
        const localVerified = localStorage.getItem(localKey)
        if (localVerified === 'true') {
          console.log('💾 Found verification in localStorage, setting verified state')
          setIsVerified(true)
        }

        console.log('🔍 Checking verification status for domain:', domain)
        const response = await fetch(`/api/domain-verification?domain=${encodeURIComponent(domain)}`)
        console.log('📡 API response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('📊 API response data:', data)
          if (data.verified) {
            console.log('✅ Domain is already verified, updating button state')
            setIsVerified(true)
            localStorage.setItem(localKey, 'true')
          } else {
            console.log('❌ Domain not verified yet')
            setIsVerified(false)
            localStorage.removeItem(localKey)
          }
        } else {
          console.log('⚠️ API response not ok:', response.status, response.statusText)
          // Keep localStorage state if API fails
        }
      } catch (error) {
        console.error('❌ Error checking verification status:', error)
        // Keep localStorage state if API fails
      }
    }

    if (domain) {
      checkInitialStatus()
    }
  }, [domain])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setVerificationResult(null)
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={!isConnected()}
        title={
          isVerified
            ? 'Domain ownership verified - click to remove verification'
            : isConnected()
              ? 'Verify you own this domain'
              : 'Connect wallet to verify ownership'
        }
        className={`ui mini button ${isVerified ? 'positive domain-verified-button' : 'basic domain-verify-button'}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          padding: '6px 12px'
        }}
      >
        <Icon name={isVerified ? "check circle" : "shield"} />
        {isVerified ? "Verified" : "Verify Ownership"}
      </button>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        size="small"
        closeIcon
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-text)'
        }}
      >
        <Header
          icon={isVerified ? "check circle" : "shield"}
          content={isVerified ? "Domain Ownership Verified" : "Verify Domain Ownership"}
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            borderBottom: '1px solid var(--color-border)'
          }}
        />

        <Modal.Content style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
          <Segment
            basic
            style={{
              background: 'transparent',
              color: 'var(--color-text)'
            }}
          >
            <div style={{ marginBottom: 16 }}>
              {isVerified ? (
                <div>
                  <p style={{ color: 'var(--color-text)', marginBottom: 12 }}>
                    ✅ Domain <strong style={{ color: 'var(--color-text)' }}>
                      {domain.replace(/[<>&"']/g, '')}
                    </strong> is currently verified as owned by:
                  </p>
                  <div style={{
                    background: 'var(--color-bg-alt)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-success)',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--color-text)',
                    wordBreak: 'break-all'
                  }}>
                    {expectedAddress.replace(/[<>&"']/g, '')}
                  </div>
                  <p style={{ color: 'var(--color-text)', marginTop: 12, fontSize: '14px' }}>
                    Click "Remove Verification" below to unverify this domain. You can verify it again at any time.
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--color-text)', marginBottom: 12 }}>
                    To verify you own the domain <strong style={{ color: 'var(--color-text)' }}>
                      {domain.replace(/[<>&"']/g, '')}
                    </strong>,
                    you'll need to sign a message with the wallet that controls this address:
                  </p>
                  <div style={{
                    background: 'var(--color-bg-alt)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--color-border)',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--color-text)',
                    wordBreak: 'break-all'
                  }}>
                    {expectedAddress.replace(/[<>&"']/g, '')}
                  </div>
                </div>
              )}
            </div>

            <Message
              info
              style={{
                background: 'var(--color-bg-alt)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <Icon name="info circle" style={{ color: 'var(--color-link)' }} />
              <Message.Content style={{ color: 'var(--color-text)' }}>
                <Message.Header style={{ color: 'var(--color-text)', marginBottom: 8 }}>
                  How verification works:
                </Message.Header>
                <ol style={{ marginTop: 8, paddingLeft: 20, color: 'var(--color-text-subtle)' }}>
                  <li>We create a unique message with the domain name and timestamp</li>
                  <li>Your wallet signs this message using your private key</li>
                  <li>We verify the signature matches your wallet's public key</li>
                  <li>If valid, domain ownership is cryptographically proven! ✅</li>
                </ol>
              </Message.Content>
            </Message>

            {!isConnected() && (
              <Message
                warning
                style={{
                  background: 'var(--color-bg-alt)',
                  border: '1px solid #fbbd23',
                  color: 'var(--color-text)'
                }}
              >
                <Icon name="warning" style={{ color: '#fbbd23' }} />
                <span style={{ color: 'var(--color-text)' }}>
                  Please connect your wallet first to verify domain ownership.
                </span>
              </Message>
            )}

            {verificationResult && (
              <Message
                success={verificationResult.success}
                error={!verificationResult.success}
                style={{
                  background: verificationResult.success
                    ? 'rgba(33, 186, 69, 0.1)'
                    : 'rgba(219, 40, 40, 0.1)',
                  border: `1px solid ${verificationResult.success ? 'var(--color-success)' : '#db2828'}`,
                  color: 'var(--color-text)'
                }}
              >
                <p style={{ color: 'var(--color-text)', margin: 0 }}>
                  {verificationResult.message}
                </p>
              </Message>
            )}
          </Segment>
        </Modal.Content>

        <Modal.Actions style={{
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)'
        }}>
          <Button
            onClick={handleCloseModal}
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)'
            }}
          >
            Cancel
          </Button>

          <Button
            primary={!isVerified}
            negative={isVerified}
            onClick={handleVerifyOwnership}
            disabled={!isConnected() || isVerifying}
            loading={isVerifying}
          >
            <Icon name={isVerified ? "trash" : "shield"} />
            {isVerifying
              ? (isVerified ? 'Removing...' : 'Verifying...')
              : (isVerified ? 'Remove Verification' : 'Verify Ownership')
            }
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  )
}

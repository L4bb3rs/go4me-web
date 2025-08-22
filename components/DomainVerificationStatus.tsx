/**
 * Domain verification status indicator
 * Shows whether a domain has been verified and when
 */

import React, { useState, useEffect } from 'react'
import { Icon, Label } from 'semantic-ui-react'

interface DomainVerificationStatusProps {
  domain: string
  expectedAddress: string
}

interface VerificationStatus {
  domain: string
  address: string
  verified: boolean
  verifiedAt?: number
}

export function DomainVerificationStatus({ domain, expectedAddress }: DomainVerificationStatusProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkVerificationStatus() {
      try {
        const response = await fetch(`/api/domain-verification?domain=${encodeURIComponent(domain)}`)
        
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
        } else if (response.status === 404) {
          // Domain not verified yet
          setStatus({
            domain,
            address: expectedAddress,
            verified: false
          })
        } else {
          console.warn('Failed to check verification status:', response.status)
          setStatus(null)
        }
      } catch (error) {
        console.error('Error checking verification status:', error)
        setStatus(null)
      } finally {
        setLoading(false)
      }
    }

    if (domain && expectedAddress) {
      checkVerificationStatus()
    }
  }, [domain, expectedAddress])

  if (loading) {
    return (
      <Label size="mini" basic>
        <Icon name="spinner" loading />
        Checking verification...
      </Label>
    )
  }

  if (!status) {
    return null
  }

  if (status.verified && status.verifiedAt) {
    const verifiedDate = new Date(status.verifiedAt)
    const timeAgo = getTimeAgo(status.verifiedAt)
    
    return (
      <Label size="mini" color="green">
        <Icon name="check circle" />
        Verified {timeAgo}
      </Label>
    )
  }

  return (
    <Label size="mini" basic color="grey">
      <Icon name="shield" />
      Not verified
    </Label>
  )
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return 'just now'
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  } else if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'} ago`
  } else {
    return 'over a month ago'
  }
}

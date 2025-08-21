/**
 * Types for Link-in-Bio Hub system
 */

export interface UserLink {
  id: string
  username: string
  title: string
  url: string
  description?: string
  icon?: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateLinkRequest {
  title: string
  url: string
  description?: string
  icon?: string
  order?: number
  signature: string
  message: string
  address: string
}

export interface UpdateLinkRequest extends CreateLinkRequest {
  id: string
}

export interface DeleteLinkRequest {
  id: string
  signature: string
  message: string
  address: string
}

export interface LinkHubSettings {
  username: string
  title?: string
  description?: string
  theme: 'default' | 'minimal' | 'gradient' | 'dark'
  show_badge: boolean
  custom_css?: string
  created_at: string
  updated_at: string
}

export interface SignatureVerificationData {
  message: string
  signature: string
  address: string
  action: 'create' | 'update' | 'delete' | 'settings'
  timestamp: number
}

// Predefined link icons
export const LINK_ICONS = {
  website: '🌐',
  twitter: '🐦',
  instagram: '📷',
  youtube: '📺',
  github: '💻',
  linkedin: '💼',
  discord: '💬',
  telegram: '📱',
  email: '📧',
  shop: '🛒',
  blog: '📝',
  portfolio: '🎨',
  music: '🎵',
  podcast: '🎙️',
  book: '📚',
  game: '🎮',
  nft: '🖼️',
  crypto: '₿',
  custom: '🔗'
} as const

export type LinkIconType = keyof typeof LINK_ICONS

// Message templates for signature verification
export const MESSAGE_TEMPLATES = {
  CREATE_LINK: (username: string, timestamp: number) =>
    `Create link for ${username} at ${timestamp}`,
  UPDATE_LINK: (username: string, linkId: string, timestamp: number) =>
    `Update link ${linkId} for ${username} at ${timestamp}`,
  DELETE_LINK: (username: string, linkId: string, timestamp: number) =>
    `Delete link ${linkId} for ${username} at ${timestamp}`,
  UPDATE_SETTINGS: (username: string, timestamp: number) =>
    `Update settings for ${username} at ${timestamp}`
}

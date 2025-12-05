export function getModalUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_MODAL_API_URL || process.env.MODAL_API_URL
}

export function getApiBase(): string {
  // Prefer local API base or explicit NEXT_PUBLIC_API_BASE_URL; ignore Modal for base selection
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (base && base.length > 0) return base.replace(/\/$/, '')
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3003/api' : ''
}

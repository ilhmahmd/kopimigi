// ─── Currency ────────────────────────────────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}k`
  return `Rp ${amount}`
}

// ─── Order number ────────────────────────────────────────────────────────────
export function generateOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
  return `CS-${date}-${seq}`
}

// ─── Discount calculator ─────────────────────────────────────────────────────
export function calculateDiscount(
  subtotal: number,
  type: 'percentage' | 'fixed',
  value: number
): number {
  if (type === 'percentage') return Math.round(subtotal * (value / 100))
  return Math.min(value, subtotal)
}

// ─── QR token ────────────────────────────────────────────────────────────────
export function generatePhotoToken(): string {
  return crypto.randomUUID()
}

export function buildTokenUrl(boothBaseUrl: string, token: string): string {
  return `${boothBaseUrl}/session/${token}`
}

// ─── Date helpers ────────────────────────────────────────────────────────────
export function sessionExpiresAt(minutesFromNow = 30): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + minutesFromNow)
  return d.toISOString()
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

// ─── Tax ─────────────────────────────────────────────────────────────────────
export const TAX_RATE = 0 // set to 0.11 to enable 11% PPN

export function calculateTax(amount: number): number {
  return Math.round(amount * TAX_RATE)
}

export default function Icon({ category }) {
  switch (category) {
    case 'perfumes':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" strokeWidth="2">
          <rect x="38" y="10" width="24" height="12" rx="2" />
          <rect x="33" y="22" width="34" height="10" rx="2" />
          <path d="M32 32 h36 l4 8 v46 a4 4 0 0 1 -4 4 h-36 a4 4 0 0 1 -4 -4 v-46 z" />
          <line x1="30" y1="55" x2="70" y2="55" />
        </svg>
      )
    case 'attars':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" strokeWidth="2">
          <path d="M44 12 h12 v10 h-12 z" />
          <path d="M40 22 h20 l6 14 c4 8 6 14 6 24 a22 22 0 0 1 -44 0 c0 -10 2 -16 6 -24 z" />
          <circle cx="50" cy="66" r="8" />
        </svg>
      )
    case 'soaps':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" strokeWidth="2">
          <rect x="18" y="34" width="64" height="40" rx="14" />
          <path d="M30 34 c0 -10 8 -16 20 -16 s20 6 20 16" />
          <line x1="34" y1="54" x2="66" y2="54" />
        </svg>
      )
    case 'candles':
      return (
        <svg viewBox="0 0 100 100" fill="none" stroke="#d4af37" strokeWidth="2">
          <path d="M50 18 c6 8 6 12 0 18 c-6 -6 -6 -10 0 -18 z" fill="#d4af37" stroke="none" />
          <rect x="34" y="38" width="32" height="46" rx="2" />
          <line x1="34" y1="50" x2="66" y2="50" />
        </svg>
      )
    default:
      return null
  }
}

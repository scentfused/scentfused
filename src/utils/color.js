function clamp(n) {
  return Math.max(0, Math.min(255, n))
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => clamp(Math.round(n)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// amount: -1 (much darker) to 1 (much lighter)
export function shade(hex, amount) {
  try {
    const { r, g, b } = hexToRgb(hex)
    const mix = amount > 0
      ? { r: r + (255 - r) * amount, g: g + (255 - g) * amount, b: b + (255 - b) * amount }
      : { r: r * (1 + amount), g: g * (1 + amount), b: b * (1 + amount) }
    return rgbToHex(mix)
  } catch {
    return hex
  }
}

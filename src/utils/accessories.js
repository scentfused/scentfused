// The Scented Accessories page groups soaps and candles into three sections.
// Soaps are split by the "Type" field on the product (Soap or Bodywash); a soap
// with no type counts as a Soap.
export const SOAP_TYPES = ['Bodywash', 'Soap']

export const isBodywash = (p) =>
  p.category === 'soaps' && String(p.attributes?.soapType || '').trim().toLowerCase() === 'bodywash'

export const ACCESSORY_SECTIONS = [
  { key: 'candles', title: 'Scented Candles', match: (p) => p.category === 'candles' },
  { key: 'soaps', title: 'Scented Soaps', match: (p) => p.category === 'soaps' && !isBodywash(p) },
  { key: 'bodywash', title: 'Scented Bodywash', match: (p) => isBodywash(p) }
]

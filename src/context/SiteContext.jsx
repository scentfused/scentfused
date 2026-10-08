import { createContext, useContext } from 'react'

// Site-wide data the menu needs but that doesn't belong to one page:
// the collections (line-ups) that have products, A–Z.
export const SiteContext = createContext({ collections: [], lowStockThreshold: 5 })
export const useSite = () => useContext(SiteContext)

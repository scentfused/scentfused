import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

const LOGO_URL = 'https://res.cloudinary.com/nqotqftf/image/upload/v1789151310/gold_icon_512px.ico'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { cartCount, setIsCartOpen } = useCart()
  const navigate = useNavigate()

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/perfumes', label: 'Perfumes' },
    { to: '/attars', label: 'Attars' },
    { to: '/soaps', label: 'Soaps & Bodywash' },
    { to: '/candles', label: 'Candles' }
  ]

  function closeMenu() {
    setOpen(false)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand-lockup" onClick={closeMenu}>
          <img src={LOGO_URL} alt="Scentfused logo" className="brand-logo" />
          <span className="brand">scentfused</span>
        </Link>

        <div className="nav-icon-group">
          <button
            className="search-toggle"
            aria-label="Toggle search"
            aria-expanded={searchOpen}
            onClick={() => { setSearchOpen((s) => !s); setOpen(false) }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => { setOpen((o) => !o); setSearchOpen(false) }}
          >
            ☰
          </button>
        </div>
      </div>

      {searchOpen && (
        <form className="nav-search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products…"
            autoFocus
          />
          <button type="submit">Search</button>
        </form>
      )}

      <div className={`nav-drawer ${open ? 'open' : ''}`}>
        <ul className="nav-drawer-links">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMenu}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-drawer-actions">
          <button
            className="cart-btn"
            aria-label={`Cart, ${cartCount} items`}
            onClick={() => { setIsCartOpen(true); closeMenu() }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="9" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>
            <span>Cart ({cartCount})</span>
          </button>

          <Link className="admin-btn" to="/admin" onClick={closeMenu}>Admin</Link>
        </div>
      </div>

      {open && <div className="nav-drawer-backdrop" onClick={closeMenu}></div>}
    </header>
  )
}

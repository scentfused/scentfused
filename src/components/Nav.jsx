import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { cartCount, setIsCartOpen } = useCart()

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/perfumes', label: 'Perfumes' },
    { to: '/attars', label: 'Attars' },
    { to: '/soaps', label: 'Soaps & Bodywash' },
    { to: '/candles', label: 'Candles' }
  ]

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">scentfused</Link>

        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <button className="cart-btn" aria-label={`Cart, ${cartCount} items`} onClick={() => setIsCartOpen(true)}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="9" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>
            <span>{cartCount}</span>
          </button>


          {/* Admin panel entry point — top right corner as requested */}
          <Link className="admin-btn" to="/admin">Admin</Link>

          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  )
}

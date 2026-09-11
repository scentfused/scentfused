import { useState } from 'react'

const WHATSAPP_NUMBER = '923022726002' // no + or spaces, just digits with country code
const DEFAULT_MESSAGE = "Hi! I'd like to ask about a product on Scentfused."

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false)

  const chatHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`

  return (
    <div className="wa-widget">
      {open && (
        <div className="wa-popup">
          <div className="wa-popup-head">
            <div className="wa-popup-avatar">
              <svg viewBox="0 0 32 32" width="22" height="22" fill="#fff">
                <path d="M16 3C9.1 3 3.5 8.6 3.5 15.5c0 2.4.7 4.7 1.9 6.7L3 29l7-1.8c1.9 1 4 1.6 6 1.6 6.9 0 12.5-5.6 12.5-12.5S22.9 3 16 3zm0 22.7c-1.8 0-3.6-.5-5.2-1.4l-.4-.2-4.2 1.1 1.1-4-.2-.4c-1-1.6-1.5-3.5-1.5-5.4C5.6 9.8 10.3 5.1 16 5.1s10.4 4.7 10.4 10.4S21.7 25.7 16 25.7zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/>
              </svg>
            </div>
            <div>
              <p className="wa-popup-name">Scentfused</p>
              <p className="wa-popup-status"><span className="wa-dot"></span>Typically replies within an hour</p>
            </div>
            <button className="wa-popup-close" onClick={() => setOpen(false)} aria-label="Close">&times;</button>
          </div>

          <div className="wa-popup-body">
            <div className="wa-popup-bubble">
              Hi there! 👋 Got a question about a fragrance, an order, or anything else? Tap below to chat with us directly.
            </div>
          </div>

          <a
            href={chatHref}
            target="_blank"
            rel="noopener noreferrer"
            className="wa-popup-start"
            onClick={() => setOpen(false)}
          >
            Start Chat
          </a>
        </div>
      )}

      <button
        className="whatsapp-float"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close WhatsApp chat' : 'Chat with us on WhatsApp'}
      >
        {open ? (
          <span className="wa-float-close">&times;</span>
        ) : (
          <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
            <path d="M16 3C9.1 3 3.5 8.6 3.5 15.5c0 2.4.7 4.7 1.9 6.7L3 29l7-1.8c1.9 1 4 1.6 6 1.6 6.9 0 12.5-5.6 12.5-12.5S22.9 3 16 3zm0 22.7c-1.8 0-3.6-.5-5.2-1.4l-.4-.2-4.2 1.1 1.1-4-.2-.4c-1-1.6-1.5-3.5-1.5-5.4C5.6 9.8 10.3 5.1 16 5.1s10.4 4.7 10.4 10.4S21.7 25.7 16 25.7zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/>
          </svg>
        )}
      </button>
    </div>
  )
}

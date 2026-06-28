import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/globals.css'
import App from './App.jsx'

// Configure API URL from environment
if (!window.API_URL) {
  window.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

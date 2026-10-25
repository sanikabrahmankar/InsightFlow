import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css' // <-- This line must be here

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
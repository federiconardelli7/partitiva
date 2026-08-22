import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root mancante in index.html')

// Chiede al browser di NON sfrattare IndexedDB sotto pressione di storage: è l'unica copia dei dati.
void navigator.storage?.persist?.()

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

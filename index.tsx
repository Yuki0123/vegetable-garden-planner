// /index.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './src/App'
import './index.css'

const root = document.getElementById('root')!
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#082035',
            color: '#e8f4ff',
            border: '1px solid rgba(42,143,212,0.25)',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#4ade80', secondary: '#082035' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#082035' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)

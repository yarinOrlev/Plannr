import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ProductProvider } from './context/ProductContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { BrowserRouter as Router } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProductProvider>
        <Router>
          <App />
        </Router>
      </ProductProvider>
    </AuthProvider>
  </StrictMode>,
)

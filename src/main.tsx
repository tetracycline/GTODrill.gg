import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { OpponentTypeProvider } from './contexts/OpponentTypeContext'
import { LanguageProvider } from './i18n/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <OpponentTypeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </OpponentTypeProvider>
    </LanguageProvider>
  </StrictMode>,
)

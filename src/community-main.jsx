import "./sentry.js";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CommunityPage from './CommunityPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CommunityPage />
  </StrictMode>,
)

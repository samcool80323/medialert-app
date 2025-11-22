import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { ScannerPage } from './pages/ScannerPage'
import { AdCreatorPage } from './pages/AdCreatorPage'
import { ScanResultsPage } from './pages/ScanResultsPage'
import { AboutPage } from './pages/AboutPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/ad-creator" element={<AdCreatorPage />} />
          <Route path="/scan/:scanId" element={<ScanResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  )
}

export default App
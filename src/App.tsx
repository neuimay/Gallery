import { useState, useEffect } from 'react'
import './styles/App.css'
import SideBar from './components/SideBar'
import Gallery from './components/Gallery'
import MapPage from './pages/MapPage'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <BrowserRouter>
    <Routes>
      {/* Gallery 页面（带 Sidebar） */}
      <Route
        path="/"
        element={
          <div className="app bg-root text-primary">
            <SideBar theme={theme} toggleTheme={toggleTheme} />
            <main className="content flex-1 overflow-y-auto pb-16 md:pb-0">
              <Gallery />
            </main>
          </div>
        }
      />

      {/* 全屏 Map 页面（无 Sidebar） */}
      <Route
        path="/map"
        element={
          <MapPage theme={theme} />
        }
      />
    </Routes>
  </BrowserRouter>
  )
}

export default App

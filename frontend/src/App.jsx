import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Inventory from './components/Inventory'
import Requests from './components/Requests'
import MyRequests from './components/MyRequests'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/incoming-requests" element={<Requests />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
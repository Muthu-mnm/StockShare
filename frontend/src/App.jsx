import {BrowserRouter, Routes, Route} from 'react-router-dom'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Inventory from './components/Inventory'
import Requests from './components/Requests'
import MyRequests from './components/MyRequests'
import './App.css'

function Dashboard() {
  return (
    <>
      <Hero />
      <Features />
    </>
  )
}


function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/my-requests" element={<MyRequests/>} />
        <Route path="/incoming-requests" element={<Requests/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
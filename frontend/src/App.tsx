import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from '@/pages/Landing'
import About from '@/pages/About'
import Practice from '@/pages/Practice'
import Call from '@/pages/Call'
import Assessment from '@/pages/Assessment'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/call/:sessionId" element={<Call />} />
        <Route path="/assessment/:sessionId" element={<Assessment />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

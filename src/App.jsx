import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Impact from './pages/Impact.jsx'
import ThankYouEmails from './pages/ThankYouEmails.jsx'
import Voluntariado from './pages/Voluntariado.jsx'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/donar" element={<Dashboard />} />
        <Route path="/impacto" element={<Impact />} />
        <Route path="/correos" element={<ThankYouEmails />} />
        <Route path="/voluntariado" element={<Voluntariado />} />
      </Routes>
      <footer className="footer">
        <div className="container">
          <p className="footer__text">
            Hecho con <span className="footer__heart">❤️</span> por Think Tank — Hackathon 2025
            <br />
            En apoyo a la Fundación Infantil Ronald McDonald
          </p>
        </div>
      </footer>
    </>
  )
}

export default App

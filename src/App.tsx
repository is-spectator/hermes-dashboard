import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/Overview'
import Providers from './pages/Providers'
import Sessions from './pages/Sessions'
import Skills from './pages/Skills'
import Logs from './pages/Logs'
import Cron from './pages/Cron'
import Gateways from './pages/Gateways'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/cron" element={<Cron />} />
        <Route path="/gateways" element={<Gateways />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

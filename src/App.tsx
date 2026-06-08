import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ClientsList from './pages/ClientsList'
import ClientDetails from './pages/ClientDetails'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="trainer-app-theme">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetails />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App

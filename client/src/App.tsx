import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { AppShell } from './layouts/AppShell'
import { BusinessView } from './views/BusinessView'
import { OSView } from './views/OSView'
import { IntelligenceView } from './views/IntelligenceView'
import { StrategyView } from './views/StrategyView'
import { CockpitView } from './views/CockpitView'
import { CouncilView } from './views/CouncilView'
import { FounderView } from './views/FounderView'
import { PersonalView } from './views/PersonalView'

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<BusinessView />} />
        <Route path="os" element={<OSView />} />
        <Route path="intelligence" element={<IntelligenceView />} />
        <Route path="strategy" element={<StrategyView />} />
        <Route path="cockpit" element={<CockpitView />} />
        <Route path="council" element={<CouncilView />} />
        <Route path="founder" element={<FounderView />} />
        <Route path="personal" element={<PersonalView />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ProtectedRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

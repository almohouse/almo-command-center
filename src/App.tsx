import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'

// Auth pages (outside AppShell)
const Login = lazy(() => import('@/pages/Login'))
const Setup = lazy(() => import('@/pages/Setup'))

// Business pages
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const BI = lazy(() => import('@/pages/BI'))
const Discovery = lazy(() => import('@/pages/Discovery'))
const CRDO = lazy(() => import('@/pages/CRDO'))
const Goals = lazy(() => import('@/pages/Goals'))
const B2B = lazy(() => import('@/pages/B2B'))
const Inbox = lazy(() => import('@/pages/Inbox'))

// Financials pages
const Sales = lazy(() => import('@/pages/Sales'))
const Expenses = lazy(() => import('@/pages/Expenses'))
const PnL = lazy(() => import('@/pages/PnL'))
const CashFlow = lazy(() => import('@/pages/CashFlow'))
const UnitEconomics = lazy(() => import('@/pages/UnitEconomics'))
const BudgetVsActual = lazy(() => import('@/pages/BudgetVsActual'))
const InventoryValuation = lazy(() => import('@/pages/InventoryValuation'))

// Operations pages
const Tasks = lazy(() => import('@/pages/Tasks'))
const Projects = lazy(() => import('@/pages/Projects'))
const Approvals = lazy(() => import('@/pages/Approvals'))
const Factory = lazy(() => import('@/pages/Factory'))
const Content = lazy(() => import('@/pages/Content'))
const Social = lazy(() => import('@/pages/Social'))

// Agents & OS pages
const OrgChart = lazy(() => import('@/pages/OrgChart'))
const Chat = lazy(() => import('@/pages/Chat'))
const Council = lazy(() => import('@/pages/Council'))
const Costs = lazy(() => import('@/pages/Costs'))
const Calendar = lazy(() => import('@/pages/Calendar'))

// Intelligence pages
const Vault = lazy(() => import('@/pages/Vault'))
const Memory = lazy(() => import('@/pages/Memory'))
const Logs = lazy(() => import('@/pages/Logs'))
const Settings = lazy(() => import('@/pages/Settings'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  )
}

function Page({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes (no AppShell) */}
        <Route path="/login" element={<Page component={Login} />} />
        <Route path="/setup" element={<Page component={Setup} />} />

        {/* Main app routes (with AppShell) */}
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Page component={Dashboard} />} />

          {/* Business */}
          <Route path="/goals" element={<Page component={Goals} />} />
          <Route path="/bi" element={<Page component={BI} />} />
          <Route path="/discovery" element={<Page component={Discovery} />} />
          <Route path="/crdo" element={<Page component={CRDO} />} />
          <Route path="/b2b" element={<Page component={B2B} />} />
          <Route path="/inbox" element={<Page component={Inbox} />} />

          {/* Financials */}
          <Route path="/sales" element={<Page component={Sales} />} />
          <Route path="/expenses" element={<Page component={Expenses} />} />
          <Route path="/pnl" element={<Page component={PnL} />} />
          <Route path="/cashflow" element={<Page component={CashFlow} />} />
          <Route path="/unit-economics" element={<Page component={UnitEconomics} />} />
          <Route path="/budget" element={<Page component={BudgetVsActual} />} />
          <Route path="/inventory-valuation" element={<Page component={InventoryValuation} />} />

          {/* Operations */}
          <Route path="/tasks" element={<Page component={Tasks} />} />
          <Route path="/projects" element={<Page component={Projects} />} />
          <Route path="/approvals" element={<Page component={Approvals} />} />
          <Route path="/factory" element={<Page component={Factory} />} />
          <Route path="/content" element={<Page component={Content} />} />
          <Route path="/social" element={<Page component={Social} />} />

          {/* Agents & OS */}
          <Route path="/org" element={<Page component={OrgChart} />} />
          <Route path="/chat" element={<Page component={Chat} />} />
          <Route path="/council" element={<Page component={Council} />} />
          <Route path="/costs" element={<Page component={Costs} />} />
          <Route path="/calendar" element={<Page component={Calendar} />} />

          {/* Intelligence */}
          <Route path="/vault" element={<Page component={Vault} />} />
          <Route path="/memory" element={<Page component={Memory} />} />
          <Route path="/logs" element={<Page component={Logs} />} />
          <Route path="/settings" element={<Page component={Settings} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

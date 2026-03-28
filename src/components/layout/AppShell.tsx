import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import AudioPlayer from './AudioPlayer'
import ToastContainer from './ToastContainer'

const SIDEBAR_EXPANDED = 256
const SIDEBAR_COLLAPSED = 64

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute rounded-full opacity-[0.03] blur-3xl"
          style={{ width: 600, height: 600, top: -200, left: 100, background: '#e6e6fa' }}
        />
        <div
          className="absolute rounded-full opacity-[0.02] blur-3xl"
          style={{ width: 400, height: 400, bottom: 100, right: 200, background: '#ff9fe3' }}
        />
      </div>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <TopBar sidebarWidth={sidebarWidth} />

      {/* Main content */}
      <main
        className="relative z-10 pt-16 min-h-screen transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Global audio player */}
      <AudioPlayer sidebarWidth={sidebarWidth} />

      {/* Global toast notifications */}
      <ToastContainer sidebarWidth={sidebarWidth} />
    </div>
  )
}

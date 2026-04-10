import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'

export default function AppPage() {
  const [activeSession, setActiveSession] = useState(null)
  const [refresh, setRefresh] = useState(0)

  const triggerRefresh = () => setRefresh(r => r + 1)

  return (
    <div style={S.layout}>
      <Sidebar
        activeId={activeSession}
        onSelect={id => setActiveSession(id)}
        onNew={() => setActiveSession(null)}
        refreshTrigger={refresh}
      />
      <main style={S.main} className="app-main">
        <ChatWindow
          sessionId={activeSession}
          onNewSession={triggerRefresh}
        />
      </main>
    </div>
  )
}

const S = {
  layout: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden'
  },
  main: {
    marginLeft: 260,
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
    // Responsive margin handled by .app-main CSS class in index.css
  }
}

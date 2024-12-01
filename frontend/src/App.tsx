import Navbar from '@/components/Navbar'
import { useState } from 'react'
import './App.css'
import AdminView from './components/AdminView'
import EntryComponent from './components/EntryComponent'
import InviteFriend from './components/InviteFriend'
import UserRewards from './components/Rewards'
import TodayQuestion from './components/TodayQuestion'
import { MetaMaskProvider } from './hooks/MetamaskContext'
import './styles/global.css'

enum LAYOUT_VIEW {
  HOME,
  QUESTION,
  INVITE,
  REWARD,
}

function App() {

  const [layoutView, setLayoutView] = useState(LAYOUT_VIEW.HOME);

  return (
    <>
      <MetaMaskProvider>
        <div className="min-h-screen background-grid">
          <div className="gradient-bg-welcome mb-20">
            <Navbar />
            {/* <Alert /> */}
          </div>
          {layoutView === LAYOUT_VIEW.HOME && <EntryComponent
            toQuestion={() => setLayoutView(LAYOUT_VIEW.QUESTION)}
            toInvite={() => setLayoutView(LAYOUT_VIEW.INVITE)}
            toReward={() => setLayoutView(LAYOUT_VIEW.REWARD)}
          />}
          {layoutView === LAYOUT_VIEW.QUESTION && <TodayQuestion
            onClose={() => setLayoutView(LAYOUT_VIEW.HOME)} />}
          {layoutView === LAYOUT_VIEW.INVITE && <InviteFriend
            onClose={() => setLayoutView(LAYOUT_VIEW.HOME)} />}
          {layoutView === LAYOUT_VIEW.REWARD && <UserRewards
            onClose={() => setLayoutView(LAYOUT_VIEW.HOME)} />}
          <AdminView />
        </div>
      </MetaMaskProvider>
    </>
  )
}

export default App

import NetworkAlert from '@/components/AccountAlert'
import Navbar from '@/components/Navbar'
import './App.css'
import Alert from './components/Alert'
import FormComponent from './components/FormComponent'
import ResultComponent from './components/ResultComponent'
import { MetaMaskProvider } from './hooks/MetamaskContext'
import './styles/global.css'

function App() {

  return (
    <>
      <MetaMaskProvider>
        <div className="min-h-screen">
          <div className="gradient-bg-welcome">
            <Navbar />
            <Alert />
          </div>
          <NetworkAlert />
          <FormComponent />
          <ResultComponent />
        </div>
      </MetaMaskProvider>
    </>
  )
}

export default App

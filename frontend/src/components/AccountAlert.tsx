import { MetaMaskContext } from '@/hooks/MetamaskContext'
import { AlertTriangle, } from 'lucide-react'
import { useContext } from 'react'

const NetworkAlert = () => {

  const [state] = useContext(MetaMaskContext)

  if (!state.selectedAcount) {
    return (
      <div className="flex w-full rounded-md shadow-sm border m-auto my-2 pl-2 pr-2 pt-2 pb-2 items-center justify-start gap-2 bg-red-600 margin-auto">
        <AlertTriangle color="#fff" />
        <p className="text-sm text-white">
          <a href="https://hc-wallet.sepolia.boba.network/"  target='blank'>Click to create a Snap Account</a>
        </p>
      </div>
    )
  }

  return <></>

}

export default NetworkAlert

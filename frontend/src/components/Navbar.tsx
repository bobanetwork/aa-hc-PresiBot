import logo from '@/assets/enya-logo.svg'
import { MetamaskActions, MetaMaskContext } from '@/hooks/MetamaskContext'
import { useContext } from 'react'
import { HeaderButtons } from './ConnectButton'
import { connectSnap, getSnap } from '@/lib/snap'
import NetworkAlert from "@/components/AccountAlert.tsx";

const Navbar = () => {

  const [state, dispatch] = useContext(MetaMaskContext)

  const handleClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  }

  const toHcWallet = () => {
    window.open('https://hc-wallet.sepolia.boba.network/', 'blank')
  }

  return (
    <>
      <nav className="w-full flex md:justify-center justify-between items-center p-4 bg-white shadow-xl">
        <div className="md:flex-[0.5] flex-initial justify-center items-center">
          <img src={logo} alt="logo" className="w-32 cursor-pointer" />
        </div>
        <ul className="text-white md:flex hidden list-none flex-row justify-between items-center flex-initial">
        <NetworkAlert />
          <HeaderButtons
            state={state}
            onConnectClick={handleClick}
            onSetupWallet={toHcWallet}
          />
        </ul>
      </nav>
    </>
  )
}


export default Navbar
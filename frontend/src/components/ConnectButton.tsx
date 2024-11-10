import { MetamaskState } from "@/hooks/MetamaskContext";
import { Button } from "./ui/button";
import MMFlaskFox from "@/assets/flask_fox.svg";
import truncateEthAddress from 'truncate-eth-address';

const InstallMetaMaskButton = ({ ...props }) => {
  return <Button {...props} variant="destructive" className="py-2 px-7 mx-4 rounded-2xl">
    <img src={MMFlaskFox} alt="mm fox" className="mr-2" />
    Install MM flask
  </Button>
}
const ConnectButton = ({ ...props }) => {
  return <Button
    {...props}
    variant="destructive"
    className="py-2 px-7 mx-4 rounded-2xl">
    <img src={MMFlaskFox} alt="mm fox" className="mr-2" />
    Connect
  </Button>
}

export const HeaderButtons = ({
  state,
  onConnectClick,
  onSetupWallet
}: {
  state: MetamaskState;
  onConnectClick(): unknown;
    onSetupWallet(): unknown;
}) => {

  if (!state.hasMetaMask && !state.installedSnap) {
    return <InstallMetaMaskButton onClick={onSetupWallet} />;
  }

  if (!state.installedSnap) {
    return <ConnectButton onClick={onConnectClick} />;
  }

  return (
    <div className="py-2 px-7 mx-4 rounded-2xl bg-teal-200 flex justify-between items-center gap-4">
      <div className="p-1 rounded-full h-8 w-8 bg-green-600"></div>
      <div className="flex flex-col gap-1 items-start justify-start">
        {state?.selectedAcount?.address && <p className="text-sm text-blue-800">{truncateEthAddress(state?.selectedAcount?.address)}</p>}
        <p className="text-xs text-black">Connected</p>
      </div>
    </div>
  );
};
import type { KeyringAccount } from '@metamask/keyring-api';
import { KeyringSnapRpcClient } from '@metamask/keyring-api';
import type { Dispatch, ReactNode, Reducer } from 'react';
import { createContext, useEffect, useReducer } from 'react';

import { hasMetaMask } from '@/lib/metamask';
import { getSnap, loadAccountConnected } from '@/lib/snap';
import type { Snap } from '@/types/snap';
import { defaultSnapOrigin } from '@/config';

export type MetamaskState = {
  hasMetaMask: boolean;
  installedSnap?: Snap;
  error?: Error;
  accounts?: KeyringAccount[];
  selectedAcount?: KeyringAccount;
  chain?: string;
};

const initialState: MetamaskState = {
  hasMetaMask: false,
};

type MetamaskDispatch = { type: MetamaskActions; payload: any };

export const MetaMaskContext = createContext<
  [MetamaskState, Dispatch<MetamaskDispatch>]
>([
  initialState,
  () => {
    /* no op */
  },
]);

export enum MetamaskActions {
  SetInstalled = 'SetInstalled',
  SetMetaMaskDetected = 'SetMetaMaskDetected',
  SetError = 'SetError',
  SetAccount = 'SetAccount',
  SetNework = 'SetNework',
}

const reducer: Reducer<MetamaskState, MetamaskDispatch> = (state, action) => {
  switch (action.type) {
    case MetamaskActions.SetInstalled:
      return {
        ...state,
        installedSnap: action.payload,
      };

    case MetamaskActions.SetMetaMaskDetected:
      return {
        ...state,
        hasMetaMask: action.payload,
      };

    case MetamaskActions.SetError:
      return {
        ...state,
        error: action.payload,
      };
    case MetamaskActions.SetAccount:
      return {
        ...state,
        accounts: action.payload.accounts,
        selectedAcount: action.payload.selectedAccount,
        chain: action.payload.chain,
      };

    default:
      return state;
  }
};

/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
export const MetaMaskProvider = ({ children }: { children: ReactNode }) => {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  const client = new KeyringSnapRpcClient(defaultSnapOrigin, window.ethereum);

  useEffect(() => {
    const detectInstallation = async () => {
      /**
       * Detect if MetaMask is installed.
       */
      async function detectMetaMask() {
        const isMetaMaskDetected = await hasMetaMask();

        dispatch({
          type: MetamaskActions.SetMetaMaskDetected,
          payload: isMetaMaskDetected,
        });
      }

      /**
       * Detect if the snap is installed.
       */
      async function detectSnapInstalled() {
        const installedSnap = await getSnap();
        dispatch({
          type: MetamaskActions.SetInstalled,
          payload: installedSnap,
        });
      }

      async function loadAccountState() {
        const accounts = await client.listAccounts();
        const currentAccount = await loadAccountConnected();
        const selectedAccount = accounts.find((acc) => acc.address.toLowerCase() === currentAccount.toLowerCase());
        const chain = window.ethereum.networkVersion;
        dispatch({
          type: MetamaskActions.SetAccount,
          payload: {
            accounts,
            chain,
            selectedAccount,
          }
        })
      }

      const listenToMMChange = async () => {
        window.ethereum.on('accountsChanged', async () => {
          //reset connection
          await loadAccountState()
        });

        // change in network.
        window.ethereum.on('networkChanged', (chainId: any) => {
          // Time to reload your interface with the new networkId
          if (chainId !== 28882) {
            dispatch({
              type: MetamaskActions.SetNework,
              payload: chainId
            })
          }
        })
      }

      await detectMetaMask();

      // good to add check for boba sepolia
      if (state.hasMetaMask) {
        await detectSnapInstalled();

        await loadAccountState();

        await listenToMMChange();

      }

    };

    detectInstallation().catch(console.error);
  }, [state.hasMetaMask, window.ethereum]);

  useEffect(() => {
    let timeoutId: number;

    if (state.error) {
      timeoutId = window.setTimeout(() => {
        dispatch({
          type: MetamaskActions.SetError,
          payload: undefined,
        });
      }, 10000);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [state.error]);

  return (
    <MetaMaskContext.Provider value={[state, dispatch]}>
      {children}
    </MetaMaskContext.Provider>
  );
};

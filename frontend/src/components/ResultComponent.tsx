import { ADD_SUB_CONTRACT } from '@/config/snap'
import { MetaMaskContext } from '@/hooks/MetamaskContext'
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'
import { useContext, useEffect, useState } from 'react'
import addSubContractAbi from '../abi/testCounter.abi.json'
import { Button } from './ui/button'

const ResultComponent = () => {
  const [state] = useContext(MetaMaskContext);
  const [address, setaddress] = useState<string>('')
  const [result, setResult] = useState();

  useEffect(() => {
    if (state.selectedAcount) {
      setaddress(state.selectedAcount?.address as string)
    }
  }, [state.selectedAcount])

  const onReadCounter = async () => {

    try {
      if (!address && !state.selectedAcount) {
        return false
      }

      // Try to use the configured RPC provider first, fallback to MetaMask
      let provider;
      const rpcUrl = import.meta.env.VITE_RPC_PROVIDER;
      
      if (rpcUrl && rpcUrl !== 'undefined') {
        console.log(`Using configured RPC: ${rpcUrl}`);
        provider = new JsonRpcProvider(rpcUrl);
      } else {
        console.log('Using MetaMask provider');
        provider = new BrowserProvider(window.ethereum, 'any');
      }

      const addSubContract = new Contract(
        ADD_SUB_CONTRACT,
        addSubContractAbi,
        provider
      )
      console.log(`calling userCount`, addSubContract);

      const userCount = await addSubContract.counters(address);

      console.log(`userCount`, userCount.toString());
      setResult(userCount.toString());
    } catch (error) {
      console.log(`something went wrong!`, error);
    }

  }

  return (
    <div className="flex w-6/12 rounded-md shadow-sm border m-auto my-2 p-5">
      <div className="flex flex-col gap-2 justify-between w-full">
        <div className="p-2 rounded-md mb-2 flex ">
          <p className="text-xl text-blue-500">Counters Value</p>
        </div>
        <div className="flex justify-between items-start p-2">
          <input type="text" value={address} onChange={(e) => setaddress(e.target.value)} name="input B" id="input B" className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="0.00" />
          <Button
            onClick={onReadCounter}
            className="py-2 px-7 mx-4 rounded-md text-sm" variant="outline">
            Read
          </Button>
        </div>
        {result && <div className="flex flex-1 rounded-md bg-teal-100 p-4 w-full cursor-pointer"
          onClick={async () => {
            await navigator.clipboard.writeText(result);
          }}
        >
          <div className="text-roboto-mono text-left text-xs text-blue-800 break-all whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </div>
        </div>}
      </div>
    </div>
  )
}

export default ResultComponent

import { useContext, useState } from "react"
import { Button } from "./ui/button"
import { defaultSnapOrigin } from "@/config"
import { MetaMaskContext } from "@/hooks/MetamaskContext"
import { concat, FunctionFragment } from "ethers"
import { AbiCoder } from "ethers"
import { hexlify } from "ethers"
import { CopyIcon } from "./CopyIcon"
import { ADD_SUB_CONTRACT } from "@/config/snap"

const FormComponent = () => {
  const [state] = useContext(MetaMaskContext)
  const [inputA, setinputA] = useState<any>(0)
  const [inputB, setinputB] = useState<any>(0)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  const abiCoder = new AbiCoder();

  const onReset = () => {
    setinputA(0)
    setinputB(0)
  }

  const onSubmit = async () => {

    try {
      // check for selected account
      // check for balance.

      // if snap account not selected
      if (!state.selectedAcount || Number(state.chain) !== 28882) {
        return;
      }
      // incase no user input data.
      if (!Number(inputA) || !Number(inputB) || !state.chain || !state.selectedAcount) {
        return
      }

      const funcSelector = FunctionFragment.getSelector("count", ["uint32", "uint32"]);

      const encodedParams = abiCoder.encode(
        ['uint32', 'uint32'],
        [Number(inputA), Number(inputB)],
      );

      const txData = hexlify(concat([funcSelector, encodedParams]));

      const transactionDetails = {
        payload: {
          to: ADD_SUB_CONTRACT,
          value: '0',
          data: txData,
        },
        account: state.selectedAcount.id,
        scope: `eip155:${state.chain}`,
      };

      const txResponse = await window.ethereum?.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: defaultSnapOrigin,
          request: {
            method: 'eth_sendUserOpBoba', // operation to send the data to bundler
            params: [transactionDetails],
            id: state.selectedAcount?.id,
          },
        },
      })

      setResponse(txResponse);
    } catch (error: any) {
      console.log(`error`, error);
      setError(error.message);
    }

  }

  return (
    <div className="flex flex-col w-6/12 rounded-md shadow-sm border m-auto my-2 p-5">
      <div className="flex gap-1 items-stretch justify-around w-full">
        <div className="flex flex-col justify-start items-start">
          <label className="block text-sm font-medium leading-6 text-gray-900">Input A</label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input type="text" value={inputA} onChange={(e) => setinputA(e.target.value)} name="input A" id="input A" className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="0.00" />
          </div>
        </div>
        <div className="flex flex-col justify-start items-start">
          <label className="block text-sm font-medium leading-6 text-gray-900">Input B</label>
          <div className="relative mt-2 rounded-md shadow-sm">
            <input type="text" value={inputB} onChange={(e) => setinputB(e.target.value)} name="input B" id="input B" className="block w-full rounded-md border-0 py-1.5 pl-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="0.00" />
          </div>
        </div>
        <div className="flex items-end">
          <Button onClick={onSubmit} className="py-2 px-7 mx-4 rounded-md text-sm" variant="destructive">Submit</Button>
          <Button onClick={onReset} className="py-2 px-7 mx-4 rounded-md text-sm" variant="secondary">Reset</Button>
        </div>
      </div>
      {error && <div className="flex w-full flex-col my-2">
        <div className="w-full p-2 bg-red-600 rounded-md mb-2 flex ">
          <p className="text-md text-white"> Opps, something went wrong!</p>
        </div>
        <div className="flex flex-1 justify-between rounded-md bg-teal-100 p-4 w-full cursor-pointer">
          <div className="text-roboto-mono text-left text-xs text-blue-800 break-all whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </div>
          <div className="w-4 h-4 justify-end items-end"><CopyIcon /></div>
        </div>
      </div>}
      {response && <div className="flex w-full flex-col my-2">
        <div className="w-full p-2 bg-green-200 rounded-md mb-2 flex ">
          <p className="text-md text-blue-500"> Success!</p>
        </div>
        <div className="flex flex-1 justify-between rounded-md bg-teal-100 p-4 w-full cursor-pointer">
          <div className="text-roboto-mono text-left text-xs text-blue-800 break-all whitespace-pre-wrap">
            {JSON.stringify(response, null, 2)}
          </div>
          <div className="w-4 h-4 justify-end items-end"><CopyIcon /></div>
        </div>
      </div>}
    </div>
  )
}

export default FormComponent

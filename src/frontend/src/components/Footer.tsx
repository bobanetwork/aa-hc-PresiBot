import { snapPackageVersion } from "@/config"
import { MetaMaskContext } from "@/hooks/MetamaskContext"
import { useContext } from "react"


const Footer = () => {

  const [state] = useContext(MetaMaskContext)

  console.log(`state`, state)

  return (
    <div className="flex flex-col w-full py-4 fixed bottom-0">
      <hr className="dark:border-black-700 lg:my-6" />
      <div className="flex gap-3 justify-center">
        <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">Snap Version:{snapPackageVersion}</span>
        <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">Installed Snap: {state?.installedSnap?.version}</span>
      </div>
    </div>

  )
}

export default Footer

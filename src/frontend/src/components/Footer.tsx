import { snapPackageVersion } from "@/config"
import { MetaMaskContext } from "@/hooks/MetamaskContext"
import { useContext } from "react"


const Footer = () => {

  const [state] = useContext(MetaMaskContext)

  return (
    <div className="flex flex-col w-full py-4 fixed bottom-0">
      <div className="flex gap-3 justify-center">
        <span className="block text-sm text-white sm:text-center dark:text-gray-400">Snap Version:{snapPackageVersion}</span>
        <span className="block text-sm text-white sm:text-center dark:text-gray-400">Installed Snap: {state?.installedSnap?.version}</span>
      </div>
    </div>

  )
}

export default Footer

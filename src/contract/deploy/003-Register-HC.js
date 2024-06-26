const HCHelperJson = require('../artifacts/contracts/core/HCHelper.sol/HCHelper.json')

const deployFn = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()
  const signer = await hre.ethers.provider.getSigner(deployer)

  const PresiSimTokenArtifact = await hre.deployments.get('PresiSimToken')
  const HybridAccountArtifact = await hre.deployments.get('HybridAccount')
  const HybridAccount = new hre.ethers.Contract(
    HybridAccountArtifact.address,
    HybridAccountArtifact.abi,
    signer
  )

  const initOwner = await HybridAccount.initialize(deployer)
  await initOwner.wait()
  console.log('Owner initialized')

  const addPermitCaller = await HybridAccount.PermitCaller(PresiSimTokenArtifact.address, true)
  await addPermitCaller.wait()
  console.log('PermitCaller added')

  const HCHelper = new hre.ethers.Contract(
    '0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8',
    HCHelperJson.abi,
    signer
  )

  const registerURL = await HCHelper.RegisterUrl(HybridAccountArtifact.address, 'https://bobablockchainbusters-rpc.hackathon.sepolia.boba.network')
  await registerURL.wait()
  console.log('URL registered')

  const addCredit = await HCHelper.AddCredit(HybridAccountArtifact.address, 1000000)
  await addCredit.wait()
  console.log('Credits added')
}

deployFn.tags = ['Register', 'setup', 'l1']

module.exports = deployFn
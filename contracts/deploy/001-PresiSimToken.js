const deployFn = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()
  const HybridAccountArtifact = await hre.deployments.get('HybridAccount')
  console.log('HybridAccount Address: ', HybridAccountArtifact.address)
  await hre.deployments.deploy('PresiSimToken', {
    contract: 'PresiSimToken',
    from: deployer,
    args: [HybridAccountArtifact.address],
    log: true,
    waitConfirmations: 1,
  })
}

deployFn.tags = ['PresiSimToken', 'setup', 'l1']

module.exports = deployFn

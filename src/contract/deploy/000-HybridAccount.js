const deployFn = async (hre) => {
  const { deployer } = await hre.getNamedAccounts()
  await hre.deployments.deploy('HybridAccount', {
    contract: 'HybridAccount',
    from: deployer,
    args: ['0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', '0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8'],
    log: true,
    waitConfirmations: 1,
  })
}

deployFn.tags = ['HybridAccount', 'setup', 'l1']

module.exports = deployFn


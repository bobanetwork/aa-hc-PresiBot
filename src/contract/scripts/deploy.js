// scripts/deploy.js
async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log('Deploying contracts with the account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());
  
    const PresiSimToken = await ethers.getContractFactory('PresiSimToken');
    const token = await PresiSimToken.deploy();
  
    console.log('Token address:', token.address);
  
    // Wait for the deployment to be mined
    await token.deployed();
  
    console.log('Token deployed to:', token.address);
  
    // Verify the contract after deployment
    await hre.run('verify:verify', {
      address: token.address,
      constructorArguments: [],
    });
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  
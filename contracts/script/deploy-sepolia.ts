import * as dotenv from "dotenv";
import * as path from "path";
import {
    DEFAULT_SNAP_VERSION,
    execPromise, getContractFromDeployAddresses,
    parseDeployAddresses,
    readHybridAccountAddress,
    updateEnvVariable
} from './utils'

dotenv.config();

const DEFAULT_BOBA_SEPOLIA = {
    RPC_URL: 'https://sepolia.boba.network',
    HC_HELPER_ADDR: '0x1c64EC0A5E2C58295c3208a63209A2A719dF68D8',
    ENTRYPOINT_ADDR: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789',
}

async function main() {
    try {
        const {HC_HELPER_ADDR, RPC_URL, ENTRYPOINT_ADDR} = DEFAULT_BOBA_SEPOLIA

        console.log("Using RPC = ", RPC_URL)
        // Step 1: Compile Hardhat project
        console.log("Compiling Hardhat project...");
        await execPromise("npx hardhat compile");

        // Step 2: Deploy Hybrid Account
        console.log("Deploying Hybrid Account...");
        const forgeOutput = await execPromise(
            `forge script script/deploy-sepolia.s.sol:DeployExample --rpc-url ${RPC_URL} --broadcast`
        );
        console.log("CONTRACT DEPLOYMENT DONE!", forgeOutput);

        const latestBroadcast = "../broadcast/deploy-sepolia.s.sol/28882/run-latest.json"
        const hybridAccountAddress = readHybridAccountAddress(latestBroadcast);
        const contracts = parseDeployAddresses(latestBroadcast)
        const preSimTokenAddr = getContractFromDeployAddresses(contracts, "PresiSimToken")

        console.log("Verifying HybridAccount contract...");
        await execPromise(
            `cast call --rpc-url=${RPC_URL} ${hybridAccountAddress} "getDeposit()"`
        );

        // Update HYBRID_ACCOUNT in .env-local
        updateEnvVariable("HYBRID_ACCOUNT", hybridAccountAddress);
        console.log(`Updated HYBRID_ACCOUNT in .env: ${hybridAccountAddress}`);

        // Update PRE_SIM_TOKEN_ADDR in .env-local
        updateEnvVariable("PRE_SIM_TOKEN_ADDR", preSimTokenAddr);
        console.log(`Updated PRE_SIM_TOKEN_ADDR in .env: ${preSimTokenAddr}`);

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const {PRIVATE_KEY, BACKEND_URL} = process.env
        // Step 4: Verify contract
        console.log("Verifying contract...");
        await execPromise(
            `npx hardhat verify --network boba_sepolia ${preSimTokenAddr} ${hybridAccountAddress}`
        );


        // Step 5: Run production push script
        console.log("Running production push script...");
        console.log('HCH = ', HC_HELPER_ADDR)
        console.log('HA = ', hybridAccountAddress);
        console.log('TTP = ', preSimTokenAddr);
        console.log('BE = ', BACKEND_URL)
        console.log('RPC_URL = ', RPC_URL)
        console.log('-------------------')

        const finalBackendUrl = BACKEND_URL ?? "https://presi-bot-backend.onrender.com/hc"
        updateEnvVariable("BACKEND_URL", finalBackendUrl)
        updateEnvVariable("ENTRY_POINT", ENTRYPOINT_ADDR)

        if (!BACKEND_URL) {
            console.warn('BACKEND_URL not defined. Using default public endpoint https://presi-bot-backend.onrender.com/hc')
        }
        if (!HC_HELPER_ADDR || !hybridAccountAddress || !preSimTokenAddr || !PRIVATE_KEY || !RPC_URL) {
            throw Error("Configuration missing")
        }

        await execPromise(
            `node script/create-contract-configuration.js ${RPC_URL} ${PRIVATE_KEY} ${HC_HELPER_ADDR} ${hybridAccountAddress} ${preSimTokenAddr} ${finalBackendUrl}`
        );

        console.log("Deployment process completed successfully!");


        // save relevant envs to frontend
        console.log('Saving relevant env variables to frontend. The Boba sepolia config will be used if some variables are missing.')
        const frontendEnvPath = '../../frontend/.env-boba-sepolia'
        updateEnvVariable("VITE_SMART_CONTRACT", preSimTokenAddr, frontendEnvPath);
        updateEnvVariable("VITE_SNAP_ORIGIN", 'npm:@bobanetwork/snap-account-abstraction-keyring-hc', frontendEnvPath);
        updateEnvVariable("VITE_SNAP_VERSION", DEFAULT_SNAP_VERSION, frontendEnvPath);
        updateEnvVariable("VITE_RPC_PROVIDER", RPC_URL ?? 'https://sepolia.boba.network', frontendEnvPath);

        const frontendEnvPathSnapLocal = '../../frontend/.env-local-boba-sepolia-snaplocal'
        updateEnvVariable("VITE_SMART_CONTRACT", preSimTokenAddr, frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_SNAP_ORIGIN", 'local:http://localhost:8080', frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_SNAP_VERSION", DEFAULT_SNAP_VERSION, frontendEnvPathSnapLocal);
        updateEnvVariable("VITE_RPC_PROVIDER", RPC_URL ?? 'https://sepolia.boba.network', frontendEnvPathSnapLocal);

        const snapSiteEnvFolder = '../../snap-account-abstraction-keyring/packages/site/'
        updateEnvVariable('USE_LOCAL_NETWORK', "false", `${snapSiteEnvFolder}/.env`)
        updateEnvVariable('USE_LOCAL_NETWORK', "false", `${snapSiteEnvFolder}/.env.development`)
        updateEnvVariable('USE_LOCAL_NETWORK', "false", `${snapSiteEnvFolder}/.env.development.hc`)

        // Backend env vars
        const backendEnvPath = path.resolve(__dirname, "../../backend/.env-local");
        updateEnvVariable(
            "OC_HYBRID_ACCOUNT",
            hybridAccountAddress,
            backendEnvPath
        );

        updateEnvVariable(
            "ENTRY_POINTS",
            ENTRYPOINT_ADDR, // @dev Official Boba Sepolia Entrypoint: https://docs.boba.network/developer/features/aa-basics/contract-addresses
            backendEnvPath
        );
        updateEnvVariable("CHAIN_ID", "2882", backendEnvPath);
        updateEnvVariable("OC_PRIVKEY", PRIVATE_KEY!, backendEnvPath);
        updateEnvVariable(
            "HC_HELPER_ADDR",
            HC_HELPER_ADDR,
            backendEnvPath
        );

        console.log("Backend ENV vars set...");

        /** @DEV bootstrap frontend */
        await execPromise(
            "docker-compose -f docker-compose.sepolia.yml up --build",
            [],
            path.resolve(__dirname, "../../")
        );

    } catch (error) {
        console.error("An error occurred during the deployment process:", error);
    }
}

main();

export {
    main,
    execPromise,
    updateEnvVariable,
    readHybridAccountAddress,
};

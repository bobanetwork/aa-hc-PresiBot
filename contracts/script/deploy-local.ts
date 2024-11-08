import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import {ethers} from "ethers";
import {
    DEFAULT_SNAP_VERSION, getContractFromDeployAddresses,
    getLocalIpAddress,
    isPortInUse,
    parseDeployAddresses
} from "./utils";
import {execPromise} from './utils'
import {sleep} from "@nomicfoundation/hardhat-verify/internal/utilities";

dotenv.config();

/** @DEV addresses */
const deployAddr = ethers.getAddress("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
const deployKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const bundlerAddr = ethers.getAddress("0xB834a876b7234eb5A45C0D5e693566e8842400bB");
const builderPrivkey = "0xf91be07ef5a01328015cae4f2e5aefe3c4577a90abb8e2e913fe071b0e3732ed";
const ha0Owner = ethers.getAddress("0x2A9099A58E0830A4Ab418c2a19710022466F1ce7");
const ha0Privkey = "0x75cd983f0f4714969b152baa258d849473732905e2301467303dacf5a09fdd57";
const ha1Owner = ethers.getAddress("0xE073fC0ff8122389F6e693DD94CcDc5AF637448e");

/** @DEV Other Configurations */
const RPC_URL_L1 = 'http://localhost:8545';
const RPC_URL_L2 = 'http://localhost:9545';
const L1StandardBridge = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const l1provider = new ethers.JsonRpcProvider(RPC_URL_L1);
const l2provider = new ethers.JsonRpcProvider(RPC_URL_L2);
const walletL2 = new ethers.Wallet(deployKey, l2provider);
const walletL1 = new ethers.Wallet(deployKey, l1provider);

/** @DEV Configurations */
const snapEnv = '../snap-account-abstraction-keyring/packages/snap/.env-local-local'
const rootPath = '../.env-local'
const frontendEnvPath = path.resolve(__dirname, "../../frontend/.env-local-local");
const backendEnvPath = path.resolve(__dirname, "../../backend/.env-local");
const contractsEnvPath = path.resolve(__dirname, "../.env-local");
let aaConfigFile = fs.readFileSync('../snap-account-abstraction-keyring/packages/snap/src/constants/aa-config.ts', 'utf8');

// TODO: fix .env-local file loading. Currently .env-local needs to be in /script directory
async function main() {
    try {
        const args = process.argv.slice(2);
        const ciArg = args.find((arg) => arg.startsWith('--ci='));
        // if true, then the script will regularly clean up idle data to keep storage low
        const isCi: boolean = ciArg ? ciArg.split('=')[1].toLowerCase() === 'true' : false;

        if (!isPortInUse(8545) && !isPortInUse(9545)) {
            await execPromise("pnpm install", [], path.resolve(__dirname, "../../boba"));
            //await execPromise('go mod tidy -e', [], path.resolve(__dirname, "../../boba"));
            await execPromise("make devnet-up", [], path.resolve(__dirname, "../../boba"));
        } else {
            console.log("Boba Chain already running, skipping")
        }

        if (isCi) {
            await execPromise(`find ${path.resolve(__dirname, "../../boba")} -name \"node_modules\" -type d -prune -exec rm -rf {} +`, []);
            console.log("Deleted node_modules within boba repo.")

            // TODO: maybe also delete /lib folder for foundry

            await execPromise("sudo apt remove make golang-go && sudo apt autoremove", []);
            console.log("Deleted make and golang as not needed anymore.")
        }

        await fundL2();

        await sleep(5000);

        const BACKEND_URL = process.env.BACKEND_URL ?? `http://${getLocalIpAddress()}:1234/hc`
        if (!process.env.BACKEND_URL) {
            console.warn('[deploy-local.ts] No BACKEND_URL defined. Might be expected for default deployments and CI. Using localhost.')
            // NOTE: DO NOT THROW AN ERROR HERE, as we do use a default value above
        }
        const baseDeployVars = {
            ...process.env,
            PRIVATE_KEY: deployKey,
            BUNDLER_ADDR: bundlerAddr,
            HC_SYS_OWNER: ha1Owner,
            DEPLOY_ADDR: deployAddr,
            BACKEND_URL,
        };

        await execPromise(
            "forge script --json --broadcast --rpc-url http://localhost:9545 deploy.s.sol:DeployExample -vvvvv",
            undefined,
            path.resolve(__dirname, "./"),
            baseDeployVars
        );

        // Contracts
        const latestBroadcast = "../broadcast/deploy.s.sol/901/run-latest.json"
        const contracts = parseDeployAddresses(latestBroadcast);
        console.log('parsed Contracts: ', contracts)
        const hcHelperAddr = getContractFromDeployAddresses(contracts, "HCHelper");
        const haFactory = getContractFromDeployAddresses(contracts, "HybridAccountFactory");
        const saFactory = getContractFromDeployAddresses(contracts, "SimpleAccountFactory");
        const presiSimToken = getContractFromDeployAddresses(contracts, "PresiSimToken");
        const tokenPaymasterAddress = getContractFromDeployAddresses(contracts, "TokenPaymaster");
        const verifyingPaymasterContract = getContractFromDeployAddresses(contracts, "VerifyingPaymaster");
        const entrypoint = getContractFromDeployAddresses(contracts, "EntryPoint");
        const hybridAccountAddr = getContractFromDeployAddresses(contracts, "ERC1967Proxy");

        if (!hybridAccountAddr) throw Error("Unable to parse created HA Account");

        console.log(`Contract Addresses Deployed:
                    HCHelper: ${hcHelperAddr}
                    HybridAccountFactory: ${haFactory}
                    SimpleAccountFactory: ${saFactory}
                    CustomContract: ${presiSimToken}
                    TokenPaymaster: ${tokenPaymasterAddress}
                    VerifyingPaymaster: ${verifyingPaymasterContract}
                    EntryPoint: ${entrypoint}
                    HybridAccount: ${hybridAccountAddr}
        `);

        if (!hcHelperAddr || !hybridAccountAddr || !haFactory || !presiSimToken || !tokenPaymasterAddress || !verifyingPaymasterContract || !saFactory || !entrypoint) {
            throw Error("Some contracts are not defined!");
        }

        /** @DEV Rundler Environment */
        updateEnvVariable("HC_HELPER_ADDR", hcHelperAddr, rootPath);
        updateEnvVariable("HC_SYS_ACCOUNT", hybridAccountAddr, rootPath);
        updateEnvVariable("HC_SYS_OWNER", ha0Owner, rootPath);
        updateEnvVariable("HC_SYS_PRIVKEY", ha0Privkey, rootPath);
        updateEnvVariable("HA_FACTORY_ADDR", haFactory, rootPath);
        updateEnvVariable("SA_FACTORY_ADDR", saFactory, rootPath);
        updateEnvVariable("ENTRY_POINTS", entrypoint, rootPath);
        updateEnvVariable("BUILDER_PRIVKEY", builderPrivkey, rootPath);
        updateEnvVariable("NODE_HTTP", `http://${getLocalIpAddress()}:9545`, rootPath);
        updateEnvVariable("CHAIN_ID", "901", rootPath);
        updateEnvVariable("OC_LISTEN_PORT", "1234", rootPath);
        updateEnvVariable("BUNDLER_RPC", "http://localhost:3300", rootPath);

        /** @DEV Frontend Environment */
        updateEnvVariable("VITE_SMART_CONTRACT", presiSimToken, frontendEnvPath);
        updateEnvVariable("VITE_RPC_PROVIDER", "http://localhost:9545", frontendEnvPath);
        updateEnvVariable("VITE_SNAP_ORIGIN", "local:http://localhost:8080", frontendEnvPath);
        updateEnvVariable("VITE_SNAP_VERSION", DEFAULT_SNAP_VERSION, frontendEnvPath);

        /** @DEV Backend Environment */
        updateEnvVariable("OC_HYBRID_ACCOUNT", hybridAccountAddr, backendEnvPath);
        updateEnvVariable("ENTRY_POINTS", entrypoint, backendEnvPath);
        updateEnvVariable("CHAIN_ID", "901", backendEnvPath);
        updateEnvVariable("OC_PRIVKEY", deployKey, backendEnvPath);
        updateEnvVariable("HC_HELPER_ADDR", hcHelperAddr, backendEnvPath);
        updateEnvVariable("OC_LISTEN_PORT", "1234", backendEnvPath);
        updateEnvVariable("PRE_SIM_TOKEN_ADDR", presiSimToken, backendEnvPath);

        /** @DEV Contracts Environment */
        updateEnvVariable("HYBRID_ACCOUNT", hybridAccountAddr, contractsEnvPath);
        updateEnvVariable("ENTRY_POINT", entrypoint, contractsEnvPath);
        updateEnvVariable("TOKEN_PRICE_CONTRACT", presiSimToken, contractsEnvPath);
        updateEnvVariable("HC_HELPER_ADDR", hcHelperAddr, contractsEnvPath);
        updateEnvVariable("PRIVATE_KEY", deployKey, contractsEnvPath);
        updateEnvVariable("BACKEND_URL", `http://${getLocalIpAddress()}:1234/hc`, contractsEnvPath);

        /** @DEV SNAP Environment */
        const localConfigRegex = /(\[CHAIN_IDS\.LOCAL\]:\s*{[\s\S]*?entryPoint:\s*')([^']*)(\'[\s\S]*?simpleAccountFactory:\s*')([^']*)(\'[\s\S]*?bobaPaymaster:\s*')([^']*)(\'[\s\S]*?})/;
        aaConfigFile = aaConfigFile.replace(localConfigRegex, (match, before1, oldEntryPoint, middle1, oldSimpleAccountFactory, middle2, oldBobaPaymaster, after) => {
            return `${before1}${entrypoint}${middle1}${haFactory}${middle2}${tokenPaymasterAddress}${after}`;
        });
        fs.writeFileSync('../snap-account-abstraction-keyring/packages/snap/src/constants/aa-config.ts', aaConfigFile, 'utf8');
        updateEnvVariable("LOCAL_ENTRYPOINT", entrypoint, snapEnv);
        updateEnvVariable("LOCAL_SIMPLE_ACCOUNT_FACTORY", saFactory, snapEnv);
        updateEnvVariable("VERIFYING_PAYMASTER_ADDRESS", verifyingPaymasterContract, snapEnv);
        updateEnvVariable("LOCAL_BOBAPAYMASTER", tokenPaymasterAddress, snapEnv);
    } catch (error) {
        console.error(error);
    }
}

const updateEnvVariable = (key: string, value: string, envPath: string) => {
    console.log(`Updating ${key} = ${value}`);

    let envFile;
    try {
        envFile = fs.readFileSync(envPath, "utf8");
    } catch (err: any) {
        if (err?.code! === 'ENOENT') {
            console.log(`Creating .env file for ${envPath}`)
            envFile = '';
        } else {
            throw err;
        }
    }
    const regex = new RegExp(`^${key}=.*`, "m");
    if (regex.test(envFile)) {
        envFile = envFile.replace(regex, `${key}=${value}`);
    } else {
        envFile += `\n${key}=${value}`;
    }
    fs.writeFileSync(envPath, envFile);
    dotenv.config();
};

async function fundL2() {
    if ((await l2provider.getBalance(walletL2)) > 1) {
        console.log("Deployer already has funds on L2, continue");
    } else {
        console.log('Funding L2...')
        try {
            const tx = {
                to: L1StandardBridge,
                value: ethers.parseEther('100')
            };
            const response = await walletL1.sendTransaction(tx);
            await response.wait();
            console.log("Funding L2 done...");
        } catch (e) {
            console.error("Error: ", e);
        }
    }
}


main();

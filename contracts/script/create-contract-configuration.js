const {ethers} = require('ethers');

const args = process.argv.slice(2);

const RPC_URL = args[0];
const PRIVATE_KEY = args[1];
const HC_HELPER_ADDR = args[2];
const HYBRID_ACCOUNT = args[3];
const PRESI_SIM_TOKEN_CONTRACT = args[4];
const BACKEND_URL = args[5] ?? 'https://presi-bot-backend.onrender.com/hc'; // use public backend by default

console.log('HCH = ', HC_HELPER_ADDR)
console.log('HA = ', HYBRID_ACCOUNT);
console.log('TTP = ', PRESI_SIM_TOKEN_CONTRACT);
console.log('BE = ', BACKEND_URL)
console.log('RPC_URL = ', RPC_URL)

const signer = new ethers.Wallet(PRIVATE_KEY, new ethers.JsonRpcProvider(RPC_URL));

if (!HC_HELPER_ADDR || !HYBRID_ACCOUNT || !PRESI_SIM_TOKEN_CONTRACT || !BACKEND_URL) {
    throw Error("Configuration missing")
}

async function main() {
    const hybridAccountABI = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "caller",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "allowed",
                    "type": "bool"
                }
            ],
            "name": "PermitCaller",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    const hcHelperABI = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "contract_addr",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "url",
                    "type": "string"
                }
            ],
            "name": "RegisterUrl",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "contract_addr",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "numCredits",
                    "type": "uint256"
                }
            ],
            "name": "AddCredit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    const hybridAccountContract = new ethers.Contract(HYBRID_ACCOUNT, hybridAccountABI, signer);
    const hcHelperContract = new ethers.Contract(HC_HELPER_ADDR, hcHelperABI, signer);

    /** @DEV can be called */
    async function registerUrl(contractAddr, backendURL) {
        const tx = await hcHelperContract.RegisterUrl(contractAddr, backendURL);
        await tx.wait();
        console.log('URL registered successfully.');
    }

    /** @DEV No restrictions */
    async function addCredit(contractAddr, numCredits) {
        const tx = await hcHelperContract.AddCredit(contractAddr, numCredits);
        await tx.wait();
        console.log('Credits added successfully.');
    }

    /** @DEV No restrictions */
    async function permitCaller(caller) {
        let tx = await hybridAccountContract.PermitCaller(caller, true);
        await tx.wait();
        console.log('Caller permission updated successfully.');
    }

    try {
        console.log('Registering permitCaller...')
        await permitCaller(PRESI_SIM_TOKEN_CONTRACT);
        console.log('DONE')
    } catch (e) {
        console.log('[Ignore on testnet] failed permitCaller: ', e);
    }

    if (RPC_URL.includes('localhost')) {
        try {
            console.log('Registering URL... (is expected to fail on testnet since you are not owner)')
            await registerUrl(HYBRID_ACCOUNT, BACKEND_URL);
            console.log('DONE')
        } catch (e) {
            console.log('[Ignore on testnet] failed registerURL: ', e);
        }
    } else {
        console.log('NOT REGISTERING URL, since you are not deploying locally. Reach out to Boba Foundation to get your backend url registered on your HybridAccount.')
    }

    try {
        console.log('Adding Credits...')
        await addCredit(HYBRID_ACCOUNT, 100);
        console.log('DONE')
    } catch (e) {
        console.log('[Ignore on testnet] failed addCredit: ', e);
    }
}

// go
main().catch(console.error);
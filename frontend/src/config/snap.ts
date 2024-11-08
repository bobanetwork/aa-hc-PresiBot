import 'dotenv'
/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

// export const defaultSnapOrigin = 'npm:@bobanetwork/snap-account-abstraction-keyring-hc'
export const defaultSnapOrigin = 'local:http://localhost:8080'

/**
 * Version of snap installed so have to give release on each new version.
 * - can use to show the button to user to update snaps.
 */
export const snapPackageVersion = "1.1.4";

/* Contract address that you want to invoke. */
export const ADD_SUB_CONTRACT = '0x63BceAfAF62fB12394ecbEf10dBF1c5c36ba8b38';

export const PRESI_SIM_TOKEN_CONTRACT = import.meta.env.VITE_SMART_CONTRACT;

/*
    - admin user, create HA Account with OP default private key + Salt
*/
export const ADMIN_USER_ADDRESSES = [
    '0xa83c16Ab5C05a457aDc0fB301C1733f35D2bf579', // Salt: 1986
    '0xC12ba894dBcE0992930a79b134CDDbe69106fe04', // Salt: 1987
    '0xa83c16Ab5C05a457aDc0fB301C1733f35D2bf579'  // Salt: 1988
    ]

import 'dotenv'
/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

// export const defaultSnapOrigin = 'npm:@bobanetwork/snap-account-abstraction-keyring-hc'
export const defaultSnapOrigin = import.meta.env.VITE_SNAP_ORIGIN;

/**
 * Version of snap installed so have to give release on each new version.
 * - can use to show the button to user to update snaps.
 */
export const snapPackageVersion = import.meta.env.VITE_SNAP_VERSION;

/* Contract address that you want to invoke. */
export const ADD_SUB_CONTRACT = '0x63BceAfAF62fB12394ecbEf10dBF1c5c36ba8b38';

export const PRESI_SIM_TOKEN_CONTRACT = import.meta.env.VITE_SMART_CONTRACT;

/*
    - admin user, create HA Account with OP default private key + Salt
*/
export const ADMIN_USER_ADDRESSES = [
    '0xa83c16Ab5C05a457aDc0fB301C1733f35D2bf579', // Salt: 1986
    '0xC12ba894dBcE0992930a79b134CDDbe69106fe04', // Salt: 1987
    '0xa83c16Ab5C05a457aDc0fB301C1733f35D2bf579',  // Salt: 1988
    '0x054718bF349cc95DF536E6645a664Fb3c8F224aE',
    '0x49348066e93B79C86A795E3b024451272687b5ec',
    '0xC30b67A531480D82B430e8F20C7F03B0ef47b3C0',
    '0xAC209489a1eFec69520b3A7e89d274b1EfaAbd2A',
    '0x621F17E6d075d21f7a69b1d180b207CA6FEFE4c3' // 9991
    ]

import 'dotenv'
/**
 * The snap origin to use.
 * Will default to the local hosted snap if no value is provided in environment.
 */

// export const defaultSnapOrigin = 'npm:@bobanetwork/snap-account-abstraction-keyring-hc'
export const defaultSnapOrigin = import.meta.env.VITE_SNAP_ORIGIN;

/* Contract address that you want to invoke. */
export const ADD_SUB_CONTRACT = '0x63BceAfAF62fB12394ecbEf10dBF1c5c36ba8b38';

export const PRESI_SIM_TOKEN_CONTRACT = import.meta.env.VITE_SMART_CONTRACT;

console.log('config: ', {
    sc: import.meta.env.VITE_SMART_CONTRACT,
    so: import.meta.env.VITE_SNAP_ORIGIN,
    sv: import.meta.env.VITE_SNAP_VERSION,
    rpc: import.meta.env.VITE_RPC_PROVIDER
})

/*
    - admin user, create HA Account with OP default private key + Salt
*/
export const ADMIN_USER_ADDRESSES = ['0x57D5AaF4C16c82a6435EF9e4102d807C47eDe74E']

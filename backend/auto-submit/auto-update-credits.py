import os
from web3 import Web3
from eth_account import Account
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

def run():
    # Connect to your Ethereum node
    w3 = Web3(Web3.HTTPProvider(os.environ['NODE_HTTP']))

    # Contract details
    contract_address = Web3.to_checksum_address(os.environ['HC_HELPER_ADDR'])
    private_key = os.environ['OC_PRIVKEY']
    credits_receiver = Web3.to_checksum_address(os.environ['OC_HYBRID_ACCOUNT'])
    token_address = Web3.to_checksum_address('0x4200000000000000000000000000000000000023')
    token_abi = [
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        },
        {
            "constant": False,
            "inputs": [
                {"name": "_spender", "type": "address"},
                {"name": "_value", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }
    ]

    # Account setup
    account = Account.from_key(private_key)

    # Helper contract ABI
    helper_abi = [
        {
            "inputs": [
                {"internalType": "address", "name": "", "type": "address"},
                {"internalType": "uint256", "name": "", "type": "uint256"}
            ],
            "name": "AddCredit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    # Initialize contracts
    token_contract = w3.eth.contract(address=token_address, abi=token_abi)
    helper_contract = w3.eth.contract(address=contract_address, abi=helper_abi)

    # Check token balance
    balance = token_contract.functions.balanceOf(account.address).call()
    print(f'Current token balance: {balance}')

    if balance <= 0:
        print('Insufficient token balance. Aborting.')
        return

    approve_amount = 100 * 10**18
    amount = 75  # BOBA tokens

    try:
        # Build approval transaction
        approve_txn = token_contract.functions.approve(
            contract_address,
            approve_amount
        ).build_transaction({
            'from': account.address,
            'gas': 100000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(account.address),
        })

        # Estimate gas for approval
        try:
            estimated_gas = w3.eth.estimate_gas(approve_txn)
            print(f'Estimated gas for approval: {estimated_gas}')
            approve_txn['gas'] = estimated_gas

            # Estimate total cost for approval
            total_cost = estimated_gas * approve_txn['gasPrice']
            print(f'Estimated approval cost in ETH: {w3.from_wei(total_cost, "ether")}')

        except Exception as e:
            print(f'Approval gas estimation failed: {str(e)}')
            return

        signed_approve_txn = w3.eth.account.sign_transaction(approve_txn, private_key)
        approve_tx_hash = w3.eth.send_raw_transaction(signed_approve_txn.rawTransaction)

        approve_receipt = w3.eth.wait_for_transaction_receipt(approve_tx_hash)
        print(f'Approval transaction successful! Hash: {approve_tx_hash.hex()}')

        print("Waiting for approval to be processed...")
        import time
        time.sleep(5)

    except Exception as e:
        print(f'Approval transaction failed: {str(e)}')
        return

    try:
        transaction = helper_contract.functions.AddCredit(
            credits_receiver,
            amount
        ).build_transaction({
            'from': account.address,
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(account.address),
        })

        try:
            estimated_gas = w3.eth.estimate_gas(transaction)
            print(f'Estimated gas for AddCredit: {estimated_gas}')
            transaction['gas'] = estimated_gas

            # Estimate total cost
            total_cost = estimated_gas * transaction['gasPrice']
            print(f'Estimated AddCredit cost in ETH: {w3.from_wei(total_cost, "ether")}')

        except Exception as e:
            print(f'AddCredit gas estimation failed: {str(e)}')
            return

        signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f'AddCredit transaction successful! Hash: {tx_hash.hex()}')

    except Exception as e:
        print(f'Transaction failed: {str(e)}')

if __name__ == "__main__":
    run()
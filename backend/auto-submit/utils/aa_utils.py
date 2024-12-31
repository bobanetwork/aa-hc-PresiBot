# Some common functions for working with UserOperations and Transactions
import re
import sys
import time
import requests
from jsonrpcclient import request
from web3 import Web3
from eth_abi import abi as ethabi
import eth_account

"""
--- Outsource into shared usage or bundle within SDK
"""

# Provides some AA helper functions
class aa_utils:
    def __init__(self, _EP_addr, _chain_id):
        self.EP_addr = _EP_addr
        self.chain_id = _chain_id

    def sign_op(self, op, signer_key):
        """Signs a UserOperation, returning a modified op containing a 'signature' field."""
        pack1 = ethabi.encode(['address','uint256','bytes32','bytes32','uint256','uint256','uint256','uint256','uint256','bytes32'], \
              [op['sender'],
              Web3.to_int(hexstr=op['nonce']),
              Web3.keccak(hexstr=op['initCode']),
              Web3.keccak(hexstr=op['callData']),
              Web3.to_int(hexstr=op['callGasLimit']),
              Web3.to_int(hexstr=op['verificationGasLimit']),
              Web3.to_int(hexstr=op['preVerificationGas']),
              Web3.to_int(hexstr=op['maxFeePerGas']),
              Web3.to_int(hexstr=op['maxPriorityFeePerGas']),
              Web3.keccak(hexstr=op['paymasterAndData']),
              ])
        pack2 = ethabi.encode(['bytes32','address','uint256'], [Web3.keccak(pack1), self.EP_addr, self.chain_id])
        e_msg = eth_account.messages.encode_defunct(Web3.keccak(pack2))
        signer_acct = eth_account.account.Account.from_key(signer_key)
        sig = signer_acct.sign_message(e_msg)
        op['signature'] = Web3.to_hex(sig.signature)
        return op

    def sign_v7_op(self, user_op, signer_key):
        """Signs a v0.7 UserOperation, returning a modified op containing a 'signature' field."""
        op = dict(user_op)  # Create copy since we'll modify it

        if 'initCode' not in op:
            op['initCode'] = '0x'

        if 'paymasterAndData' not in op:
            op['paymasterAndData'] = '0x'

        # Pack verification and call gas limits into a single bytes32
        account_gas_limits = (
            ethabi.encode(['uint128'], [Web3.to_int(hexstr=op['verificationGasLimit'])])[16:32] +
            ethabi.encode(['uint128'], [Web3.to_int(hexstr=op['callGasLimit'])])[16:32]
        )

        # Pack max priority fee and max fee into a single bytes32
        gas_fees = (
            ethabi.encode(['uint128'], [Web3.to_int(hexstr=op['maxPriorityFeePerGas'])])[16:32] +
            ethabi.encode(['uint128'], [Web3.to_int(hexstr=op['maxFeePerGas'])])[16:32]
        )

        # Pack the message according to EIP-4337 v0.7 specification
        pack1 = ethabi.encode(
            ['address', 'uint256', 'bytes32', 'bytes32', 'bytes32', 'uint256', 'bytes32', 'bytes32'],
            [
                op['sender'],
                Web3.to_int(hexstr=op['nonce']),
                Web3.keccak(hexstr=op['initCode']),
                Web3.keccak(hexstr=op['callData']),
                Web3.to_bytes(hexstr=Web3.to_hex(account_gas_limits)),
                Web3.to_int(hexstr=op['preVerificationGas']),
                Web3.to_bytes(hexstr=Web3.to_hex(gas_fees)),
                Web3.keccak(hexstr=op['paymasterAndData'])
            ]
        )

        # Create the final message hash including EntryPoint and chainId
        pack2 = ethabi.encode(
            ['bytes32', 'address', 'uint256'],
            [Web3.keccak(pack1), self.EP_addr, self.chain_id]
        )

        # Sign the message
        e_msg = eth_account.messages.encode_defunct(Web3.keccak(pack2))
        signer_acct = eth_account.account.Account.from_key(signer_key)
        sig = signer_acct.sign_message(e_msg)

        user_op['signature'] = Web3.to_hex(sig.signature)

        return user_op

class aa_rpc(aa_utils):
    """Provides AA helper methods which talk to an ETH node and/or a Bundler"""
    def __init__(self, _EP_addr, _eth_rpc, _bundler_url):
        self.w3 = _eth_rpc
        self.bundler_url = _bundler_url
        aa_utils.__init__(self, _EP_addr, self.w3.eth.chain_id)

    def aa_nonce(self, addr, key):
        """Returns the keyed AA nonce for an address"""
        calldata = selector("getNonce(address,uint192)") + ethabi.encode(['address','uint192'],[addr, key])
        ret = self.w3.eth.call({'to':self.EP_addr,'data':calldata})
        return Web3.to_hex(ret)

    def build_op(self, sender, target, value, calldata, nonce_key=0):
        """Builds a UserOperation to call an account's Execute method, passing specified parameters."""

        # Note - currently Tip affects the preVerificationGas estimate due to
        # the mechanism for offsetting the L1 storage fee. If tip is too low
        # the required L2 gas can exceed the block gas limit.
        tip = max(self.w3.eth.max_priority_fee, Web3.to_wei(0.5, 'gwei'))
        base_fee = self.w3.eth.gas_price - self.w3.eth.max_priority_fee
        print("tip", tip, "base_fee", base_fee)
        assert base_fee > 0
        fee = max(self.w3.eth.gas_price, 2 * base_fee + tip)
        print("Using gas prices", fee, tip, "detected",
              self.w3.eth.gas_price, self.w3.eth.max_priority_fee)

        ex_calldata = selector("execute(address,uint256,bytes)") + \
            ethabi.encode(['address', 'uint256', 'bytes'],
                          [target, value, calldata])

        op = {
           'sender': sender,
           'nonce': self.aa_nonce(sender,nonce_key),
           'initCode': "0x",  # Add explicit initCode
           'callData': Web3.to_hex(ex_calldata),
           'callGasLimit': Web3.to_hex(100000),  # Start with reasonable default
           'verificationGasLimit': Web3.to_hex(100000),  # Start with reasonable default
           'preVerificationGas': Web3.to_hex(21000),  # Base cost
           #paymaster - none
           #paymasterVerificationGasLimit - none
           #paymasterPostOpGasLimit - none
           #paymasterData - none
           # Dummy signature, per Alchemy AA documentation
           'signature': '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c'
        }
        print("Built userOperation", op)
        return op

    def estimate_op_gas(self, op, extra_pvg=0, extra_vg=0, extra_cg=0):
        """Wrapper to call eth_estimateUserOperationGas() and update the op with v0.7 specific calculations.
           Allows limits to be increased in cases where a bundler is providing insufficient estimates.
           Returns success flag + new op"""

        # For EP v0.7 the paymasterAndData field should not be included in the RPC request
        est_op = dict(op)
        if 'paymasterAndData' in est_op:
            del est_op['paymasterAndData']

        print(est_op)
        est_params = [est_op, self.EP_addr]

        response = requests.post(
            self.bundler_url,
            json=request("eth_estimateUserOperationGas", params=est_params)
        )
        print("estimateGas response", response.json())

        if 'error' in response.json():
            print("*** eth_estimateUserOperationGas failed")
            time.sleep(2)
            return False, op

        est_result = response.json()['result']

        # Calculate verification gas limit with v0.7 specific overheads
        verification_gas = Web3.to_int(hexstr=est_result['verificationGasLimit'])

        # Add factory deployment overhead if initCode is present
        if op.get('initCode') and op['initCode'] != '0x':
            verification_gas += 200000  # Factory deployment overhead

            # Add init gas calculation
            init_code = op['initCode']
            init_code_addr = init_code[:42]  # First 20 bytes (address) as hex
            init_code_data = '0x' + init_code[42:]  # Rest is the calldata

            try:
                init_gas = self.w3.eth.estimate_gas({
                    'to': init_code_addr,
                    'data': init_code_data
                })
                verification_gas += init_gas
            except Exception as e:
                print("Warning: Failed to estimate init code gas", e)

        # Add EP 0.7's inner gas overhead
        verification_gas += 10000  # ENTRY_POINT_INNER_GAS_OVERHEAD

        # Calculate pre-verification gas with v0.7 specific overhead
        pre_verification_gas = Web3.to_int(hexstr=est_result['preVerificationGas'])

        # Add init code overhead to pre-verification gas
        if op.get('initCode') and op['initCode'] != '0x':
            init_code_len = (len(op['initCode']) - 2) // 2  # Convert hex string to bytes
            pre_verification_gas += init_code_len * 16  # 16 gas per byte for init code

        # Additional overhead for Sepolia network
        if self.chain_id == 11155111:  # Sepolia chain ID
            pre_verification_gas += 10000

        # Apply any extra gas parameters
        pre_verification_gas = pre_verification_gas + extra_pvg
        verification_gas = verification_gas + extra_vg
        call_gas = Web3.to_int(hexstr=est_result['callGasLimit']) + extra_cg

        # Update the operation with calculated values
        op['preVerificationGas'] = Web3.to_hex(pre_verification_gas)
        op['verificationGasLimit'] = Web3.to_hex(verification_gas)
        op['callGasLimit'] = Web3.to_hex(call_gas)

        print("Final gas values:")
        print(f"preVerificationGas: {op['preVerificationGas']}")
        print(f"verificationGasLimit: {op['verificationGasLimit']}")
        print(f"callGasLimit: {op['callGasLimit']}")

        return True, op

    def sign_submit_op(self, op, owner_key):
        """Sign and submit a UserOperation to the Bundler"""

        is_v7 = False
        if self.EP_addr == "0x0000000071727De22E5E9d8BAf0edAc6f37da032":
            is_v7 = True
        else:
            assert self.EP_addr == "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

        if is_v7:
            op = self.sign_v7_op(op, owner_key)
        else:
            op = self.sign_op(op, owner_key)

        while True:
            response = requests.post(self.bundler_url, json=request(
                "eth_sendUserOperation", params=[op, self.EP_addr]))
            if 'result' in response.json():
                break
            if 'error' in response.json():
                emsg = response.json()['error']['message']
                # Workaround for sending debug_traceCall to unsynced node
                if not re.search(r'message: block 0x.{64} not found', emsg):
                    break
            print("*** Retrying eth_sendUserOperation")
            time.sleep(5)

        print("sendOperation response", response.json())
        if 'error' in response.json():
            print("*** eth_sendUserOperation failed")
            sys.exit(1)

        op_hash = {}
        op_hash['hash'] = response.json()['result']
        timeout = True
        for _ in range(100):
            print("Waiting for receipt...")
            time.sleep(10)
            op_receipt = requests.post(self.bundler_url, json=request(
                "eth_getUserOperationReceipt", params=op_hash))
            op_receipt = op_receipt.json()['result']
            if op_receipt is not None:
                # print("op_receipt", op_receipt)
                assert op_receipt['receipt']['status'] == "0x1"
                print("operation success", op_receipt['success'],
                      "txHash=", op_receipt['receipt']['transactionHash'])
                timeout = False
                assert op_receipt['success']
                break
        if timeout:
            print("*** Previous operation timed out")
            sys.exit(1)
        return op_receipt

class eth_utils:
    """Provides some helper functions for EOA transactions and general utilities"""
    def __init__(self, _w3):
        self.w3 = _w3
        self.chain_id = self.w3.eth.chain_id

    def sign_and_submit(self, tx, key):
        """Wrapper to sign and submit an Eth transaction from an EOA (e.g. the deployer account)
           Will populate some fields automatically while allowing the original Tx to override."""
        if 'nonce' not in tx:
            tx['nonce'] = self.w3.eth.get_transaction_count(tx['from'])
        if 'chainId' not in tx:
            tx['chainId'] = self.chain_id
        est = self.w3.eth.estimate_gas(tx)
        if 'gas' not in tx or tx['gas'] < est:
            tx['gas'] = est
        if 'gasPrice' not in tx and 'maxFeePerGas' not in tx:
            tx['gasPrice'] = self.w3.eth.gas_price

        signed_txn = self.w3.eth.account.sign_transaction(tx, key)
        ret = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        rcpt = self.w3.eth.wait_for_transaction_receipt(ret)
        if rcpt.status != 1:
            print("Transaction failed, txhash =", Web3.to_hex(ret))
        assert rcpt.status == 1
        return rcpt

    def approve_token(self, token, spender, deploy_addr, deploy_key):
        """Perform an unlimited ERC20 token approval"""
        approve_calldata = selector("approve(address,uint256)") + ethabi.encode(
            ['address','uint256'],
            [spender, Web3.to_int(hexstr="0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")])

        tx = {
            'from': deploy_addr,
            'data': approve_calldata,
            'to': token,
        }
        print("ERC20 approval of", token, "for", spender)
        self.sign_and_submit(tx, deploy_key)

# Utility functions which don't need an RPC or Endpoint context

def selector(name):
    """Return a Solidity-style function selector, e.g. 0x1234abcd = keccak256("something(uint,bool")"""
    name_hash = Web3.to_hex(Web3.keccak(text=name))
    return Web3.to_bytes(hexstr=str(name_hash)[:10])
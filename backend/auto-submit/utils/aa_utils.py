# Some common functions for working with UserOperations and Transactions
import re
import sys
import time
import requests
from jsonrpcclient import request
from web3 import Web3
from eth_abi import abi as ethabi
import eth_account

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
        """Signs a UserOperation, returning a modified op containing a 'signature' field."""
        op = dict(user_op) # Derived fields are added to 'op' prior to hashing

        assert 'paymaster' not in op # not yet implemented

        # The deploy-local script supplies the packed values prior to signature, as it bypasses the bundler.
        # For normal UserOperations the fields are derived here
        if 'accountGasLimits' not in op:
            account_gas_limits  = ethabi.encode(['uint128'],[Web3.to_int(hexstr=op['verificationGasLimit'])])[16:32] \
                + ethabi.encode(['uint128'],[Web3.to_int(hexstr=op['callGasLimit'])])[16:32]
        else:
            account_gas_limits = Web3.to_bytes(hexstr=op['accountGasLimits'])

        if 'gasFees' not in op:
            gas_fees = ethabi.encode(['uint128'],[Web3.to_int(hexstr=op['maxPriorityFeePerGas'])])[16:32] \
                + ethabi.encode(['uint128'],[Web3.to_int(hexstr=op['maxFeePerGas'])])[16:32]
        else:
            gas_fees = Web3.to_bytes(hexstr=op['gasFees'])

        if 'paymasterAndData' not in op:
            op['paymasterAndData'] = "0x"

        pack1 = ethabi.encode(['address','uint256','bytes32','bytes32','bytes32','uint256','bytes32','bytes32'], \
              [op['sender'],
              Web3.to_int(hexstr=op['nonce']),
              Web3.keccak(hexstr="0x"), # initcode
              Web3.keccak(hexstr=op['callData']),
              account_gas_limits,
              Web3.to_int(hexstr=op['preVerificationGas']),
              gas_fees,
              Web3.keccak(hexstr=op['paymasterAndData']),
              ])
        pack2 = ethabi.encode(['bytes32','address','uint256'], [Web3.keccak(pack1), self.EP_addr, self.chain_id])
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
           #factory - none
           #factoryData - none
           'callData': Web3.to_hex(ex_calldata),
           'callGasLimit': "0x0",
           'verificationGasLimit': Web3.to_hex(0),
           'preVerificationGas': "0x0",
           'maxFeePerGas': Web3.to_hex(fee),
           'maxPriorityFeePerGas': Web3.to_hex(tip),
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
        """ Wrapper to call eth_estimateUserOperationGas() and update the op.
            Allows limits to be increased in cases where a bundler is
            providing insufficient estimates. Returns success flag + new op"""

        est_params = [op, self.EP_addr]

        response = requests.post(
            self.bundler_url, json=request("eth_estimateUserOperationGas", params=est_params))
        print("estimateGas response", response.json())

        if 'error' in response.json():
            print("*** eth_estimateUserOperationGas failed")
            time.sleep(2)
            return False, op

        est_result = response.json()['result']

        op['preVerificationGas'] = Web3.to_hex(Web3.to_int(
            hexstr=est_result['preVerificationGas']) + extra_pvg)
        op['verificationGasLimit'] = Web3.to_hex(Web3.to_int(
            hexstr=est_result['verificationGasLimit']) + extra_vg)
        op['callGasLimit'] = Web3.to_hex(Web3.to_int(
            hexstr=est_result['callGasLimit']) + extra_cg)
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
                if emsg == "replacement underpriced":
                    print("*** Retrying with increased maxPriorityFeePerGas")
                    op['maxPriorityFeePerGas'] += 1
                    time.sleep(5)
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
        for _ in range(500):
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
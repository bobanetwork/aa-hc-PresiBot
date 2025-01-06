from random import *
import json
import os
from dotenv import load_dotenv, find_dotenv
import sys
from web3 import Web3
import eth_account


"""
--- Outsource into shared usage or bundle within SDK
"""


load_dotenv(find_dotenv())

sys.path.append(".") # Workaround until aa_utils etc. can be packaged properly
from .aa_utils import *

EP_ADDR = os.environ['ENTRY_POINTS']
assert len(EP_ADDR) == 42
ep_addr = Web3.to_checksum_address(EP_ADDR)

BUNDLER_ADDR = os.environ['BUNDLER_ADDR']
assert len(BUNDLER_ADDR) == 42
bundler_addr = Web3.to_checksum_address(BUNDLER_ADDR)

bundler_rpc = os.environ['BUNDLER_RPC']
assert len(bundler_rpc) > 0

node_http = os.environ['NODE_HTTP']
assert len(node_http) > 0

HC_CHAIN = int(os.environ['CHAIN_ID'])
assert HC_CHAIN > 0

# Owner of the user account used to submit client requests
U_OWNER = os.environ['CLIENT_OWNER']
assert len(U_OWNER) == 42
u_addr = Web3.to_checksum_address(U_OWNER)

u_key = os.environ['CLIENT_PRIVKEY']
assert len(u_key) == 66

U_ACCT = os.environ['CLIENT_ADDR']
assert len(U_ACCT) == 42
u_account = Web3.to_checksum_address(U_ACCT)

# -------------------------------------------------------------

gasFees = {}
# Tracks gas between estimate and receipt; should refactor
gasFees['estGas'] = 0
gasFees['l2Fees'] = 0   # Cumulative L2 fees
gasFees['l1Fees'] = 0   # Cumulative L1 fees

w3 = Web3(Web3.HTTPProvider(node_http, request_kwargs={'timeout': 900}))
assert (w3.is_connected)

l2_util = eth_utils(w3)


def estimateOp(aa, p):
    global gasFees

    (success, p) = aa.estimate_op_gas(p)
    if not success:
        return False, p

    gasFees['estGas'] = Web3.to_int(hexstr=p['preVerificationGas']) \
        + Web3.to_int(hexstr=p['verificationGasLimit']) \
        + Web3.to_int(hexstr=p['callGasLimit'])
    return True, p

# ===============================================

# Generates an AA-style nonce (each key has its own associated sequence count)
nKey = int(1200 + (w3.eth.get_transaction_count(u_addr) % 7))
# nKey = 0
# print("nKey", nKey)

def ParseReceipt(opReceipt, logTopic=None):
    """Parses an operation receipt to extract gas information. Can optionally look
       for one specified log topic and return a matching entry. Sufficient for the
       current examples but not intended as a general solution."""
    global gasFees
    txRcpt = opReceipt['receipt']
    log_ret = None

    n = 0
    for i in txRcpt['logs']:
        print("log", n, i['topics'][0], i['data'])
        if logTopic and Web3.to_hex(logTopic) == i['topics'][0]:
            log_ret = (i['topics'], i['data'])
        n += 1
    print("Total tx gas stats:",
          "gasUsed", Web3.to_int(hexstr=txRcpt['gasUsed']),
          "effectiveGasPrice", Web3.to_int(hexstr=txRcpt['effectiveGasPrice']),
          "l1GasUsed", Web3.to_int(hexstr=txRcpt['l1GasUsed']),
          "l1Fee", Web3.to_int(hexstr=txRcpt['l1Fee']))
    opGas = Web3.to_int(hexstr=opReceipt['actualGasUsed'])
    print("opReceipt gas used", opGas, "unused", gasFees['estGas'] - opGas)

    egPrice = Web3.to_int(hexstr=txRcpt['effectiveGasPrice'])
    gasFees['l2Fees'] += Web3.to_int(hexstr=txRcpt['gasUsed']) * egPrice
    gasFees['l1Fees'] += Web3.to_int(hexstr=txRcpt['l1Fee'])

    return log_ret
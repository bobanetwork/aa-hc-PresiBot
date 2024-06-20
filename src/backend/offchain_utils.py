import os
from web3 import Web3
from eth_abi import abi as ethabi
import eth_account

HC_CHAIN = int(os.environ['CHAIN_ID'])
assert (HC_CHAIN != 0)

EP_ADDR = os.environ['ENTRY_POINT']
assert (len(EP_ADDR) == 42)
EntryPointAddr = Web3.to_checksum_address(EP_ADDR)

HH_ADDR = os.environ['HC_HELPER_ADDR']
assert (len(HH_ADDR) == 42)
HelperAddr = Web3.to_checksum_address(HH_ADDR)

HA_ADDR = os.environ['OC_HYBRID_ACCOUNT']
assert (len(HA_ADDR) == 42)
HybridAcctAddr = Web3.to_checksum_address(HA_ADDR)

HA_OWNER = os.environ['OC_OWNER']
assert (len(HA_OWNER) == 42)
hc1_addr = Web3.to_checksum_address(HA_OWNER)

hc1_key = os.environ['OC_PRIVKEY']
assert (len(hc1_key) == 66)


def selector(name):
    nameHash = Web3.to_hex(Web3.keccak(text=name))
    return nameHash[2:10]


def gen_response(req, err_code, resp_payload):
    resp2 = ethabi.encode(['address', 'uint256', 'uint32', 'bytes'], [
                          req['srcAddr'], req['srcNonce'], err_code, resp_payload])
    enc1 = ethabi.encode(['bytes32', 'bytes'], [req['skey'], resp2])
    p_enc1 = "0x" + selector("PutResponse(bytes32,bytes)") + \
        Web3.to_hex(enc1)[2:]  # dfc98ae8

    enc2 = ethabi.encode(['address', 'uint256', 'bytes'], [
                         Web3.to_checksum_address(HelperAddr), 0, Web3.to_bytes(hexstr=p_enc1)])
    p_enc2 = "0x" + selector("execute(address,uint256,bytes)") + \
        Web3.to_hex(enc2)[2:]  # b61d27f6

    limits = {
        'verificationGasLimit': "0x10000",
        'preVerificationGas': "0x10000",
    }
    callGas = 705*len(resp_payload) + 170000

    print("callGas calculation", len(resp_payload), 4+len(enc2), callGas)
    p = ethabi.encode([
        'address',
        'uint256',
        'bytes32',
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes32',
    ], [
        HybridAcctAddr,
        req['opNonce'],
        Web3.keccak(Web3.to_bytes(hexstr='0x')),  # initCode
        Web3.keccak(Web3.to_bytes(hexstr=p_enc2)),
        callGas,
        Web3.to_int(hexstr=limits['verificationGasLimit']),
        Web3.to_int(hexstr=limits['preVerificationGas']),
        0,  # maxFeePerGas
        0,  # maxPriorityFeePerGas
        Web3.keccak(Web3.to_bytes(hexstr='0x')),  # paymasterANdData
    ])
    ooHash = Web3.keccak(ethabi.encode(['bytes32', 'address', 'uint256'], [
                         Web3.keccak(p), EntryPointAddr, HC_CHAIN]))
    signAcct = eth_account.account.Account.from_key(hc1_key)
    eMsg = eth_account.messages.encode_defunct(ooHash)
    sig = signAcct.sign_message(eMsg)

    success = (err_code == 0)
    print("Method returning success={} response={} signature={}".format(
        success, Web3.to_hex(resp_payload), Web3.to_hex(sig.signature)))
    return ({
        "success": success,
        "response": Web3.to_hex(resp_payload),
        "signature": Web3.to_hex(sig.signature)
    })

    return response


def parse_req(sk, src_addr, src_nonce, oo_nonce, payload):
    req = dict()
    req['skey'] = Web3.to_bytes(hexstr=sk)
    req['srcAddr'] = Web3.to_checksum_address(src_addr)
    req['srcNonce'] = Web3.to_int(hexstr=src_nonce)
    req['opNonce'] = Web3.to_int(hexstr=oo_nonce)
    req['reqBytes'] = Web3.to_bytes(hexstr=payload)
    return req

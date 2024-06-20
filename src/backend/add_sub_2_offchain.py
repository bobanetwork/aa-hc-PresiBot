from web3 import Web3
from eth_abi import abi as ethabi
from offchain_utils import gen_response, parse_req


def offchain_addsub2(ver, sk, src_addr, src_nonce, oo_nonce, payload, *args):
    print("  -> offchain_addsub2 handler called with ver={} subkey={} src_addr={} src_nonce={} oo_nonce={} payload={} extra_args={}".format(
        ver, sk, src_addr, src_nonce, oo_nonce, payload, args))
    err_code = 1
    resp = Web3.to_bytes(text="unknown error")
    assert(ver == "0.2")

    try:
        req = parse_req(sk, src_addr, src_nonce, oo_nonce, payload)
        dec = ethabi.decode(['uint32', 'uint32'], req['reqBytes'])

        if dec[0] >= dec[1]:
            s = dec[0] + dec[1]
            d = dec[0] - dec[1]
            resp = ethabi.encode(['uint256', 'uint256'], [s, d])
            err_code = 0
        else:
            print("offchain_addsub2 underflow error", dec[0], dec[1])
            resp = Web3.to_bytes(text="underflow error")
    except Exception as e:
        print("DECODE FAILED", e)

    return gen_response(req, err_code, resp)
from eth_abi import abi as ethabi
from utils.userop_utils import *

def run():
    print("Calling: SubmitResults")

    # Contract
    ENTRY_POINT = Web3.to_checksum_address(os.environ['ENTRY_POINTS'])
    CONTRACT = Web3.to_checksum_address(os.environ['PRE_SIM_TOKEN_ADDR'])
    USER_ACCOUNT = Web3.to_checksum_address(os.environ['CLIENT_ADDR'])

    # Configuration
    aa = aa_rpc(ENTRY_POINT, w3, bundler_rpc)
    calldata = selector("submitResults()")
    op = aa.build_op(USER_ACCOUNT, CONTRACT, 0, calldata, nKey)

    # Estimation
    (success, op) = estimateOp(aa, op)
    if not success:
        print("Gas estimation failed")
        return

    rcpt = aa.sign_submit_op(op, u_key)
run()
from eth_abi import abi as ethabi
from utils.userop_utils import *

def run():
    print("getDailyQuestion()")

    # Contract setup
    ENTRY_POINT = Web3.to_checksum_address(os.environ['ENTRY_POINTS'])
    CONTRACT = Web3.to_checksum_address(os.environ['PRE_SIM_TOKEN_ADDR'])
    USER_ACCOUNT = Web3.to_checksum_address(os.environ['CLIENT_ADDR'])

    aa = aa_rpc(ENTRY_POINT, w3, bundler_rpc)

    # Build basic operation
    calldata = selector("getDailyQuestion()")
    op = aa.build_op(USER_ACCOUNT, CONTRACT, 0, calldata, nKey)

    print("-")
    op['callGasLimit'] = Web3.to_hex(200000)
    op['verificationGasLimit'] = Web3.to_hex(500000)
    op['preVerificationGas'] = Web3.to_hex(100000)

    print("Final OP is: ", op)
    # Estimate gas
#     (success, op) = estimateOp(aa, op)
#     if not success:
#         print("Gas estimation failed")
#         return

    # Submit if everything looks good
    rcpt = aa.sign_submit_op(op, u_key)
    ParseReceipt(rcpt)

run()
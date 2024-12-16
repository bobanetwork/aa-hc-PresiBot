from eth_abi import abi as ethabi
from utils.userop_utils import *

def run():
    print("Calling: SubmitResults")

    # Contract
    ENTRY_POINT = Web3.to_checksum_address(os.environ['ENTRY_POINTS'])
    CONTRACT = Web3.to_checksum_address(os.environ['PRE_SIM_TOKEN_ADDR'])
    USER_ACCOUNT = Web3.to_checksum_address(os.environ['CLIENT_ADDR'])

    print(f"CONTRACT: {CONTRACT}")
    print(f"ENTRY_POINT:: {CONTRACT}")
    print(f"USER ACCOUNT: {USER_ACCOUNT}")

    # The user account
    aa = aa_rpc(ENTRY_POINT, w3, bundler_rpc)

    # Just the inner calldata for submitResults()
    calldata = selector("submitResults()")
    print(f"Inner calldata: {Web3.to_hex(calldata)}")

    # build_op will wrap this in execute() call
    op = aa.build_op(USER_ACCOUNT, CONTRACT, 0, calldata, nKey)

    if 'initCode' not in op:
        op['initCode'] = '0x'
#     if 'paymasterAndData' not in op:
#         op['paymasterAndData'] = '0x'

    print("Operation before estimation:", op)

    (success, op) = estimateOp(aa, op)
    if not success:
        print("Gas estimation failed")
        return

    print("Operation after estimation:", op)

    rcpt = aa.sign_submit_op(op, u_key)

    print(rcpt)
run()
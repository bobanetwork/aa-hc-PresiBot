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

    # Set manual gas prices (in wei)
    base_fee = w3.eth.gas_price
    priority_fee = Web3.to_wei(0.1, 'gwei')  # 0.1 gwei priority fee
    max_fee = base_fee + priority_fee

    # Set v0.7 specific fields and gas limits
    op['initCode'] = '0x'
    op['paymasterAndData'] = '0x'
    op['callGasLimit'] = Web3.to_hex(200000)
    op['verificationGasLimit'] = Web3.to_hex(500000)
    op['preVerificationGas'] = Web3.to_hex(100000)

    # Add required gas fee fields with manual values
    op['maxFeePerGas'] = Web3.to_hex(max_fee)
    op['maxPriorityFeePerGas'] = Web3.to_hex(priority_fee)

    print(f"Using gas prices - Base Fee: {base_fee}, Priority Fee: {priority_fee}, Max Fee: {max_fee}")

    # Debug the operation before estimation
    print("\nDebugging UserOperation before estimation:")
    debug_aa_userop(op, ENTRY_POINT, HC_CHAIN)

    # Estimate gas
    (success, op) = estimateOp(aa, op)
    if not success:
        print("Gas estimation failed")
        return

    # Debug after estimation
    print("\nDebugging UserOperation after estimation:")
    debug_aa_userop(op, ENTRY_POINT, HC_CHAIN)

    # Submit if everything looks good
    rcpt = aa.sign_submit_op(op, u_key)
    print(rcpt)


def debug_aa_userop(user_op, entrypoint_address, chain_id):
    """
    Comprehensive debugger for Account Abstraction UserOperations with special handling for v0.7

    Args:
        user_op (dict): The UserOperation to debug
        entrypoint_address (str): The EntryPoint contract address
        chain_id (int): The chain ID
    """
    print("\n=== UserOperation Debug Analysis ===")

    # 1. Basic Structure Validation
    required_fields = [
        'sender', 'nonce', 'initCode', 'callData',
        'callGasLimit', 'verificationGasLimit', 'preVerificationGas',
        'maxFeePerGas', 'maxPriorityFeePerGas', 'signature'
    ]

    print("\nChecking required fields...")
    for field in required_fields:
        if field not in user_op:
            print(f"❌ Missing required field: {field}")
            return False
        print(f"✓ Found {field}")

    # 2. Validate Addresses
    print("\nValidating addresses...")
    try:
        sender = Web3.to_checksum_address(user_op['sender'])
        ep_address = Web3.to_checksum_address(entrypoint_address)
        print(f"✓ Sender address: {sender}")
        print(f"✓ EntryPoint address: {ep_address}")
    except Exception as e:
        print(f"❌ Invalid address format: {e}")
        return False

    # 3. CallData Analysis
    print("\nAnalyzing callData...")
    try:
        call_data = user_op['callData']
        if len(call_data) < 10:
            print("❌ callData too short")
            return False

        # Validate execute selector
        execute_selector = call_data[:10]
        expected_selector = '0xb61d27f6'  # execute(address,uint256,bytes)

        if execute_selector != expected_selector:
            print(f"❌ Invalid execute selector: got {execute_selector}, expected {expected_selector}")
            return False

        # Decode execute parameters
        decoded = ethabi.decode(
            ['address', 'uint256', 'bytes'],
            bytes.fromhex(call_data[10:])
        )
        print("✓ Execute parameters decoded:")
        print(f"  Target: {decoded[0]}")
        print(f"  Value: {decoded[1]}")
        print(f"  Function call: {decoded[2][:4].hex()}")

        # Decode the inner function call if possible
        inner_selector = decoded[2][:4].hex()
        print(f"  Inner function selector: 0x{inner_selector}")

    except Exception as e:
        print(f"❌ CallData analysis failed: {e}")
        return False

    # 4. Gas Analysis
    print("\nAnalyzing gas parameters...")
    try:
        pvg = int(user_op['preVerificationGas'], 16)
        vgl = int(user_op['verificationGasLimit'], 16)
        cgl = int(user_op['callGasLimit'], 16)

        print(f"PreVerificationGas: {pvg}")
        print(f"VerificationGasLimit: {vgl}")
        print(f"CallGasLimit: {cgl}")

        # Check if using v0.7 EntryPoint
        is_v7 = entrypoint_address.lower() == "0x0000000071727de22e5e9d8baf0edac6f37da032"

        if is_v7:
            print("\nEntryPoint v0.7 specific checks:")

            # Check paymasterAndData
            if 'paymasterAndData' not in user_op:
                print("⚠️ Missing paymasterAndData (should be '0x' if not used)")
            elif user_op['paymasterAndData'] != '0x':
                print(f"ℹ️ Using paymaster: {user_op['paymasterAndData'][:42]}")

            # Calculate v0.7 overheads
            base_verification = vgl
            factory_overhead = 200000 if (user_op.get('initCode') and user_op['initCode'] != '0x') else 0
            inner_overhead = 10000  # v0.7 specific

            total_verification = base_verification + factory_overhead + inner_overhead
            print(f"Calculated v0.7 verification gas: {total_verification}")
            print(f"  Base verification: {base_verification}")
            print(f"  Factory overhead: {factory_overhead}")
            print(f"  Inner overhead: {inner_overhead}")

            # Check for common v0.7 gotchas
            if pvg < 21000:
                print("⚠️ PreVerificationGas may be too low (min 21000)")
            if base_verification < 40000:
                print("⚠️ Base verification gas may be too low (min 40000)")
            if cgl < 40000:
                print("⚠️ CallGasLimit may be too low for complex operations")

    except ValueError as e:
        print(f"❌ Gas analysis failed: {e}")
        return False

    print("\n✓ UserOperation appears valid!")
    return True

run()
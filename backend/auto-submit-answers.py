import os
import json
from web3 import Web3
from eth_account import Account
from dotenv import load_dotenv
from langchain import OpenAI, ConversationChain
import time

# Load .env file
load_dotenv()

# Get config from environment variables
RPC_URL = "https://boba-sepolia.gateway.tenderly.co"
CONTRACT_ADDRESS = os.getenv('PRE_SIM_TOKEN_ADDR')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Get submitter private keys
SUBMITTER_PKS = [
    os.getenv('SUBMITTER_PK1'),
    os.getenv('SUBMITTER_PK2'),
    os.getenv('SUBMITTER_PK3')
]

# Initialize OpenAI with LangChain
llm = OpenAI(
    temperature=0.7,
    openai_api_key=OPENAI_API_KEY,
    max_tokens=100
)

conversation = ConversationChain(llm=llm, verbose=True)

# Complete contract ABI
CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "getCurrentQuesiton",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "answer", "type": "string"}],
        "name": "submitByPlayer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "currentGameID",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "address", "name": "", "type": "address"}
        ],
        "name": "hasPlayed",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def has_already_played(web3, contract, address):
    """Check if an address has already played in the current game"""
    try:
        current_game_id = contract.functions.currentGameID().call()
        has_played = contract.functions.hasPlayed(current_game_id, address).call()
        return has_played
    except Exception as e:
        print(f"Error checking if address has played: {str(e)}")
        return True  # Return True to be safe

def get_langchain_answers(question):
    """Get three concise answers in a single API call"""
    prompt_template = """
    Question: {question}

    Provide exactly 3 different answers to this question. Each answer must be 2-3 sentences maximum.
    Format your response exactly like this:
    1:
    2:
    3:

    Keep each answer unique and concise."""

    try:
        response = conversation.predict(input=prompt_template.format(question=question))
        answers = []
        current_answer = ""

        for line in response.split('\n'):
            if line.strip().startswith(('1:', '2:', '3:')):
                if current_answer:
                    answers.append(current_answer.strip())
                current_answer = line.strip()[2:].strip()
            elif line.strip() and current_answer:
                current_answer += " " + line.strip()

        if current_answer:
            answers.append(current_answer.strip())

        while len(answers) < 3:
            answers.append("No answer provided.")

        return answers[:3]

    except Exception as e:
        print(f"Error getting answers: {str(e)}")
        return ["Error occurred."] * 3

def submit_answer(web3, contract, private_key, answer):
    """Submit an answer to the contract with proper gas estimation"""
    try:
        account = Account.from_key(private_key)
        print(f"\nChecking if address has already played: {account.address}")

        if has_already_played(web3, contract, account.address):
            print(f"Address {account.address} has already played today. Skipping...")
            return False

        print(f"Submitting answer from address: {account.address}")

        # Get the latest nonce
        nonce = web3.eth.get_transaction_count(account.address)
        time.sleep(2)

        try:
            # Estimate gas
            gas_estimate = contract.functions.submitByPlayer(answer).estimate_gas({
                'from': account.address,
                'nonce': nonce
            })
        except Exception as gas_err:
            error_str = str(gas_err)
            if "already played today" in error_str.lower():
                print(f"Address {account.address} has already played today. Skipping...")
                return False
            print(f"Gas estimation failed: {error_str}")
            gas_estimate = 300000  # Safe default

        # Add 50% buffer to gas estimate
        gas_limit = int(gas_estimate * 1.5)
        print(f"Estimated gas: {gas_estimate}, Using gas limit: {gas_limit}")

        # Build transaction with type 2 (EIP-1559) parameters
        transaction = contract.functions.submitByPlayer(answer).build_transaction({
            'type': '0x2',  # EIP-1559
            'from': account.address,
            'nonce': nonce,
            'gas': gas_limit,
            'maxFeePerGas': web3.eth.max_priority_fee,
            'maxPriorityFeePerGas': web3.eth.max_priority_fee
        })

        # Sign and send transaction
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)

        # Wait for transaction receipt with longer timeout
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        print(f"Transaction successful! Hash: {receipt['transactionHash'].hex()}")
        print(f"Gas used: {receipt['gasUsed']}")

        time.sleep(5)
        return True

    except Exception as e:
        print(f"Error submitting answer: {str(e)}")
        return False

def main():
    try:
        # Initialize Web3 and contract
        web3 = Web3(Web3.HTTPProvider(RPC_URL))
        contract = web3.eth.contract(
            address=Web3.to_checksum_address(CONTRACT_ADDRESS),
            abi=CONTRACT_ABI
        )

        # Get current question
        question = contract.functions.getCurrentQuesiton().call()
        print(f"\nCurrent question from contract: {question}")

        # Get answers from OpenAI
        print("\nGetting answers from OpenAI...")
        answers = get_langchain_answers(question)

        # Submit all answers
        print("\nSubmitting answers...")
        successful_submissions = 0
        for i, (answer, private_key) in enumerate(zip(answers, SUBMITTER_PKS), 1):
            print(f"\nAnswer {i}:")
            print("-" * 50)
            print(answer)
            print("-" * 50)

            # Submit answer to contract
            if submit_answer(web3, contract, private_key, answer):
                print(f"Successfully submitted answer {i}")
                successful_submissions += 1
            else:
                print(f"Skipped or failed to submit answer {i}")

            # Wait between submissions
            if i < len(SUBMITTER_PKS):
                time.sleep(10)

        print(f"\nExecution complete. {successful_submissions} out of 3 answers submitted successfully.")
        return answers

    except Exception as e:
        print(f"Error in main execution: {str(e)}")
        return []

if __name__ == "__main__":
    main()
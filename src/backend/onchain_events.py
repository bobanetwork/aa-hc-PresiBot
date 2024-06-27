import os
from web3 import Web3

PreSimToken_abi = [
  {
    "anonymous": False,
    "inputs": [
      {
        "indexed": True,
        "internalType": "uint256",
        "name": "gameID",
        "type": "uint256"
      },
      {
        "indexed": False,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": False,
        "internalType": "string",
        "name": "answer",
        "type": "string"
      }
    ],
    "name": "PlayerSubmittedAnswer",
    "type": "event"
  },
    {
    "inputs": [],
    "name": "currentGameID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentQuestion",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
]

PRE_SIM_TOKEN_ADDR = os.environ['PRE_SIM_TOKEN_ADDR']
assert (len(PRE_SIM_TOKEN_ADDR) == 42)
print("PRE_SIM_TOKEN_ADDR: ", PRE_SIM_TOKEN_ADDR)
PreSimTokenAddr = Web3.to_checksum_address(PRE_SIM_TOKEN_ADDR)

rpc_url = os.environ['RPC_URL']
print("RPC_URL: ", rpc_url)

try:
  starting_block = os.environ['STARTING_BLOCK']
except:
  starting_block = 6912609
starting_block = int(starting_block)

def get_current_round_question():
  web3 = Web3(Web3.HTTPProvider(rpc_url))
  contract = web3.eth.contract(address=PreSimTokenAddr, abi=PreSimToken_abi)
  current_question = contract.functions.currentQuestion().call()
  print("Current question:", current_question)
  return current_question

def get_current_round_answers():
  web3 = Web3(Web3.HTTPProvider(rpc_url))
  contract = web3.eth.contract(address=PreSimTokenAddr, abi=PreSimToken_abi)
  current_round = contract.functions.currentGameID().call()
  print("Current round:", current_round)
  event_filter = contract.events.PlayerSubmittedAnswer.get_logs(
    fromBlock=starting_block,
    toBlock='latest',
    argument_filters={"gameID": current_round}
  )
  answers = []
  for event in event_filter:
    answers.append(event['args'])
  return answers
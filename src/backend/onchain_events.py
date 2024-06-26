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
]

PRE_SIM_TOKEN_ADDR = os.environ['PRE_SIM_TOKEN_ADDR']
assert (len(PRE_SIM_TOKEN_ADDR) == 42)
PreSimTokenAddr = Web3.to_checksum_address(PRE_SIM_TOKEN_ADDR)

rpc_url = os.environ['RPC_URL']

starting_block = os.environ['STARTING_BLOCK']
if starting_block == "":
  starting_block = 6912609
starting_block = int(starting_block)


def get_answers(game_round):
  web3 = Web3(Web3.HTTPProvider(rpc_url))
  contract = web3.eth.contract(address=PreSimTokenAddr, abi=PreSimToken_abi)
  event_filter = contract.events.PlayerSubmittedAnswer.createFilter(
    fromBlock=starting_block,
    toBlock='latest',
    argument_filters={"gameID": game_round}
  )
  return event_filter.get_all_entries()
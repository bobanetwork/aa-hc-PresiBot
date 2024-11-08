from web3 import Web3
from openai_offchain import openai_create_question
from openai_offchain import select_best_answer
from hybrid_compute_sdk import HybridComputeSDK
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def server_loop():
    # new sdk instance
    sdk = HybridComputeSDK()
    # prepare the server
    sdk.create_json_rpc_server_instance()
    # add a custom server action
    sdk.add_server_action("createQuestion()", openai_create_question)
    # add another server action
    sdk.add_server_action("selectBestAnswer()", select_best_answer)
    # start server
    sdk.serve_forever()

server_loop()

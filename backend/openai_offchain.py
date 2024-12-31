from web3 import Web3
from eth_abi import abi as ethabi
import eth_account
from langchain import OpenAI, ConversationChain
from onchain_events import get_current_round_question, get_current_round_answers
from hybrid_compute_sdk import HybridComputeSDK

# Initialize the OpenAI model
openai_model = OpenAI(model_name="gpt-4o")

daily_question = {}

sdk = HybridComputeSDK()

def openai_create_question(ver, sk, src_addr, src_nonce, oo_nonce, payload, *args):
    print("OpenAI create_question")
    print("  -> offchain_openai handler called with ver={} subkey={} src_addr={} src_nonce={} oo_nonce={} payload={} extra_args={}".format(
        ver, sk, src_addr, src_nonce, oo_nonce, payload, args))
    err_code = 1
    resp = Web3.to_bytes(text="unknown error")

#     assert(ver == "0.2") todo check if this is done somewhere else

    print("creating template...")

    # Define the prompt for the chatbot
    prompt_template = """
    You are PresiBot, an intelligent assistant designed to simulate the role of the US President. Your task is to generate a single, thought-provoking question based on current political and economic scenarios.

    Consider the following background information:
    - Inflation in the US has recently decreased to 3.x%.
    - Student loans are getting remitted.
    - BRICS countries are buying significant amounts of gold and reducing their reliance on the US Dollar for trade.
    - The Moscow exchange has stopped trading the US Dollar.

    Generate a single, clear, and simple question that requires users to consider economic viability, short- and long-term consequences, political stability, and population popularity. The question should be easy for a general audience to understand.

    Your response should be only the question.
    """

    try:
      print("Trying to call sdk.parse_req")
      req = sdk.parse_req(sk, src_addr, src_nonce, oo_nonce, payload)

      print("Checking if current question already has been created..")
      current_question = get_current_round_question()
      print("Current question")
      if current_question in daily_question:
        print("Daily question already generated", daily_question[current_question])
        resp = ethabi.encode(["string"], [daily_question[current_question]])
        err_code = 0
        return gen_response(req, err_code, resp)

      # Prepare the prompt
      prompt = prompt_template

      # Create the conversation chain
      conversation = ConversationChain(llm=openai_model, verbose=True)

      # Generate a response from the model
      response = conversation.run(input=prompt)
      print("Open AI daily question:", response)
      daily_question[current_question] = response
      print("Preparing response")
      resp = ethabi.encode(["string"], [response])
      print("setting resp to: ", resp)
      err_code = 0
      print("Err: ", err_code)
    except Exception as e:
        print("DECODE FAILED", e)

    print("Finishing with gen_response...")
    return gen_response(req, err_code, resp)

def gen_response(self, req, err_code, resp_payload):
    print("gen_response called")
    resp2 = ethabi.encode(['address', 'uint256', 'uint32', 'bytes'], [req['srcAddr'], req['srcNonce'], err_code, resp_payload])
    print(resp2)
    p_enc1 = self.selector_hex("PutResponse(bytes32,bytes)") + \
        ethabi.encode(['bytes32', 'bytes'], [req['skey'], resp2])
    print(p_enc1)
    p_enc2 = self.selector_hex("execute(address,uint256,bytes)") + \
        ethabi.encode(['address', 'uint256', 'bytes'], [
            Web3.to_checksum_address(self.HelperAddr), 0, p_enc1])
    print(p_enc2)
    limits = {
        'verificationGasLimit': "0x10000",
        'preVerificationGas': "0x10000",
    }

    call_gas = 705*len(resp_payload) + 170000

    print(limits)

    print("call_gas calculation", len(resp_payload), 4+len(p_enc2), call_gas)
    account_gas_limits = \
        ethabi.encode(['uint128'],[Web3.to_int(hexstr=limits['verificationGasLimit'])])[16:32] + \
        ethabi.encode(['uint128'],[call_gas])[16:32]

    gas_fees = Web3.to_bytes(
        hexstr="0x0000000000000000000000000000000000000000000000000000000000000000"
    )

    packed = ethabi.encode([
        'address',
        'uint256',
        'bytes32',
        'bytes32',
        'bytes32',
        'uint256',
        'bytes32',
#         'bytes32',
    ], [
        self.HybridAcctAddr,
        req['opNonce'],
        Web3.keccak(Web3.to_bytes(hexstr='0x')),  # initCode
        Web3.keccak(p_enc2),
        account_gas_limits,
        Web3.to_int(hexstr=limits['preVerificationGas']),
        gas_fees,
#         Web3.keccak(Web3.to_bytes(hexstr='0x')), # paymasterAndData
    ])
    oo_hash = Web3.keccak(ethabi.encode(['bytes32', 'address', 'uint256'], [
                         Web3.keccak(packed), self.EntryPointAddr, self.HC_CHAIN]))
    signer_acct = eth_account.account.Account.from_key(self.hc1_key)
    e_msg = eth_account.messages.encode_defunct(oo_hash)
    sig = signer_acct.sign_message(e_msg)

    success = (err_code == 0)

    print(success)

    return ({
        "success": success,
        "response": Web3.to_hex(resp_payload),
        "signature": Web3.to_hex(sig.signature)
    })

def select_best_answer(ver, sk, src_addr, src_nonce, oo_nonce, payload, *args):
    print("OpenAI select_best_answer")
    print("  -> offchain_openai handler called with ver={} subkey={} src_addr={} src_nonce={} oo_nonce={} payload={} extra_args={}".format(
        ver, sk, src_addr, src_nonce, oo_nonce, payload, args))
    err_code = 1
    resp = Web3.to_bytes(text="unknown error")
    assert(ver == "0.2")

    # Define the prompt for the chatbot
    prompt_template = """
      You are an intelligent assistant designed to evaluate responses based on their quality. You are given a list of answers to a specific question. Your task is to determine which answer is the best based on economic viability, short- and long-term consequences, political stability, and population popularity.

      Consider the following answers and provide the index of the best answer (starting from 0):

      Question: {question}

      Answers:
      {answers}

      Must provide only the index of the best answer no matter of what.
    """

    try:
      print("trying to parse best answer...")
      req = sdk.parse_req(sk, src_addr, src_nonce, oo_nonce, payload)

      current_question = get_current_round_question()
      print("current question", current_question)
      current_round_answers = get_current_round_answers()
      print("current round answers: ", current_round_answers)

      if len(current_round_answers) == 0:
        print("No answers found for the current round")
        return sdk.gen_response(req, 1, Web3.to_bytes(text="No answers found for the current round"))

      answers_list = []
      for i in range(len(current_round_answers)):
        answers_list.append(current_round_answers[i]['answer'])

      print("current question: {} and answers: {}".format(current_question, answers_list))

      # Format the answers as a list string
      answers_list = "\n".join([f"{i}. {answer}" for i, answer in enumerate(answers_list)])

      # Prepare the prompt
      prompt = prompt_template.format(question=current_question, answers=answers_list)
      # Create the conversation chain
      conversation = ConversationChain(llm=openai_model, verbose=True)
      # Generate the index of the best answer from the model
      best_answer_index = conversation.run(input=prompt)
      print("best_answer_index", best_answer_index)
      index = best_answer_index.strip()
      # If not a digit, set to 0, otherwise keep as is
      if not index.isdigit():
        index = "0"
        print("Index is", index)
        print("Daily Question {} - Best Answer {}".format(current_question, current_round_answers[int(index)]))

      resp = ethabi.encode(["address"], [current_round_answers[int(index)]['player']])
      print("Built response", resp, "player", current_round_answers[int(index)]['player'])
      err_code = 0
    except Exception as e:
        err_code = 1
        print("DECODE FAILED", e)

    return sdk.gen_response(req, err_code, resp)
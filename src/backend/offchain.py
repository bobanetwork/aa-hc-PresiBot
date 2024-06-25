from jsonrpclib.SimpleJSONRPCServer import SimpleJSONRPCServer, SimpleJSONRPCRequestHandler
from web3 import Web3

# import function here
from openai_offchain import openai_create_question, select_best_answer

def selector(name):
    nameHash = Web3.to_hex(Web3.keccak(text=name))
    print("name: ", name, "nameHash: ", nameHash[2:10])
    return nameHash[2:10]

class RequestHandler(SimpleJSONRPCRequestHandler):
    rpc_paths = ('/', '/hc')

def server_loop():
    server = SimpleJSONRPCServer(('0.0.0.0', 1234), requestHandler=RequestHandler)
    # register function here
    server.register_function(openai_create_question, selector("createQuestion()"))
    server.register_function(select_best_answer, selector("selectBestAnswer()"))
    print("Serving ")
    print("PORT => {}".format(1234))
    server.serve_forever()

server_loop()  # Run until killed
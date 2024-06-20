import os
from web3 import Web3
from jsonrpclib.SimpleJSONRPCServer import SimpleJSONRPCServer, SimpleJSONRPCRequestHandler
# example
from add_sub_2_offchain import offchain_addsub2

def selector(name):
    nameHash = Web3.to_hex(Web3.keccak(text=name))
    return nameHash[2:10]

class RequestHandler(SimpleJSONRPCRequestHandler):
    rpc_paths = ('/', '/hc')

def server_loop():
    server = SimpleJSONRPCServer(('0.0.0.0', 1234), requestHandler=RequestHandler)
    server.register_function(offchain_addsub2, selector("addsub2(uint32,uint32)"))
    print("Serving ")
    print("PORT => {}".format(1234))
    server.serve_forever()

server_loop()  # Run until killed

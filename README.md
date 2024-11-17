# Developer Documentation

# Deployment
> Boba Sepolia Frontend \
> https://boba-blockchain-busters-frontend.onrender.com/

> Boba Sepolia Backend \
> https://boba-blockchain-busters.onrender.com

## Introduction
Welcome to the developer documentation for implementing a basic example with our system and API. This guide will walk you through the necessary steps to get started and provide you with the information you need to successfully integrate our system into your project.

## Prerequisites
Before you begin, make sure you have the following prerequisites in place:
- [ ] API key: Obtain an API key from our system by following the instructions provided in the [API Key Documentation](link-to-api-key-docs).
- [ ] Development environment: Set up your development environment with the necessary tools and dependencies.

## Step 1: Writing the offchain handler
The first step is to write our offchain handler. This handler is responsible for receiving requests from the bundler along with their payloads and returning the appropriate responses.

Let's begin with a simple example where the handler receives two numbers. It will perform both addition and subtraction on these numbers. If the result of the subtraction results in an underflow (i.e., the first number is greater than the second), the handler will respond with an underflow error.

```python
from web3 import Web3
from eth_abi import abi as ethabi
from offchain_utils import gen_response, parse_req


def offchain_addsub2(sk, src_addr, src_nonce, oo_nonce, payload, *args):
    print("  -> offchain_addsub2 handler called with subkey={} src_addr={} src_nonce={} oo_nonce={} payload={} extra_args={}".format(sk,
          src_addr, src_nonce, oo_nonce, payload, args))
    err_code = 1
    resp = Web3.to_bytes(text="unknown error")

    try:
        req = parse_req(sk, src_addr, src_nonce, oo_nonce, payload)
        dec = ethabi.decode(['uint32', 'uint32'], req['reqBytes'])

        if dec[0] >= dec[1]:
            s = dec[0] + dec[1]
            d = dec[0] - dec[1]
            resp = ethabi.encode(['uint256', 'uint256'], [s, d])
            err_code = 0
        else:
            print("offchain_addsub2 underflow error", dec[0], dec[1])
            resp = Web3.to_bytes(text="underflow error")
    except Exception as e:
        print("DECODE FAILED", e)

    return gen_response(req, err_code, resp)
```

First things first, we initialize an err_code and a resp object with values in case of an exception:
``` python
err_code = 1
resp = Web3.to_bytes(text="unknown error")
```
In the try-block we parse the request with the help of this function:

```python
def parse_req(sk, src_addr, src_nonce, oo_nonce, payload):
    req = dict()
    req['skey'] = Web3.to_bytes(hexstr=sk)
    req['srcAddr'] = Web3.to_checksum_address(src_addr)
    req['srcNonce'] = Web3.to_int(hexstr=src_nonce)
    req['opNonce'] = Web3.to_int(hexstr=oo_nonce)
    req['reqBytes'] = Web3.to_bytes(hexstr=payload)
    return req
```

and decode the 'reqBytes' to an array of [uin32, uint32] since we want to receive two numbers.
``` python
dec = ethabi.decode(['uint32', 'uint32'], req['reqBytes'])
```

Now we can perform our custom logic on the received values:
```python
if dec[0] >= dec[1]:
```

When the calculation was successful, we overwrite the previously created err_code and resp variables with successful values:
```python
resp = ethabi.encode(['uint256', 'uint256'], [s, d])
err_code = 0
```

As we decoded the reqBytes by letting the decode function know that we want to receive two numbers by giving it an array of ['uin32', 'uint32'], we let the encode function know, on how we want to decode both numbers. In this case with ['uint256', 'uint256'].

In case of an underflow error, we encode a string containing a text to let the user know what happened:
```python
resp = Web3.to_bytes(text="underflow error")
```

Before we can return these objects, we need to transform them into a specific object:
TODO: Explain this function?

``` python
def gen_response(req, err_code, resp_payload):
    resp2 = ethabi.encode(['address', 'uint256', 'uint32', 'bytes'], [
                          req['srcAddr'], req['srcNonce'], err_code, resp_payload])
    enc1 = ethabi.encode(['bytes32', 'bytes'], [req['skey'], resp2])
    p_enc1 = "0x" + selector("PutResponse(bytes32,bytes)") + \
        Web3.to_hex(enc1)[2:]  # dfc98ae8

    enc2 = ethabi.encode(['address', 'uint256', 'bytes'], [
                         Web3.to_checksum_address(HelperAddr), 0, Web3.to_bytes(hexstr=p_enc1)])
    p_enc2 = "0x" + selector("execute(address,uint256,bytes)") + \
        Web3.to_hex(enc2)[2:]  # b61d27f6

    limits = {
        'verificationGasLimit': "0x10000",
        'preVerificationGas': "0x10000",
    }
    callGas = 705*len(resp_payload) + 170000

    print("callGas calculation", len(resp_payload), 4+len(enc2), callGas)
    p = ethabi.encode([
        'address',
        'uint256',
        'bytes32',
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes32',
    ], [
        HybridAcctAddr,
        req['opNonce'],
        Web3.keccak(Web3.to_bytes(hexstr='0x')),  # initCode
        Web3.keccak(Web3.to_bytes(hexstr=p_enc2)),
        callGas,
        Web3.to_int(hexstr=limits['verificationGasLimit']),
        Web3.to_int(hexstr=limits['preVerificationGas']),
        0,  # maxFeePerGas
        0,  # maxPriorityFeePerGas
        Web3.keccak(Web3.to_bytes(hexstr='0x')),  # paymasterANdData
    ])
    ooHash = Web3.keccak(ethabi.encode(['bytes32', 'address', 'uint256'], [
                         Web3.keccak(p), EntryPointAddr, HC_CHAIN]))
    signAcct = eth_account.account.Account.from_key(hc1_key)
    eMsg = eth_account.messages.encode_defunct(ooHash)
    sig = signAcct.sign_message(eMsg)

    success = (err_code == 0)
    print("Method returning success={} response={} signature={}".format(
        success, Web3.to_hex(resp_payload), Web3.to_hex(sig.signature)))
    return ({
        "success": success,
        "response": Web3.to_hex(resp_payload),
        "signature": Web3.to_hex(sig.signature)
    })
```

With that settled, we have successfuly implemented a function, which can receive a request from the bundler, perform some calculation with it's payload and return a response.


## Step 2: Setting up a server
With the offchain handler created, the next step is to set up a server to run it. In this example, we will create a simple JSON-RPC server using the jsonrpclib library:
```python
from jsonrpclib.SimpleJSONRPCServer import SimpleJSONRPCServer, SimpleJSONRPCRequestHandler

def selector(name):
    nameHash = Web3.to_hex(Web3.keccak(text=name))
    return nameHash[2:10]


class RequestHandler(SimpleJSONRPCRequestHandler):
    rpc_paths = ('/', '/hc')


def server_loop():
    server = SimpleJSONRPCServer(
        ('0.0.0.0', 1234), requestHandler=RequestHandler)
    server.register_function(offchain_addsub2, selector(
        "addsub2(uint32,uint32)"))  # ASD97e0d7ba

    server.serve_forever()


server_loop()  # Run until killed
```

Here, we register our function offchain_addsub2. Note the "identifier" passed to register_function. This identifier is generated by the selector function, which creates a hashed representation of the function signature provided as an argument.

### Why is that?
The bundler sends us an JSON-RPC v2 request, containing a "method" identifier which is the function selector of the desired offchain method, along with
several standard parameters (NOTE - names are subject to change) as well as a "payload" which contains the ABI-encoded request data:
``` JSON
{
  "jsonrpc":"2.0",
  "id":0,
  "method":"ASD97e0d7ba",
  "params":{
    "sk":"f27fb73f63cd38cee89c48053fe8bb3248ddb7a98ce9f45b9176d017df47d9ce",
    "src_addr":"b43a2532e87583351b9024d6a6d0ba7acfa54446",
    "src_nonce":"0000000000000000000000000000000000000000000003eb0000000000000003",
    "oo_nonce":"0xb43a2532e87583351b9024d6a6d0ba7acfa544460000000000000003",
    "payload":"00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001"
  }
}
```
In *Step 3: Writing the Smart Contract* we intialize a request object by encoding the function signature along with it's arguments.
``` solidity
bytes memory req = abi.encodeWithSignature("addsub2(uint32,uint32)", a, b);
 ```
So the JSON-RPC server maps the request to the actual function by the *encoded signature*.


## Step 3: Writing the Smart Contract
Now we can write the Smart Contract, which will call our previously created offchain-handler.
You can find the needed "HybridAccount"-Contract along with it's dependencies in the provided repository.

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "../samples/HybridAccount.sol";
contract TestCounter {
    mapping(address => uint256) public counters;
    address payable immutable demoAddr;
    
    constructor(address payable _demoAddr) {
      demoAddr = _demoAddr;
    }
    function count(uint32 a, uint32 b) public {
       HybridAccount HA = HybridAccount(demoAddr);
       uint256 x;
       uint256 y;
       if (b == 0) {
           counters[msg.sender] = counters[msg.sender] + a;
	   return;
       }
       bytes memory req = abi.encodeWithSignature("addsub2(uint32,uint32)", a, b);
       bytes32 userKey = bytes32(abi.encode(msg.sender));
       (uint32 error, bytes memory ret) = HA.CallOffchain(userKey, req);
       if (error == 0) {
           (x,y) = abi.decode(ret,(uint256,uint256)); // x=(a+b), y=(a-b)
           this.gasWaster(x, "abcd1234");
           counters[msg.sender] = counters[msg.sender] + y;
       } else if (b >= 10) {
           revert(string(ret));
       } else if (error == 1) {
           counters[msg.sender] = counters[msg.sender] + 100;
       } else {
           //revert(string(ret));
           counters[msg.sender] = counters[msg.sender] + 1000;
       }
    }
    function countFail() public pure {
        revert("count failed");
    }
    function justemit() public {
        emit CalledFrom(msg.sender);
    }
    event CalledFrom(address sender);
    //helper method to waste gas
    // repeat - waste gas on writing storage in a loop
    // junk - dynamic buffer to stress the function size.
    mapping(uint256 => uint256) public xxx;
    uint256 public offset;
    function gasWaster(uint256 repeat, string calldata /*junk*/) external {
        for (uint256 i = 1; i <= repeat; i++) {
            offset++;
            xxx[offset] = i;
        }
    }
}
```
Starting in the "count"-function, we initialize an "HybridAccount" along the with the address used when we deployed the "Smart Contract" (more on deploying in step 4):

```solidity
HybridAccount HA = HybridAccount(demoAddr);
address payable immutable demoAddr;
    
constructor(address payable _demoAddr) {
    demoAddr = _demoAddr;
}
```
The "HybridAccount" contract has been previously registered to provide access to the "addsub2" function on our offchain-function. But more on that later.

### Calling Offchain
As already mentioned in Step 2, our offchain-server maps the request, made by the bundler, via the hashed representation of our function-signature. So let's decode the function-signature we want to call on the offchain-server:

```solidity
bytes memory req = abi.encodeWithSignature("addsub2(uint32,uint32)", a, b);
bytes32 userKey = bytes32(abi.encode(msg.sender));
(uint32 error, bytes memory ret) = HA.CallOffchain(userKey, req);
require(result == HC_ERR_NONE, "Offchain call failed");
(x,y) = abi.decode(ret,(uint256,uint256)); // x=(a+b), y=(a-b)
```
We then generate an "userKey" by encoding "msg.sender". The "userKey" parameter is used to distinguish requests so that they may be processed concurrently without interefering with each other.

Withing the Hybrid Account contract itself, the "CallOffchain" method calls through to another system contract named "HCHelper":
``` solidity
function CallOffchain(bytes32 userKey, bytes memory req) public returns (uint32, bytes memory) {
   require(PermittedCallers[msg.sender], "Permission denied");
   IHCHelper HC = IHCHelper(_helperAddr);
   userKey = keccak256(abi.encodePacked(userKey, msg.sender));
   return HC.TryCallOffchain(userKey, req);
}
```

In this example the HybridAccount implements a simple whitelist of contracts which are allowed to call its methods. It would also be possible for a HybridAccount to implement additional logic here, such as requiring payment of an ERC20 token to perform an offchain call. Or conversely, the owner of a HybridAccount could choose to make the CallOffchain method available to all callers without restriction.

There is an opportunity for a HybridAccount contract to implement a billing system here, requiring a payment of ERC20 tokens or some other mechanism of collecting payment from the calling contract. This is optional.

### Helper Contract Implementation
```solidity
function TryCallOffchain(bytes32 userKey, bytes memory req) public returns (uint32, bytes memory) {
  bool found;
	uint32 result;
  bytes memory ret;
  bytes32 subKey = keccak256(abi.encodePacked(userKey, req));
  bytes32 mapKey = keccak256(abi.encodePacked(msg.sender, subKey));
  (found, success, ret) = getEntry(mapKey);
	if (found) {
	    return (result, ret);
	} else {
	  // If no off-chain response, check for a system error response.
    bytes32 errKey = keccak256(abi.encodePacked(address(this), subKey));
	    
	  (found, result, ret) = getEntry(errKey);
	  if (found) {
	    require(result != HC_ERR_NONE, "Invalid error code");
	    return (result, ret);
	  } else {
	    // Nothing found, so trigger a new request.
      bytes memory prefix = "_HC_TRIG";
      bytes memory r2 = bytes.concat(prefix, abi.encodePacked(msg.sender, userKey, req));
      assembly {
        revert(add(r2, 32), mload(r2))
	    }
	  }
	}	
}
```

## Step4: How to deploy contracts via Foundry
**1. Install Foundry**: Follow the [Installation Guideline](https://book.getfoundry.sh/getting-started/installation) on how to install Foundry.

**2. Install OpenZeppelin Contracts**: Install [OpenZeppelin v4](https://docs.openzeppelin.com/upgrades-plugins/1.x/foundry-upgrades) Contracts with the following command:
```bash
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-foundry-upgrades
forge install OpenZeppelin/openzeppelin-contracts@v4.9.6
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v4.9.6
```
**NOTE:** **v4** is needed due to dependencies on the **ERC777** Token which is not available in v5.

Then, set the following in `remappings.txt`:
``` bash
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/
```

**3. Deploy the Contract**: To deploy a Contract, run following command:

```bash
forge create contracts/test/TestKyc.sol:TestKyc  --private-key="YOUR_PRIVATE_KEY"
--constructor-args="0xEFf0943152672507F7F9BD55A7Eff2D014Ca8070"
```
In this example, the `TestKyc.sol` contract takes in an **address** in the constructor.
For more options on `forge create` please refer to this [guide](https://book.getfoundry.sh/reference/forge/forge-create).

### Developer Notes Sepolia Deployment
1. Install Dependencies
2. Deploy on Sepolia with `pnpm deploy:local`
3. Get the `HybridAccount` and the `Backend URL` and call `RegisterURL (Boba Team)`

### Developer Auto Submit Documentation
1. A provided scrip `backend/auto-submit/run-all.py` builds some UserOps and OpenAI question/answers to restart the game every night.
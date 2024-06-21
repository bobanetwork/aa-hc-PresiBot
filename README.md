# aws-3tier-template

## Usage

This is a template repo - create a new repo from this template
by [clicking here](https://github.com/new?owner=bobanetwork&template_name=aws-3tier-template&template_owner=bobanetwork)

### Pipeline setup

Configure the `config/pipeline.json` file to suit your needs.

Usually, you would need to know the AWS account you are deploying into, which VPC you want to use etc. However, these
have been pre-populated with values for the hackathon account. Replace "mycoolapp" in the `Namespace` and `DomainName`
parameters with the namespace you want to use.

#### Deploy the pipeline

Once you have configured the `pipeline.json` file to suit, go to Cloudformation in the AWS Account you intend to use and
deploy the `cfn/pipeline.yml` file.

### Where do I put my code?

### Contract Deployment

1. Install project dependencies
> git submodule update --init --recursive

2. Build contracts
> forge build

3. Deploy Contracts

| Name             | Address                                          | Explainer                           |
|------------------|--------------------------------------------------|-------------------------------------|
| ENTRY_POINT      | 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789       |                                     |
| BOBA_TOKEN       | 0x4200000000000000000000000000000000000023       |                                     |
| HC_HELPER_ADDR   | 0x587a06089ed54101dd6d9A8ecDe1d146f97Af6B8       | HC Helper is system-wide available  |
| RPC_URL          | https://gateway.tenderly.co/public/boba-sepolia	 |                                     |
| -> More RPC URls | https://chainlist.org/chain/28882	               |                                     |

### Deployment: Hybrid Account

###### root/src/contract/src/samples/HybridAccount.sol

```
forge create src/contract/src/samples/HybridAccount.sol:HybridAccount --private-key=PRIVATE_KEY --rpc-url=RPC_URL --constructor-args ENTRY_POINT HC_HELPER_ADDR
```

> Store the contract address on AWS secret manager for key `OC_HYBRID_ACCOUNT`

> Hybrid Account is currently set to 0x74a165b2057cda0866616cBa9a3A80B8EBf83DA1

### Deployment: Test Counter
###### root/src/contract/src/AddSub.sol

```
forge create src/contract/src/AddSub.sol:TestCounter --etherscan-api-key ETHERSCAN_API_KEY --verify --private-key=PRIVATE_KEY --rpc-url=RPC_URL --constructor-args HYBRID_ACCOUNT_ADDR
```

> Remember the Deployment Address \
> You can also pass `--etherscan-api-key ETHER_API_KEY --verify` to verify the contract

> This Address will be utilized by the frontend code, and needs to be updated on src/frontend
> TestCounter is currently set to 0x63BceAfAF62fB12394ecbEf10dBF1c5c36ba8b38


##### Setting-up HA and TestCounter
1. You need to call `PermitCaller()` on the HA to allow it to accept calls from your TestCounter
2. You need to call `Registerurl()` and `addCredit()` on the HCHelper to register credits for your HybridAccount

#### Frontend

Frontend assets go in `src/frontend`. If you want to use a transpiled technology then the build
project @ `cfn/pipeline.yml#L198-L207` can be easily modified to run whatever command you need to build your frontend
and send the compiled assets to S3.

#### Backend

### Starting the Backend

We have configured a Dockerfile containing the necessary instructions to start a python server. \

###### Adding env params for the offchain RPC

To add new env params:
1. Update cfn/ecs.yml with the new keys
2. Add the values on AWS secret manager

###### root/src/backend/Dockerfile

The application backend goes into `src/backend` and the deliverable is the `Dockerfile`. As long as the Dockerfile
builds ok, then it will deploy to ECS smoothly. Tweaks to the configuration of the ECS Service are done
in `cfn/ecs.yml`.

# aws-3tier-template

## Usage
This is a template repo - create a new repo from this template by [clicking here](https://github.com/new?owner=bobanetwork&template_name=aws-3tier-template&template_owner=bobanetwork)

### Pipeline setup
Configure the `config/pipeline.json` file to suit your needs.

Usually, you would need to know the AWS account you are deploying into, which VPC you want to use etc. However, these have been pre-populated with values for the hackathon account. Replace "mycoolapp" in the `Namespace` and `DomainName` parameters with the namespace you want to use.

#### Deploy the pipeline
Once you have configured the `pipeline.json` file to suit, go to Cloudformation in the AWS Account you intend to use and deploy the `cfn/pipeline.yml` file.

### Where do I put my code?

#### Frontend
Frontend assets go in `src/frontend`. If you want to use a transpiled technology then the build project @ `cfn/pipeline.yml#L198-L207` can be easily modified to run whatever command you need to build your frontend and send the compiled assets to S3.

#### Backend
The application backend goes into `src/backend` and the deliverable is the `Dockerfile`. As long as the Dockerfile builds ok, then it will deploy to ECS smoothly. Tweaks to the configuration of the ECS Service are done in `cfn/ecs.yml`.
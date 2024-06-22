FROM public.ecr.aws/docker/library/python:3.9-slim
WORKDIR /app
COPY . /app
RUN apt-get update && apt-get install -y git
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --default-timeout=100 git+https://github.com/bobanetwork/jsonrpclib.git

EXPOSE 1234

CMD ["python", "offchain.py"]

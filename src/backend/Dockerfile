FROM public.ecr.aws/docker/library/python:3.9-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 1234

CMD ["python", "offchain.py"]

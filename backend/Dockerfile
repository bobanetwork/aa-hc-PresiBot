# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY *.py .

# Make port 1234 available to the world outside this container
EXPOSE ${OC_LISTEN_PORT:-1234}

# Run the application when the container launches
CMD ["python", "-u", "offchain.py"]
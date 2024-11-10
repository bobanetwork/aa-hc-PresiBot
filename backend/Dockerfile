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
# Expose the port - this will use PORT if set by Render, otherwise OC_LISTEN_PORT, otherwise 1234
ENV PORT=${PORT:-${OC_LISTEN_PORT:-1234}}
EXPOSE ${PORT}
# Run the application when the container launches
CMD ["python", "-u", "offchain.py"]
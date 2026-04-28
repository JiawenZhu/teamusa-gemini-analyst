# Use Python 3.12 slim — stable, supported by all current deps
FROM python:3.12-slim

# Install system dependencies for psycopg2 and other native libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Cloud Run passes PORT as an env var — default to 8080
ENV PORT=8080

# Use exec form for proper signal handling
CMD exec uvicorn main:app --host 0.0.0.0 --port $PORT

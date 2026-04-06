From python:3.10-slim

WORKDIR /app

# System deps: ffmpeg + common OpenCV/runtime libs (add more if imports fail)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

Copy requirements.txt .
ENV PIP_DEFAULT_TIMEOUT=300
ENV PIP_RETRIES=10
RUN pip install --no-cache-dir -r requirements.txt

Copy . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

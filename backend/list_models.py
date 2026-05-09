from google import genai
import os

client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="us-central1")

try:
    print("Listing models in us-central1:")
    for model in client.models.list():
        print(f"- {model.name}")
except Exception as e:
    print(f"Error: {e}")

from google import genai
client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="us-central1")
for m in client.models.list():
    if "flash" in m.name:
        print(m.name)

from google import genai
client = genai.Client(vertexai=True, project="teamusa-8b1ba", location="us-central1")
try:
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents="Hello",
    )
    print("Success:", response.text)
except Exception as e:
    print("Error:", e)

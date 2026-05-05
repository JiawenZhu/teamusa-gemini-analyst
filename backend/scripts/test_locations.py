from google import genai

locations = ["us-central1", "us-east1", "us-east4", "us-west1", "us-west4"]
model = "gemini-3-flash-preview"

for loc in locations:
    client = genai.Client(vertexai=True, project="teamusa-8b1ba", location=loc)
    try:
        response = client.models.generate_content(
            model=model,
            contents="Hello",
        )
        print(f"Success in {loc}:", response.text)
    except Exception as e:
        msg = str(e)
        if "404" in msg:
            print(f"Error 404 in {loc}")
        else:
            print(f"Error {loc}:", msg)

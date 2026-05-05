const { GoogleAuth } = require('google-auth-library');

async function listModels() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  
  const projectId = 'teamusa-8b1ba';
  const location = 'us-central1';
  
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  if (data.models) {
    const liveModels = data.models.filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('bidiGenerateContent')
    );
    console.log("Live Models:", liveModels.map(m => m.name));
  } else {
    console.log(data);
  }
}

listModels().catch(console.error);

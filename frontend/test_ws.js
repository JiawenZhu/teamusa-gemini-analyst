const { GoogleAuth } = require('google-auth-library');
const WebSocket = require('ws');

async function testVertexWebSocket() {
  console.log("Fetching ADC token...");
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: 'teamusa-8b1ba'
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  const projectId = await auth.getProjectId();
  
  console.log("Token:", token.substring(0, 10) + "...");
  console.log("Project:", projectId);

  const location = "us-central1";
  
  // Test both with and without double slash
  const url1 = `wss://${location}-aiplatform.googleapis.com//ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${token}`;
  const url2 = `wss://${location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${token}`;

  for (const url of [url1, url2]) {
    console.log(`\nTesting URL: ${url.substring(0, 80)}...`);
    await new Promise((resolve) => {
      const ws = new WebSocket(url);
      
      ws.on('open', () => {
        console.log("✅ Connection established!");
        
        // Send setup message
        const setupMessage = {
          setup: {
            model: `projects/${projectId}/locations/${location}/publishers/google/models/gemini-live-3.1-flash-native-audio`
          }
        };
        console.log("Sending setup:", JSON.stringify(setupMessage));
        
        ws.send(JSON.stringify(setupMessage));
      });
      
      ws.on('message', (data) => {
        console.log("📥 Received data:", data.toString());
        ws.close();
      });
      
      ws.on('error', (err) => {
        console.log("❌ Error:", err.message);
      });
      
      ws.on('unexpected-response', (request, response) => {
        console.log(`❌ Unexpected response: ${response.statusCode} ${response.statusMessage}`);
        resolve();
      });
      
      ws.on('close', (code, reason) => {
        console.log(`🔌 Closed: ${code} ${reason.toString()}`);
        resolve();
      });
    });
  }
}

testVertexWebSocket().catch(console.error);

import { GoogleAuth } from 'google-auth-library';
import WebSocket from 'ws';

async function test() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  console.log('Fetching access token...');
  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;
  console.log('Got token, length:', accessToken.length);
  
  const projectId = await auth.getProjectId();
  const location = 'us-central1';
  const model = 'gemini-2.5-flash';
  
  const url = `wss://${location}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?access_token=${accessToken}`;
  
  console.log('Connecting to WS...');
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('WS OPENED!');
    ws.close();
  });
  
  ws.on('error', (err) => {
    console.log('WS ERROR:', err.message);
  });
  
  ws.on('unexpected-response', (req, res) => {
    console.log('Unexpected response:', res.statusCode);
  });
}

test().catch(console.error);

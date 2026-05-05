import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function GET() {
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId: 'teamusa-8b1ba'
    });
    
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;
    
    return NextResponse.json({ 
      accessToken, 
      projectId: 'teamusa-8b1ba',
      // us-central1 is the standard for Vertex AI Live capabilities
      location: 'us-central1' 
    });
  } catch (error: any) {
    console.error("Vertex Token Error:", error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

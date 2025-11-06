import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const HF_BASE_URL = "https://mukhammed19-virtual-try-on-app.hf.space";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { humanImage, garmentImage } = req.body;

    if (!humanImage || !garmentImage) {
      return res.status(400).json({ message: 'Missing image data' });
    }

    console.log('Step 1: Initiating call to HF Space...');

    // Step 1: Initiate the prediction
    const initResponse = await axios.post(
      `${HF_BASE_URL}/call/virtual_tryon`,
      { data: [humanImage, garmentImage] },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const eventId = initResponse.data.event_id;
    console.log('Step 2: Got event ID:', eventId);

    // Step 2: Poll for the result using Server-Sent Events
    const sseUrl = `${HF_BASE_URL}/call/virtual_tryon/${eventId}`;
    
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`Polling attempt ${attempts}/${maxAttempts}...`);
        
        const response = await axios.get(sseUrl, {
          responseType: 'text',
          timeout: 10000,
        });

        // Parse SSE data
        const data = response.data;
        const lines = data.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              console.log('Received:', jsonData.msg);
              
              if (jsonData.msg === 'process_completed' && jsonData.output) {
                console.log('Success! Returning result.');
                return res.status(200).json({ data: jsonData.output.data });
              }
              
              if (jsonData.msg === 'error') {
                throw new Error(jsonData.error || 'Processing error');
              }
            } catch (parseError) {
              // Skip unparseable lines
            }
          }
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (pollError: any) {
        // Continue polling on timeout or connection errors
        if (pollError.code === 'ECONNABORTED' || pollError.code === 'ETIMEDOUT') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        // For other errors, log and continue (might be still processing)
        console.log('Poll error:', pollError.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Processing timeout after 2 minutes');

  } catch (error: any) {
    console.error('Error in /api/tryon:', error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
    const status = error.response?.status === 404 ? 404 : 500;
    
    res.status(status).json({ 
      message: 'Error processing image',
      error: errorMessage,
      hint: status === 404 ? 'HF Space might be sleeping. Try visiting it first.' : undefined
    });
  }
}
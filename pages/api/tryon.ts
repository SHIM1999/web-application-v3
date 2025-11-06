import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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

    console.log('Calling Gradio API...');

    // For Gradio with api_name, use the /api/predict endpoint
    const response = await axios.post(
      'https://mukhammed19-virtual-try-on-app.hf.space/api/predict',
      {
        data: [humanImage, garmentImage]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    console.log('Success:', response.data);
    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error('Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    res.status(500).json({ 
      message: 'Error processing image',
      error: error.message,
      hint: 'Make sure HF Space is running and API is enabled'
    });
  }
}
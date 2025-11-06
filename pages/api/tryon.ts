import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const HF_API_URL = "https://mukhammed19-virtual-try-on-app.hf.space/api/virtual_tryon";


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

    console.log('Calling HF Space API...');

    const response = await axios.post(HF_API_URL, {
      data: [humanImage, garmentImage]
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });

    console.log('HF Response received');
    
    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error("Error in /api/tryon:", error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Error processing image',
      error: error.response?.data || error.message 
    });
  }
}
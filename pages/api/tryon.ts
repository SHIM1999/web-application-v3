import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  
  try {
    const { humanImage, garmentImage } = req.body;
    if (!humanImage || !garmentImage) return res.status(400).json({ message: 'Missing image data' });
    
    const response = await axios.post('https://mukhammed19-virtual-try-on-app.hf.space/api/predict', 
      { data: [humanImage, garmentImage] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 120000 }
    );
    
    return res.status(200).json(response.data);
  } catch (error: any) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
}

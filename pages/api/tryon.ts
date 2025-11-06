import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
  
  try {
    const { humanImage, garmentImage } = req.body;
    if (!humanImage || !garmentImage) return res.status(400).json({ message: 'Missing data' });
    
    const python = `
from gradio_client import Client
client = Client("mukhammed19/virtual-try-on-app")
result = client.predict("${humanImage}", "${garmentImage}", api_name="/predict")
print(result)
`;
    
    const { stdout } = await execAsync(`python3 -c '${python}'`);
    return res.status(200).json({ data: [stdout.trim()] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// pages/api/tryon.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios'; // You already have axios in package.json

// 1. YOUR HUGGING FACE SPACE URL
// I got this from your screenshot and app.py.
// Make sure you add api_name="virtual_tryon" to your app.py file!
const HF_API_URL = "https://mukhammed19-virtual-try-on-app.hf.space/run/predict";

/**
 * Helper function to download an image from a URL and convert it to a base64 string.
 * The Gradio API needs the image data, not just a URL to it.
 */
const imageUrlToBase64 = async (url: string) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });
    
    // Infer mime type from URL extension
    const ext = url.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const buffer = Buffer.from(response.data, 'binary').toString('base64');
    // Return a data URI — we'll strip the prefix later if the HF API expects raw base64
    return `data:${mimeType};base64,${buffer}`;
  } catch (error) {
    console.error(`Failed to fetch or convert image URL: ${url}`, error);
    throw new Error("Failed to fetch garment image");
  }
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 2. GET THE IMAGES FROM YOUR FRONTEND
    // humanImage is already a base64 string from the camera
    // garmentImage is a URL string (e.g., "http://.../cloth.png")
    const { humanImage, garmentImage } = req.body;

    if (!humanImage || !garmentImage) {
      return res.status(400).json({ message: 'Missing image data' });
    }
    
    // 3. CONVERT THE GARMENT IMAGE URL TO BASE64
    const garmentImageB64WithPrefix = await imageUrlToBase64(garmentImage);

    // Helper to strip data URI prefix if present. Many HF/Gradio endpoints prefer raw base64
    const stripDataUri = (dataUri: string) => dataUri.replace(/^data:[^;]+;base64,/, '');

    // Ensure we send plain base64 strings (without the `data:*;base64,` prefix)
    const humanB64 = stripDataUri(humanImage);
    const garmentB64 = stripDataUri(garmentImageB64WithPrefix);

    // 4. CALL THE HUGGING FACE GRADIO API
    // Add a reasonable timeout and propagate HF errors back with more context
    const hfResponse = await axios.post(
      HF_API_URL,
      {
        data: [humanB64, garmentB64],
      },
      { timeout: 60000 }
    );

    // 5. SEND THE RESULT BACK TO YOUR FRONTEND
    // Gradio usually returns an object with `data: [<base64-image-or-url>, ...]`
    res.status(200).json(hfResponse.data);

  } catch (error) {
    console.error("Error in /api/tryon:", error);
    res.status(500).json({ message: 'Error processing image' });
  }
}
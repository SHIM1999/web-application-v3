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
    // Now both images are in the base64 format the API expects.
    const garmentImageB64 = await imageUrlToBase64(garmentImage);

    // 4. CALL THE HUGGING FACE GRADIO API
    const hfResponse = await axios.post(HF_API_URL, {
      data: [
        humanImage,       // The base64 string from your camera
        garmentImageB64,  // The base64 string from the garment URL
      ],
    });

    // 5. SEND THE RESULT BACK TO YOUR FRONTEND
    // Your frontend code (result.data[0]) will work perfectly with this
    res.status(200).json(hfResponse.data);

  } catch (error) {
    console.error("Error in /api/tryon:", error);
    res.status(500).json({ message: 'Error processing image' });
  }
}
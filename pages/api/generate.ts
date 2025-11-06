// pages/api/generate.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Your Hugging Face Space URL. 
// IMPORTANT: Replace with your actual HF Space URL.
const HF_API_URL = "https://[YOUR-SPACE-NAME].hf.space/run/virtual_tryon";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { human_img_b64, garm_img_b64 } = req.body;

    if (!human_img_b64 || !garm_img_b64) {
      return res.status(400).json({ message: 'Missing image data' });
    }

    // Call the Hugging Face Gradio API
    // We send the base64 strings in the 'data' array
    const response = await axios.post(HF_API_URL, {
      data: [
        human_img_b64, // Corresponds to human_img
        garm_img_b64,  // Corresponds to garm_img
      ],
    });

    // The Gradio API returns data in a specific format.
    // The generated image will be in response.data.data[0]
    const result = response.data;
    const generated_image_b64 = result.data[0];
    
    // Send the result back to your frontend
    res.status(200).json({ image: generated_image_b64 });

  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    res.status(500).json({ message: 'Error processing image' });
  }
}
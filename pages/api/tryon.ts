// pages/api/tryon.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios'; // You already have axios in package.json
import FormData from 'form-data';

// Primary run endpoint we tried (subdomain). We'll fall back to alternative shapes if needed.
const HF_API_URL = "https://mukhammed19-virtual-try-on-app.hf.space/run/virtual_tryon";
// Alternate endpoint using the canonical huggingface.co/spaces path (sometimes differs in proxied setups)
const HF_API_URL_ALT = "https://huggingface.co/spaces/MUKHAMMED19/virtual-try-on-app/run/virtual_tryon";

/**
 * Helper function to download an image from a URL and convert it to a base64 string.
 * The Gradio API needs the image data, not just a URL to it.
 */
const imageUrlToBuffer = async (url: string) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    // Infer mime type from URL extension
    const ext = url.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const buffer = Buffer.from(response.data, 'binary');
    return { buffer, mimeType };
  } catch (error) {
    console.error(`Failed to fetch or convert image URL: ${url}`, error);
    throw new Error('Failed to fetch garment image');
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
    
    // 3. PREPARE IMAGE BUFFERS
    // Convert human data-uri (from browser) to buffer
    const stripDataUri = (dataUri: string) => dataUri.replace(/^data:[^;]+;base64,/, '');
    const humanB64 = stripDataUri(humanImage);
    const humanBuffer = Buffer.from(humanB64, 'base64');
    // Try to infer mime type from the data URI prefix
    const humanMimeMatch = humanImage.match(/^data:([^;]+);base64,/);
    const humanMime = humanMimeMatch ? humanMimeMatch[1] : 'image/jpeg';

    // Fetch garment image as buffer
    const { buffer: garmentBuffer, mimeType: garmentMime } = await imageUrlToBuffer(garmentImage);

    // Log a small summary for debugging (do NOT log full images in production)
    console.log('Calling HF Space', {
      HF_API_URL,
      humanBytes: humanBuffer.length,
      garmentBytes: garmentBuffer.length,
    });

    // 4. CALL THE HUGGING FACE GRADIO API
    // We'll try a small sequence of candidate endpoints to handle differences in Space routing.
    const candidates = [
      HF_API_URL,
      HF_API_URL_ALT,
      HF_API_URL.replace('/virtual_tryon', '/predict'),
      HF_API_URL_ALT.replace('/virtual_tryon', '/predict'),
    ];

    let lastError: any = null;
    let hfResponse: any = null;

    for (const url of candidates) {
      try {
        console.log(`Posting to HF endpoint (multipart): ${url}`);

        // Build multipart/form-data payload
        const form = new FormData();
        // Append files as repeated 'data' fields (Gradio accepts file parts in the data array)
        form.append('data', humanBuffer, { filename: 'human.jpg', contentType: humanMime });
        form.append('data', garmentBuffer, { filename: 'garment.jpg', contentType: garmentMime });

        const headers = Object.assign({}, form.getHeaders(), { Accept: 'application/json' });

        hfResponse = await axios.post(url, form, {
          headers,
          timeout: 60000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
        // If we got here without throwing, we have a response (could be 200)
        if (hfResponse?.status === 200 || hfResponse?.data) {
          console.log(`HF endpoint responded (status=${hfResponse.status}) to ${url}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        // Log concise info for debugging, avoid dumping large bodies
        const status = err?.response?.status;
        const bodyPreview = err?.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : String(err.message);
        console.warn(`HF attempt failed for ${url}: status=${status}, body=${bodyPreview}`);
        // try next candidate
        hfResponse = null;
        continue;
      }
    }

    if (!hfResponse) {
      // All attempts failed. Return helpful debug info to the caller (but keep images out).
      const status = lastError?.response?.status ?? 'no-response';
      const body = lastError?.response?.data ?? lastError?.message ?? 'unknown';
      console.error('All HF endpoints failed. Last error status:', status);
      return res.status(502).json({ message: 'Hugging Face Space request failed', status, body });
    }

    // 5. SEND THE RESULT BACK TO YOUR FRONTEND
    // Gradio usually returns an object with `data: [<base64-image-or-url>, ...]`
    return res.status(200).json(hfResponse.data);

  } catch (error) {
    console.error("Error in /api/tryon:", error);
    res.status(500).json({ message: 'Error processing image' });
  }
}
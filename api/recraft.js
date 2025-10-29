// Vercel Serverless Function for Recraft API Proxy
// This file must be in /api/recraft.js for Vercel to recognize it

import sharp from 'sharp';

export default async function handler(req, res) {
  // Set CORS headers for Figma plugin (allow all origins)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variable
    const apiKey = process.env.RECRAFT_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured in Vercel environment variables' });
    }

    // Forward request to Recraft API
    const response = await fetch('https://external.api.recraft.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: req.body.prompt,
        style: req.body.style,
        model: req.body.model || 'recraftv3',
        substyle: req.body.substyle,
        negative_prompt: req.body.negative_prompt,
        n: req.body.n || 1,
        response_format: req.body.response_format || 'url',
        format: 'png' // Request PNG format for Figma compatibility
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Recraft API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `Recraft API error: ${response.statusText}`,
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Convert WEBP images to PNG base64 nutrients for Figma compatibility
    if (data.data && Array.isArray(data.data)) {
      for (let item of data.data) {
        if (item.url && item.url.includes('img.recraft.ai')) {
          try {
            // Fetch the image
            const imageResponse = await fetch(item.url);
            const imageBuffer = await imageResponse.arrayBuffer();
            
            // Convert WEBP to PNG using sharp
            const pngBuffer = await sharp(Buffer.from(imageBuffer))
              .png()
              .toBuffer();
            
            // Convert to base64 and add to response
            const base64Png = pngBuffer.toString('base64');
            item.b64_json = base64Png; // Use same format as OpenAI API
            item.url_png = `data:image/png;base64,${base64Png}`;
          } catch (convError) {
            console.error('Image conversion error:', convError);
            // Continue with original URL if conversion fails
          }
        }
      }
    }
    
    // Return the response
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: error.message || 'Proxy error',
      details: error.stack 
    });
  }
}


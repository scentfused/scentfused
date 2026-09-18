export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body || {}
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'A prompt is required.' })
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is missing GOOGLE_AI_API_KEY.' })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Image generation failed.' })
    }

    const parts = data?.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find((p) => p.inlineData)

    if (!imagePart) {
      return res.status(500).json({ error: 'No image was returned. Try rewording your prompt.' })
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png'
    const base64 = imagePart.inlineData.data
    return res.status(200).json({ image: `data:${mimeType};base64,${base64}` })
  } catch (err) {
    console.error('Image generation error:', err)
    return res.status(500).json({ error: 'Something went wrong generating the image.' })
  }
}

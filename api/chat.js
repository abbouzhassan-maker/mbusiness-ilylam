export default async function handler(req, res) {
  // السماح فقط بطلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `You are ILYOM AI, a professional health and tech consultant. Answer this: ${message}` }]
        }]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content) {
      const botReply = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ reply: botReply });
    } else {
      throw new Error('Invalid response from AI');
    }
  } catch (error) {
    return res.status(500).json({ error: "Failed to connect to Gemini API" });
  }
}

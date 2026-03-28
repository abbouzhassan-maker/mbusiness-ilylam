export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

 const systemPrompt = `
  You are ILYOM AI, the lead consultant for ILYOM Infrastructure. 
  Our services include:
  1. High-Performance Hosting: Fast and secure.
  2. AI Customers: Custom AI agents for businesses.
  3. Appwrite Integration: Advanced backend solutions.
  4. Web Creation: Premium website design.
  5. App Development: Custom mobile and desktop apps.

  Rules:
  - Be professional and technical but helpful.
  - Focus on selling these 5 specific services.
  - Respond in English as our brand is now global.
  - Customer Query: ${message}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
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
    return res.status(500).json({ error: "Failed to connect to ILYOM Engine" });
  }
}

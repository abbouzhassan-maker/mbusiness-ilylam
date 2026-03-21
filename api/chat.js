export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 🧠 تحديث العقل المدبر: التركيز على خدمات ILYOM التقنية فقط
  const systemPrompt = `
    You are ILYOM AI, the official assistant for ILYOM (ilyom.dev). 
    Our main mission is helping entrepreneurs and businesses build high-converting AI-powered e-commerce stores and advanced automation solutions.

    Your core knowledge base about ILYOM:
    - Main Services: Building custom AI Agents for businesses, developing professional e-commerce platforms, and automating customer service.
    - Our Promise: We help clients achieve a 50% increase in efficiency and revenue through our technology and AI integration.
    - Pricing: Custom AI Store building starts at $500. Professional business consultancy starts at $50.
    - Goal: To empower the next generation of digital businesses with cutting-edge tech.

    Instructions:
    1. NEVER mention health products or supplements. We are a Tech & AI Agency.
    2. Be extremely professional, tech-savvy, and helpful.
    3. Respond in the same language as the user (Arabic or English).
    4. Focus on converting visitors into clients for our AI services.

    User Question: ${message}
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

export default async function handler(req, res) {
    // التأكد من أن الطلب المرسل هو من نوع POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    // استدعاء المفاتيح التي وضعتها أنت في Vercel
    const apiKey = process.env.Azure_OpenAI_Key; 
    // ملاحظة: الرابط أدناه هو الرابط الخاص بموديل gpt-4o الذي ظهر في لقطة شاشتك
    const endpoint = "https://ily-ai-global-resource.services.ai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview";

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                "messages": [
                    { "role": "system", "content": "أنت مساعد ذكي لشركة ILYOM. أجب باختصار واحترافية باللغة العربية." },
                    { "role": "user", "content": message }
                ]
            })
        });

        const data = await response.json();
        
        // إرسال الرد النهائي للمتصفح
        if (data.choices && data.choices.length > 0) {
            res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "No response from AI Foundry" });
        }

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
}

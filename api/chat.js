import { Client, Databases, ID } from 'node-appwrite';
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { message } = req.body;
    const logData = {
        message: message,
        platform: "ILYOM.dev",
        timestamp: new Date().toISOString(),
        status: "Received"
    };

    try {
        // --- 1. Telegram (تنبيه فوري لك) ---
        const telegramNotify = fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `🚀 نشاط جديد على ILYOM\n\nالرسالة: ${message}\nالوقت: ${logData.timestamp}`
            })
        });

        // --- 2. MongoDB (أرشفة السجلات التقنية) ---
        const mongoSync = (async () => {
            const client = new MongoClient(process.env.MONGO_URI);
            await client.connect();
            await client.db('ilyom_business').collection('logs').insertOne(logData);
            await client.close();
        })();

        // --- 3. Appwrite (إدارة بيانات العملاء) ---
        const appwriteSync = (async () => {
            const client = new Client()
                .setEndpoint(process.env.APPWRITE_ENDPOINT)
                .setProject(process.env.APPWRITE_PROJECT_ID)
                .setKey(process.env.APPWRITE_API_KEY);
            const databases = new Databases(client);
            await databases.createDocument('main_db', 'chat_collection', ID.unique(), {
                user_message: message,
                created_at: logData.timestamp
            });
        })();

        // --- 4. Azure AI (توليد الرد الذكي) ---
        const azureResponse = await fetch("https://ily-ai-global-resource.services.ai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.Azure_OpenAI_Key },
            body: JSON.stringify({ "messages": [{ "role": "user", "content": message }] })
        });

        const aiData = await azureResponse.json();
        const botReply = aiData.choices[0].message.content;

        // تنفيذ جميع عمليات الحفظ في الخلفية دون انتظارها لسرعة الرد
        Promise.all([telegramNotify, mongoSync, appwriteSync]).catch(err => console.error("Sync Error:", err));

        // --- 5. GitHub ---
        // هو من يدير هذا الكود الآن ويضمن تحديثه!

        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error("Ecosystem Error:", error);
        res.status(500).json({ error: "One of the systems failed to sync." });
    }
}

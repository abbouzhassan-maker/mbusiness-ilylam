import { Client, Databases, ID } from 'node-appwrite';
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { message } = req.body;
    const timestamp = new Date().toISOString();

    try {
        // 1. إرسال تنبيه Telegram فوري
        const telegramNotify = fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `🚀 إشعار من ILYOM:\nالرسالة: ${message}\nالوقت: ${timestamp}`
            })
        }).catch(err => console.error("Telegram Error"));

        // 2. الحفظ في MongoDB
        const mongoSync = (async () => {
            const client = new MongoClient(process.env.MONGO_URI);
            await client.connect();
            await client.db('ilyom_db').collection('logs').insertOne({ message, time: timestamp });
            await client.close();
        })().catch(err => console.error("Mongo Error"));

        // 3. الحفظ في Appwrite
        const appwriteSync = (async () => {
            const client = new Client()
                .setEndpoint(process.env.APPWRITE_ENDPOINT)
                .setProject(process.env.APPWRITE_PROJECT_ID)
                .setKey(process.env.Appwrite_API_Key);
            const databases = new Databases(client);
            // تأكد من إنشاء Database باسم 'main' و Collection باسم 'chats' في Appwrite أو استبدلهم بالـ IDs الخاصة بك
            await databases.createDocument('main', 'chats', ID.unique(), {
                content: message,
                date: timestamp
            });
        })().catch(err => console.error("Appwrite Error"));

        // 4. جلب الرد من Azure GPT-4o
        const azureResponse = await fetch("https://ily-ai-global-resource.services.ai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': process.env.Azure_OpenAI_Key
            },
            body: JSON.stringify({
                "messages": [
                    { "role": "system", "content": "أنت مساعد ذكي لشركة ILYOM. أجب باختصار واحترافية." },
                    { "role": "user", "content": message }
                ]
            })
        });

        const aiData = await azureResponse.json();
        const reply = aiData.choices[0].message.content;

        // تنفيذ عمليات الحفظ في الخلفية لسرعة الرد
        await Promise.all([telegramNotify, mongoSync, appwriteSync]);

        res.status(200).json({ reply });

    } catch (error) {
        console.error("Ecosystem Error:", error);
        res.status(500).json({ error: "Connection Error" });
    }
}

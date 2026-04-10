import { Client, Databases, ID } from 'node-appwrite';
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { message } = req.body;
    const timestamp = new Date().toISOString();

    // 1. إرسال إلى Telegram (تنبيه فوري)
    const tgMsg = fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `📩 سؤال جديد على ILYOM:\n${message}` })
    });

    // 2. التسجيل في MongoDB (أرشفة تقنية)
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    const saveToMongo = (async () => {
        await mongoClient.connect();
        const db = mongoClient.db('ilyom_logs');
        await db.collection('chat_history').insertOne({ message, time: timestamp });
        await mongoClient.close();
    })();

    // 3. التخزين في Appwrite (إدارة عملاء)
    const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);
    const saveToAppwrite = databases.createDocument('ilyom_db', 'chats_col', ID.unique(), { content: message, date: timestamp });

    // 4. جلب الرد من Azure AI
    try {
        // تنفيذ التنبيهات والأرشفة في الخلفية دون تعطيل الرد
        Promise.all([tgMsg, saveToMongo, saveToAppwrite]);

        const aiResponse = await fetch(process.env.AZURE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.Azure_OpenAI_Key },
            body: JSON.stringify({ "messages": [{ "role": "user", "content": message }] })
        });

        const data = await aiResponse.json();
        res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Ecosystem Sync Error" });
    }
}

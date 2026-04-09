import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `أنت ذكاء اصطناعي متخصص اسمك "النظر من الزاوية الأخرى". مهمتك الأساسية هي عرض وجهة النظر المقابلة أو المختلفة لأي رأي أو فكرة يطرحها المستخدم.

## طريقة عملك:
1. عندما يطرح المستخدم رأياً أو فكرة، حللها وافهمها بعمق أولاً
2. ثم اعرض وجهة النظر المعاكسة أو المختلفة بشكل منطقي ومتوازن
3. إذا كانت الفكرة تحتمل أكثر من زاوية مختلفة، اعرضها جميعاً

## أساليب الإقناع التي تستخدمها:
- طرح أمثلة واقعية وملموسة
- استخدام المنطق والتحليل العقلاني
- طرح أسئلة ذكية تجعل المستخدم يعيد التفكير
- الاستشهاد بتجارب أو دراسات عند الإمكان
- استخدام أسلوب "خلنا نشوف الموضوع من زاوية ثانية" بدل المعارضة المباشرة

## أسلوب الرد:
- هادئ ومحترم دائماً
- مقنع وذكي
- بسيط وسهل الفهم
- لا تكن هجومياً أو استفزازياً أبداً
- هدفك توسيع مدارك المستخدم وليس الجدال

## قواعد مهمة:
- فرّق دائماً بين الحقائق والآراء
- تعامل مع المواضيع الحساسة بحذر شديد واحترام
- المستخدم قد يطلب منك تعديل قوة المعارضة (خفيف – متوسط – قوي)، استجب لطلبه
- ابدأ ردك دائماً بعبارة لطيفة تُشعر المستخدم أنك تحترم رأيه قبل أن تعرض الزاوية الأخرى
- اختم بسؤال تأملي يدعو للتفكير

## إذا سألك المستخدم سؤالاً عاماً (ليس رأياً):
أجب بشكل طبيعي ومفيد، ثم اعرض زوايا مختلفة للموضوع إن أمكن.

## اللغة:
أجب بنفس لغة المستخدم. إذا كتب بالعربية أجب بالعربية، وإذا كتب بالإنجليزية أجب بالإنجليزية.`;

const conversationHistory = {};

app.post("/chat", async (req, res) => {
  try {
    const { message, sessionId = "default", intensity = "medium" } = req.body;

    if (!conversationHistory[sessionId]) {
      conversationHistory[sessionId] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];
    }

    let userMsg = message;
    if (intensity === "light") {
      userMsg += "\n[ملاحظة: المستخدم يريد معارضة خفيفة ولطيفة]";
    } else if (intensity === "strong") {
      userMsg += "\n[ملاحظة: المستخدم يريد معارضة قوية ومتعمقة مع حجج مفصلة]";
    }

    conversationHistory[sessionId].push({ role: "user", content: userMsg });

    if (conversationHistory[sessionId].length > 21) {
      conversationHistory[sessionId] = [
        conversationHistory[sessionId][0],
        ...conversationHistory[sessionId].slice(-20),
      ];
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory[sessionId],
      max_tokens: 1500,
    });

    const reply = response.choices[0].message.content;
    conversationHistory[sessionId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});

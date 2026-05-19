import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Schema } from '@google/genai';

dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const llmProviderName = process.env.LLM_PROVIDER || (process.env.ALIBABA_API_KEY ? 'Alibaba DashScope' : 'AIHubMix');
const llmApiKey = process.env.LLM_API_KEY || process.env.ALIBABA_API_KEY || process.env.AIHUBMIX_API_KEY;
const llmBaseUrl = process.env.LLM_BASE_URL || process.env.ALIBABA_BASE_URL || process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com/v1';
const llmModel = process.env.LLM_MODEL || process.env.ALIBABA_MODEL || process.env.AIHUBMIX_MODEL || 'gpt-5.5-free';
const llmApiMode = process.env.LLM_API_MODE || process.env.ALIBABA_API_MODE || process.env.AIHUBMIX_API_MODE || (llmModel.includes('gpt-5.5') ? 'responses' : 'chat');
const llmReasoningEffort = process.env.LLM_REASONING_EFFORT || process.env.AIHUBMIX_REASONING_EFFORT || 'medium';
const llmVerbosity = process.env.LLM_VERBOSITY || process.env.AIHUBMIX_VERBOSITY || 'low';

let gemini: GoogleGenAI | null = null;
if (!llmApiKey && process.env.GEMINI_API_KEY) {
  try {
    gemini = new GoogleGenAI({});
  } catch {
    console.error('Failed to initialize Gemini client. Check GEMINI_API_KEY in .env.local.');
  }
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    role: { type: Type.STRING, description: "The persona role: 'girlfriend', 'mom', or 'trendy'" },
    reply: { type: Type.STRING, description: "The warm main reply to the user" },
    cycle_judgment: { type: Type.STRING, description: "Judgment of the user's cycle phase, e.g., '经前期', '未知'" },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Name of the recommended item" },
          reason: { type: Type.STRING, description: "Why it is recommended" },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    },
    record: {
      type: Type.OBJECT,
      properties: {
        symptom: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        mood: { type: Type.INTEGER, description: "Mood score 1-5" },
        preference: { type: Type.STRING }
      }
    },
    follow_up_question: { type: Type.STRING, description: "A gentle follow-up question" },
    quick_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ["role", "reply", "cycle_judgment", "follow_up_question", "quick_actions"]
};

const jsonOutputInstruction = `
你必须只输出一个 JSON 对象，不要输出 Markdown，不要使用代码块。
JSON 字段必须包含：
{
  "role": "girlfriend | mom | trendy",
  "reply": "温暖回应与主要聊天文案",
  "cycle_judgment": "当前周期判断",
  "recommendations": [
    { "title": "推荐项", "reason": "推荐理由", "tags": ["标签"] }
  ],
  "record": {
    "symptom": ["症状"],
    "mood": 1,
    "preference": "偏好"
  },
  "follow_up_question": "一个温柔的追问",
  "quick_actions": ["快捷操作一", "快捷操作二"]
}
如果没有推荐项，recommendations 返回空数组。如果没有可记录信息，record 返回空对象。
`;

type ChatMessage = {
  role: 'user' | 'model' | 'assistant';
  parts?: { text?: string }[];
  content?: string;
};

function messageText(message: ChatMessage) {
  if (typeof message.content === 'string') return message.content;
  return message.parts?.map(part => part.text || '').join('\n') || '';
}

function transcriptFromMessages(messages: ChatMessage[]) {
  return messages
    .map(message => {
      const speaker = message.role === 'user' ? '用户' : '助手';
      return `${speaker}: ${messageText(message)}`;
    })
    .join('\n\n');
}

function extractTextFromResponse(data: any): string {
  if (typeof data?.output_text === 'string') return data.output_text;
  if (typeof data?.text === 'string') return data.text;
  if (typeof data?.choices?.[0]?.message?.content === 'string') {
    return data.choices[0].message.content;
  }

  const output = data?.output;
  if (Array.isArray(output)) {
    const chunks: string[] = [];
    for (const item of output) {
      if (typeof item?.content === 'string') chunks.push(item.content);
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (typeof content?.text === 'string') chunks.push(content.text);
        }
      }
    }
    if (chunks.length > 0) return chunks.join('\n');
  }

  return '';
}

function parseModelJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Model response was not valid JSON.');
  }
}

function normalizeChatResponse(value: any) {
  return {
    role: value?.role || 'trendy',
    reply: value?.reply || '我在呢，刚刚有点没听清。你可以再跟我说一遍吗？',
    cycle_judgment: value?.cycle_judgment || '未知',
    recommendations: Array.isArray(value?.recommendations) ? value.recommendations : [],
    record: value?.record && typeof value.record === 'object' ? value.record : {},
    follow_up_question: value?.follow_up_question || '你想先聊身体感受，还是今天吃什么？',
    quick_actions: Array.isArray(value?.quick_actions) ? value.quick_actions : []
  };
}

function normalizeFromModelText(text: string) {
  try {
    return normalizeChatResponse(parseModelJson(text));
  } catch {
    return normalizeChatResponse({
      role: 'trendy',
      reply: text.trim() || '我在呢，刚刚有点没听清。你可以再跟我说一遍吗？',
      cycle_judgment: '未知',
      recommendations: [],
      record: {},
      follow_up_question: '你想先聊身体感受，还是今天吃什么？',
      quick_actions: []
    });
  }
}

async function callOpenAiCompatible(messages: ChatMessage[], systemInstruction: string) {
  if (llmApiMode === 'chat') {
    return callChatCompletions(messages, systemInstruction);
  }

  return callResponses(messages, systemInstruction);
}

async function callResponses(messages: ChatMessage[], systemInstruction: string) {
  const input = [
    systemInstruction,
    jsonOutputInstruction,
    '-- 对话记录 --',
    transcriptFromMessages(messages)
  ].join('\n\n');

  const response = await fetch(`${llmBaseUrl}/responses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${llmApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: llmModel,
      input,
      reasoning: {
        effort: llmReasoningEffort
      },
      text: {
        verbosity: llmVerbosity
      },
      stream: false
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${llmProviderName} API error ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractTextFromResponse(data);
  if (!text) throw new Error(`Empty response from ${llmProviderName}.`);
  return normalizeFromModelText(text);
}

async function callChatCompletions(messages: ChatMessage[], systemInstruction: string) {
  const chatMessages = [
    {
      role: 'system',
      content: [systemInstruction, jsonOutputInstruction].join('\n\n')
    },
    ...messages.map(message => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: messageText(message)
    }))
  ];

  const response = await fetch(`${llmBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${llmApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: llmModel,
      messages: chatMessages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${llmProviderName} API error ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractTextFromResponse(data);
  if (!text) throw new Error(`Empty response from ${llmProviderName}.`);
  return normalizeFromModelText(text);
}

async function callGemini(messages: ChatMessage[], systemInstruction: string) {
  if (!gemini) {
    throw new Error('No AI provider configured. Set AIHUBMIX_API_KEY or GEMINI_API_KEY in .env.local.');
  }

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.7,
    }
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini.');
  return normalizeChatResponse(JSON.parse(text));
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array format' });
    }

    const result = llmApiKey
      ? await callOpenAiCompatible(messages, systemInstruction || '')
      : await callGemini(messages, systemInstruction || '');

    res.json(result);
  } catch (error: any) {
    console.error('Error calling AI provider:', error.message);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

app.listen(port, () => {
  const provider = llmApiKey ? `${llmProviderName} (${llmModel}, ${llmApiMode})` : gemini ? 'Gemini (gemini-2.5-flash)' : 'none';
  console.log(`Server listening on port ${port}. AI provider: ${provider}`);
});

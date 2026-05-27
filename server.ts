import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { retrieveKnowledgeContext } from './src/lib/knowledge/retrieve';
import { buildCycleReport, compactReportForPrompt, type CycleReport, type CycleReportInput } from './src/lib/reports/cycle-report';

dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = process.env.PORT || 3001;
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, 'dist');

app.use(express.json());

const llmProviderName = process.env.LLM_PROVIDER || (process.env.ALIBABA_API_KEY ? 'Alibaba DashScope' : 'AIHubMix');
const llmApiKey = process.env.LLM_API_KEY || process.env.ALIBABA_API_KEY || process.env.AIHUBMIX_API_KEY;
const llmBaseUrl = process.env.LLM_BASE_URL || process.env.ALIBABA_BASE_URL || process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com/v1';
const llmModel = process.env.LLM_MODEL || process.env.ALIBABA_MODEL || process.env.AIHUBMIX_MODEL || 'gpt-5.5-free';
const llmApiMode = process.env.LLM_API_MODE || process.env.ALIBABA_API_MODE || process.env.AIHUBMIX_API_MODE || (llmModel.includes('gpt-5.5') ? 'responses' : 'chat');
const llmReasoningEffort = process.env.LLM_REASONING_EFFORT || process.env.AIHUBMIX_REASONING_EFFORT || 'medium';
const llmVerbosity = process.env.LLM_VERBOSITY || process.env.AIHUBMIX_VERBOSITY || 'low';

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(llmApiKey || process.env.GEMINI_API_KEY),
  });
});

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
不要输出 <think>、思考过程、推理步骤、Prompt 分析、角色分析、回复计划或“我的回复要...”这类内部草稿。
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

const knowledgeGuardrailInstruction = `
月经相关回答的事实规则：
1. 如果系统提供了“知识库内容”，饮食、运动、疼痛缓解、身体机制解释必须优先基于这些内容。
2. 不要编造知识库里没有的医学结论、剂量、疗效承诺或禁忌。
3. 可以把知识库内容改写成符合角色的人话，但不要提“知识库”“检索”“资料显示”。
4. 如果知识不足，只能给低风险、保守建议，并引导用户继续记录或就医。
5. 不主动给药物剂量；提到止痛药时，提醒按说明书或医生建议使用，并说明明显加重或影响生活要就医。
`;

const cycleReportOutputInstruction = `
你必须只输出一个 JSON 对象，不要输出 Markdown，不要使用代码块。
这是经期 App 的周期复盘报告，不是医学诊断。
你只能基于提供的统计结果润色表达，不允许新增统计结果里没有的数据、次数、分数、日期或因果结论。
语气要克制、温柔、具体，避免“完全理解你”“一定会好”“根据研究”等 AI 味表达。
JSON 字段必须包含：
{
  "summary": "一句话总结",
  "metrics": [
    { "label": "疼痛记录", "current": "2 次 · 最高 7 分", "compare": "比上周期高 2 分", "note": "简短备注" }
  ],
  "clues": ["可能的观察线索，不超过 3 条"],
  "nextExperiment": "下个周期一个很小的实验",
  "disclaimer": "数据不足与非因果提醒"
}
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
  const cleaned = stripModelThinking(text)
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
    reply: cleanUserFacingText(value?.reply) || '我在呢，刚刚有点没听清。你可以再跟我说一遍吗？',
    cycle_judgment: value?.cycle_judgment || '未知',
    recommendations: Array.isArray(value?.recommendations) ? value.recommendations : [],
    record: value?.record && typeof value.record === 'object' ? value.record : {},
    follow_up_question: cleanUserFacingText(value?.follow_up_question) || '你想先聊身体感受，还是今天吃什么？',
    quick_actions: Array.isArray(value?.quick_actions) ? value.quick_actions : []
  };
}

function normalizeFromModelText(text: string) {
  const cleaned = cleanUserFacingText(text);
  try {
    return normalizeChatResponse(parseModelJson(cleaned));
  } catch {
    return normalizeChatResponse({
      role: 'trendy',
      reply: cleaned || '我在呢，刚刚有点没听清。你可以再跟我说一遍吗？',
      cycle_judgment: '未知',
      recommendations: [],
      record: {},
      follow_up_question: '你想先聊身体感受，还是今天吃什么？',
      quick_actions: []
    });
  }
}

function stripModelThinking(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/思考过程[:：][\s\S]*?(?=(\n\s*\{|"reply"|回复[:：]|$))/gi, '')
    .trim();
}

function cleanUserFacingText(value: unknown) {
  if (typeof value !== 'string') return '';

  const withoutThinking = stripModelThinking(value);
  const replyMarker = withoutThinking.match(/(?:最终回复|我的回复|回复)[:：]\s*([\s\S]*)/);
  const candidate = (replyMarker?.[1] || withoutThinking)
    .replace(/^\s*(?:角色语气|先肯定她的好状态|关心一下月经期身体|可能问一个温和的问题或记录)[^\n]*(?:\n|$)/gim, '')
    .replace(/^\s*\d+[.、]\s*(?:角色语气|先肯定|关心|可能问|回复计划|用户)[^\n]*(?:\n|$)/gim, '')
    .replace(/^\s*我的回复要[:：]?/gim, '')
    .trim();

  return candidate;
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

async function polishCycleReportWithOpenAiCompatible(localReport: CycleReport): Promise<CycleReport> {
  const input = [
    cycleReportOutputInstruction,
    '-- 本地统计结果，只能基于这些内容改写 --',
    JSON.stringify(compactReportForPrompt(localReport), null, 2)
  ].join('\n\n');

  const response = await fetch(`${llmBaseUrl}/${llmApiMode === 'chat' ? 'chat/completions' : 'responses'}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${llmApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(llmApiMode === 'chat'
      ? {
          model: llmModel,
          messages: [
            { role: 'system', content: cycleReportOutputInstruction },
            { role: 'user', content: input }
          ],
          temperature: 0.45
        }
      : {
          model: llmModel,
          input,
          reasoning: { effort: 'none' },
          text: { verbosity: 'low' },
          stream: false
        })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${llmProviderName} report API error ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractTextFromResponse(data);
  const parsed = parseModelJson(text);

  return {
    ...localReport,
    source: 'ai',
    summary: cleanUserFacingText(parsed.summary) || localReport.summary,
    metrics: Array.isArray(parsed.metrics) && parsed.metrics.length > 0 ? parsed.metrics.slice(0, 4).map((metric: any, index: number) => ({
      label: cleanUserFacingText(metric?.label) || localReport.metrics[index]?.label || '记录',
      current: cleanUserFacingText(metric?.current) || localReport.metrics[index]?.current || '',
      compare: cleanUserFacingText(metric?.compare) || localReport.metrics[index]?.compare || '',
      note: cleanUserFacingText(metric?.note) || localReport.metrics[index]?.note || ''
    })) : localReport.metrics,
    clues: Array.isArray(parsed.clues) && parsed.clues.length > 0
      ? parsed.clues.map((item: unknown) => cleanUserFacingText(item)).filter(Boolean).slice(0, 3)
      : localReport.clues,
    nextExperiment: cleanUserFacingText(parsed.nextExperiment) || localReport.nextExperiment,
    disclaimer: cleanUserFacingText(parsed.disclaimer) || localReport.disclaimer,
  };
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array format' });
    }

    const baseSystemInstruction = systemInstruction || '';
    const knowledgeContext = retrieveKnowledgeContext(messages, baseSystemInstruction);
    const enrichedSystemInstruction = [
      baseSystemInstruction,
      knowledgeGuardrailInstruction,
      knowledgeContext
    ].filter(Boolean).join('\n\n');

    const result = llmApiKey
      ? await callOpenAiCompatible(messages, enrichedSystemInstruction)
      : await callGemini(messages, enrichedSystemInstruction);

    res.json(result);
  } catch (error: any) {
    console.error('Error calling AI provider:', error.message);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

app.post('/api/cycle-report', async (req, res) => {
  try {
    const input = req.body as CycleReportInput;
    if (!input || typeof input !== 'object' || !input.journal || typeof input.journal !== 'object') {
      return res.status(400).json({ error: 'Invalid cycle report payload' });
    }

    const localReport = buildCycleReport(input);
    if (!localReport.hasEnoughData || !llmApiKey) {
      return res.json(localReport);
    }

    try {
      const polishedReport = await polishCycleReportWithOpenAiCompatible(localReport);
      return res.json(polishedReport);
    } catch (error: any) {
      console.error('Cycle report polish failed, returning local report:', error.message);
      return res.json(localReport);
    }
  } catch (error: any) {
    console.error('Error building cycle report:', error.message);
    res.status(500).json({ error: 'Failed to build cycle report', details: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, () => {
  const provider = llmApiKey ? `${llmProviderName} (${llmModel}, ${llmApiMode})` : gemini ? 'Gemini (gemini-2.5-flash)' : 'none';
  console.log(`Server listening on port ${port}. AI provider: ${provider}`);
});

# 开发文档 — 小岛日记 (InnerTide)

> 基于 PRD 与现有代码审计生成。**不确定项**以 `[待确认]` 标注。

---

## 1. 项目目标

构建一款面向女性用户的经期追踪与自我关怀应用。核心教学/交付重点：

1. **完整的前端交互闭环**：首页（Today）→ 日记（Journal）→ 设置（About）+ 悬浮聊天（ChaoChat）四大模块可用。
2. **周期引擎驱动 UI**：用户输入"上次月经第一天"后，系统自动推算周期阶段，并联动视觉、推荐、聊天语境。
3. **AI 智能能力集成**：通过后端 OpenAI-compatible 代理驱动对话（ChaoChat），当前已接入阿里百炼 DashScope / Qwen，保留 Gemini 兜底；LetterPanel 当前仍为本地 fallback。
4. **数据持久化**：所有用户偏好、日记、信件通过 LocalStorage 存取，刷新不丢失。

---

## 2. 任务清单

### 2.1 必须完成 (Must-Have)

| # | 模块 | 任务 | 当前状态 | 具体完成标准 |
|---|------|------|----------|-------------|
| M1 | 周期引擎 | `computeCycleState()` 正确推算四个阶段 | ✅ 已实现 | 单元可验证：给定 `lastPeriodStart` 和 `cursorDate`，返回正确 `phase` 和 `cycleDay` |
| M2 | 首页 | FloatingIsland 随 `phase` + `mood` 变化渲染 | ✅ 已实现 | 四阶段拥有同构图但不同细节的浮岛图案：冬=休息包裹，春=新芽花粉，夏=盛放光晕，秋=落叶收束 |
| M3 | 首页 | DailyTips 展示饮食/运动/工作建议 | ✅ 已实现 | 四阶段均显示“今日饮食/运动/工作建议”；月经期 1-7 天有详细三餐，非月经期有阶段默认建议；偏好标签影响推荐文案 |
| M4 | 首页 | 底栏导航高亮当前阶段（冬春夏秋） | ✅ 已实现 | 当前阶段高亮 + 放大；底栏可点击预览冬春夏秋四阶段 |
| M5 | 日记 | 情绪日历网格渲染 | ✅ 已实现 | 已记录的天显示 StatusIcon，未来日期禁用 |
| M6 | 日记 | 日记文本自动保存 | ✅ 已实现 | `setJournalNote` 实时写入 LocalStorage |
| M7 | 日记 | 疼痛记录弹窗（0-5 级 + 部位多选） | ✅ 已实现 | 仅当日可用；选择后持久化至 `journal[date].pain` |
| M8 | 日记 | 疗愈回信（LetterPanel）生成 | ⚠️ 部分完成 | **当前为 mock fallback**，需接入后端大模型代理真实生成 |
| M9 | 日记 | 经期结束自动触发 cycle-end 回信 | ✅ 逻辑已实现 | `cycleDay === periodLength + 1` 时自动调用 `generate("cycle-end")` |
| M10 | 设置 | 昵称、上次经期日期、TTS 开关 | ✅ 已实现 | 修改后立即同步至 store |
| M11 | 设置 | 饮食偏好面板完整 | ✅ 已实现 | 过敏原、宗教禁忌、饮食模式、健康目标、口味偏好均可选 + 保存 |
| M12 | 设置 | 运动偏好面板完整 | ✅ 已实现 | 身体状态、运动目标、场景、避坑项均可选 + 保存 |
| M13 | 聊天 | ChaoChat 基础对话流与快捷指令 | ✅ 已实现 | 接入后端 `/api/chat`；解析结构化 JSON 响应；渲染回复、推荐卡片和 Quick Actions；异常时显示兜底文案 |
| M14 | 聊天 | 三种人格切换与状态文案 | ✅ 已实现 | 切换后开场白变化；顶部角色状态文案已实现；Prompt 注入角色专属语气，妈妈角色已调为克制照顾型 |
| M15 | 聊天 | 安全防线 (Crisis Detection) | ❌ 未实现 | `detectCrisis()` 需补充抑郁/自残关键词列表。触发后展示国内心理求助热线（如 400-161-9995 等） |
| M16 | 状态管理 | LocalStorage 持久化 + 数据迁移 | ✅ 已实现 | `dietPreferences` 和 `exercisePreferences` 已含向后兼容迁移 |
| M17 | 路由 | Hash 路由 `/today`、`/journal`、`/about` | ✅ 已实现 | — |
| M18 | 首页 | 四阶段 BGM 与音量控制 | ✅ 已实现 | 右上角透明喇叭按钮；用户点击后播放；切换阶段自动换音乐；支持暂停、音量滑杆、点击页面其他区域隐藏音量条 |

### 2.2 加分项 (Nice-to-Have)

| # | 模块 | 任务 | 说明 |
|---|------|------|------|
| N1 | 首页 | 流体星球（Metaball）SVG Filter 效果 | App.tsx 已定义 `#fluid` 和 `#fluid-soft` filter，但 FloatingIsland 未使用 |
| N2 | 日记 | 真实经期打卡与周期推算 | 按照同类应用的通用交互，在日历页或首页增加“经期开始/结束”的真实点击打卡按钮，取代单纯的自动推算，并基于真实记录动态计算周期长度 |
| N3 | 日记 | 回信支持多种 AI 源切换 | 当前 store 预留了 `source: 'deepseek' | 'fallback'`，后续可扩展为通用模型接口设计 |
| N4 | 设置 | 过敏原/宗教禁忌 自定义输入框功能完善 | `<input>` 存在但无 `onChange`/`onKeyDown` 处理，输入不会保存 |
| N5 | 设置 | TTS 语音陪伴实际集成 | 预留接入阿里云 TTS 接口的逻辑，用于支持温暖自然的语音播报 |
| N6 | 聊天 | 呼吸交互动画 | 已有 `animate-breathe` CSS，光圆有 pulse，但无用户可触发的深呼吸引导模式 |
| N7 | 饮食 | 非月经期（卵泡期/排卵期/黄体期）食谱数据 | ✅ 已实现：`daily-recommendations.ts` 为卵泡期、排卵期、黄体期提供默认三餐与运动/工作建议 |
| N8 | 全局 | 响应式 / PWA 支持 | 当前 `max-w-md` 固定移动端宽度，无 PWA manifest |
| N9 | 全局 | UI 细节高保真对齐 | 调整现有细节以完全对齐视觉图。如：将各页的“小岛日记”统一改为“心潮日记”；将日历网格的情绪高亮样式改为纯色背景圆圈（而非底部圆点）；统一顶部 Header 的左右对齐排版。 |

---

## 3. 产出细节

### 3.1 M8 — LetterPanel 接入大模型代理

**文件**：`src/components/innertide/letter-panel.tsx`

- 将 `generate()` 中的 `setTimeout` mock 替换为对后端大模型代理的实际调用。
- Prompt 应包含：时间范围内的日记摘要（mood + note）、当前周期阶段、用户昵称。
- 返回文本写入 `record.body`，`source` 设为 `'deepseek'`（`[待确认]` 是否改为 `'gemini'`）。
- 失败时 fallback 到当前本地文案逻辑。

### 3.2 M13 & M14 — ChaoChat 核心逻辑与 Agent 设计 (前端 + 后端)

**前端文件**：`src/components/innertide/chao-chat.tsx`
**后端/配置**：`src/lib/companion/prompts.ts` 及 API Route

本次更新将 ChaoChat 升级为基于结构化输出的 Agent，具备明确的角色分工和交互机制。

#### 1. 前端 UI 补充
- **角色状态文案**：在顶部三个角色下方补充一句短文案强化心智：
  - 闺蜜：不评判，只陪你
  - 妈妈：慢一点，先照顾身体
  - 潮：想吃什么，我来选
- **快捷按钮 (Quick Actions)**：在输入框上方或区域内，提供角色专属的快捷点击按钮：
  - *闺蜜模式*：[我今天有点 emo] [我想吃甜的] [我想被安慰]
  - *妈妈模式*：[记录今天症状] [我肚子不舒服] [今天该注意什么]
  - *潮模式*：[今天喝什么] [帮我点奶茶] [经期友好外卖]

#### 2. 后端大模型 Prompt 架构 (Base + 3 Personas)
采取“全局底座提示词 + 独立角色提示词”的策略。
- **全局底座 (Base Prompt)**：
  - 定义安全边界（不替代医生诊断）。
  - 提供环境上下文（用户的周期阶段、症状、偏好）。
  - 规定安全防线触发条件（剧烈腹痛、极端情绪等，配合 M15）。
- **角色分工**：
  - **闺蜜 (Bestie)**：主打情绪陪伴。接住情绪、共情回应、提供轻量建议。绝不说教。
  - **妈妈 (Mother)**：主打身体照顾。周期解释、记录症状、风险兜底、温柔提醒休息。
  - **潮 (Tide)**：主打饮食/生活推荐。解决“今天吃什么/喝什么”，提供点单改良建议（如：热豆乳、少糖）和风险标签。

#### 3. API JSON 数据结构约定
为了让前端能实现“推荐卡片”、“打卡记录提取”以及“快捷按钮渲染”，大模型需统一返回以下 JSON 结构，前端解析后再做富文本或卡片渲染：

```json
{
  "role": "girlfriend | mom | trendy",
  "reply": "温暖回应与主要聊天文案",
  "cycle_judgment": "当前周期判断",
  "recommendations": [
    {
      "title": "热豆乳拿铁",
      "reason": "低负担且能满足甜食欲",
      "tags": ["低咖啡因", "暖胃", "经期友好"]
    }
  ],
  "record": {
    "symptom": ["腹部不适"],
    "mood": 1,
    "preference": "避开高咖啡因"
  },
  "follow_up_question": "你是想喝点甜的，还是热乎的？",
  "quick_actions": ["帮我点饮品", "我想被安慰"]
}
```
*前端拿到上述数据后，将 `reply` 和 `follow_up_question` 作为气泡渲染；将 `recommendations` 渲染为特殊的饮食建议卡片；并自动使用 `record` 字段更新用户的本地健康日志。*

### 3.3 M15 — Crisis Detection 实现

**文件**：`src/lib/data/safety-keywords.ts`

- 补充中文关键词列表（如：自杀、自残、不想活、割腕、跳楼等）。
- `detectCrisis()` 实现关键词匹配逻辑（精确 or 正则）。
- `CRISIS_RESOURCE` 补充实际内容：
  - 全国心理援助热线：400-161-9995
  - 北京心理危机研究与干预中心：010-82951332
  - 生命热线：400-821-1215
  - `[待确认]` 是否需要国际热线

### 3.4 N3 — 周期统计动态化

**文件**：`src/app/(app)/journal/page.tsx`（约 L70-L99）

- 当前"28 天 / 5 天 / 稳定"硬编码于 JSX。
- 需要：遍历 `store.journal` 中的 `pain` 数据或另设经期开始/结束标记，计算近 N 次周期平均值。
- `[待确认]` 用户是否手动标记每次经期开始/结束，还是仅靠 `lastPeriodStart` 单次推算。

### 3.5 N5 — 自定义输入框保存

**文件**：`src/app/(app)/about/page.tsx`（约 L180-L197）

- 两个 `<input placeholder="其他过敏原/其他禁忌">` 缺少事件处理。
- 需要：监听回车或失焦，将输入值 push 到对应数组（`allergies` / `religion`）。

### 3.6 首页四阶段视觉、建议与 BGM（已实现）

**核心文件**：
- `src/app/(app)/today/page.tsx`
- `src/components/innertide/floating-island.tsx`
- `src/components/innertide/daily-tips.tsx`
- `src/components/innertide/bgm-toggle.tsx`
- `src/data/daily-recommendations.ts`
- `public/audio/`

#### 1. 四阶段预览

首页底部 `冬 / 春 / 夏 / 秋` 目前既是阶段展示，也是预览切换入口。

- 点击 `冬`：预览月经期。
- 点击 `春`：预览卵泡期。
- 点击 `夏`：预览排卵期。
- 点击 `秋`：预览黄体期。

该预览状态只影响当前首页展示，不会写入用户周期数据。真实阶段仍由 `computeCycleState()` 根据 `lastPeriodStart` 推算。

#### 2. 四阶段浮岛图案

`FloatingIsland` 保留同一座浮岛的构图、小屋、岩层、人物剪影和云雾系统，但按阶段切换视觉细节：

| 阶段 | 视觉状态 | 身体感受表达 |
|---|---|---|
| 月经期 / 冬 | 暖粉紫、浓一点的雾、小屋暖光、慢粒子 | 休息、释放、被包裹 |
| 卵泡期 / 春 | 嫩芽、浅绿苔藓、花粉、晨光 | 恢复、轻盈、重新生长 |
| 排卵期 / 夏 | 盛放花点、强光晕、闪光花瓣 | 能量、外放、连接 |
| 黄体期 / 秋 | 金棕落叶、暖褐地表、收束雾气 | 沉淀、敏感、保护边界 |

#### 3. 四阶段今日建议

`DailyTips` 已从月经期专用改为四阶段通用展示。每个阶段都展示：

- 今日饮食建议：早餐、午餐、晚餐。
- 今日运动建议：推荐项目、注意事项。
- 今日工作建议：状态分析、任务安排、心理调适。

饮食数据遵循同一 `DietRecommendation` 结构，并在 `daily-recommendations.ts` 中由 `getDailyRecommendation(phase, cycleDay)` 提供。

#### 4. BGM 控制

`BgmToggle` 位于首页右上方，为透明玻璃风格按钮。

交互规则：
- 默认关闭，不自动播放有声音乐，遵守浏览器自动播放限制。
- 用户点击喇叭后播放当前阶段 BGM，默认音量 `28%`。
- 音乐开启后显示音量滑杆，用户可在 `0-100` 间调节。
- 音量会写入 `localStorage` 的 `innertide-bgm-volume`，刷新后保留。
- 点击页面其他区域会隐藏音量条，但不会停止音乐。
- 音量条隐藏时再点喇叭会重新展开；音量条展开时点喇叭会关闭音乐。
- 切换冬春夏秋时，如果音乐处于开启状态，会自动切换到对应阶段的音频。

音频文件约定：

```txt
public/audio/menstrual.mp3    # 月经期 / 冬
public/audio/follicular.mp3   # 卵泡期 / 春
public/audio/ovulatory.mp3    # 排卵期 / 夏
public/audio/luteal.mp3       # 黄体期 / 秋
```

当前本地分配：

| 阶段 | 源文件 | 发布路径 |
|---|---|---|
| 月经期 / 冬 | `Gentle Rain_no-watermark.mp3` | `/audio/menstrual.mp3` |
| 卵泡期 / 春 | `Little by Little_no-watermark.mp3` | `/audio/follicular.mp3` |
| 排卵期 / 夏 | `Easy Now_watermark (1).mp3` | `/audio/ovulatory.mp3` |
| 黄体期 / 秋 | `Gentle Slumber_no-watermark.mp3` | `/audio/luteal.mp3` |

部署说明：Vite 构建时会把 `public/audio/*` 复制到 `dist/audio/*`，因此正常部署整个站点时，音乐会随网站一起发布。若后续访问量较大，建议迁移到 OSS/COS/R2/CDN，并把 `PHASE_BGM` 中的本地路径替换为云端 URL。

### 3.7 模型接入与聊天修复（已实现）

**核心文件**：
- `server.ts`
- `src/components/innertide/chao-chat.tsx`
- `src/lib/companion/prompts.ts`

#### 1. 后端模型代理

后端目前支持通用 OpenAI-compatible 配置，优先使用以下变量：

```bash
LLM_PROVIDER="Alibaba DashScope"
LLM_API_KEY="..."
LLM_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
LLM_MODEL="qwen3.6-flash"
LLM_API_MODE="chat"
```

当前 demo 使用阿里百炼 `qwen3.6-flash`。后端仍兼容：
- AIHubMix：`AIHUBMIX_*`
- Gemini SDK：`GEMINI_API_KEY`（当无 `LLM_API_KEY` 时兜底）

#### 2. Prompt 注入

前端在发送消息前调用 `buildSystemInstruction(persona, context)`，将以下内容注入模型：
- 全局女性周期与生活方式 Agent 底座 Prompt。
- 当前角色 Prompt：闺蜜 / 妈妈 / 潮。
- 当前周期阶段、情绪和饮食偏好。
- 后端额外追加 JSON 输出格式要求。

三角色语气：
- 闺蜜：共情、陪伴、允许情绪。
- 妈妈：克制的照顾型语气，避免“宝贝”“乖”“妈妈心疼”等过甜称呼。
- 潮：点单推荐官，直接给 2-3 个可执行吃喝方案。

#### 3. 已修复聊天边界

- `chao-chat.tsx` 曾把 `store.lastPeriodStart` 字符串直接传给 `computeCycleState()`，导致前端在请求前抛错并显示“网络请求失败”。现已改为 `new Date(store.lastPeriodStart)`。
- `store.dietPreferences.pattern` 字段不存在，现已改为读取真实字段：`dietMode`、`healthGoals`、`avoid`。
- 后端现在会尝试解析模型 JSON；若模型偶尔返回纯文本，会将原文包装为 `reply` 返回，避免前端误判为网络失败。

---

## 4. 系统架构设计 (System Architecture)

### 4.1 模块拆分与职责

系统分为 **前端 (Client)** 和 **后端 (Server)** 两大运行时，通过 `/api/*` 接口通信。

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Vite + React)                │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 首页     │  │ 日记页   │  │ 设置页   │  ← 页面层 │
│  │ Today    │  │ Journal  │  │ About    │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │               │
│  ┌────┴──────────────┴──────────────┴────┐          │
│  │          UI 组件层 (components/)       │          │
│  │  FloatingIsland | ChaoChat | DailyTips│          │
│  │  BgmToggle | LetterPanel | ChaoFab    │          │
│  └────────────────┬──────────────────────┘          │
│                   │                                  │
│  ┌────────────────┴──────────────────────┐          │
│  │          核心逻辑层 (lib/)             │          │
│  │  store.ts    → 全局状态 + 持久化       │          │
│  │  cycle/      → 周期计算引擎           │          │
│  │  companion/  → Prompt + 角色配置      │          │
│  │  data/       → 安全防线              │          │
│  └────────────────┬──────────────────────┘          │
│                   │ fetch('/api/*')                  │
├───────────────────┼─────────────────────────────────┤
│                   ▼                                  │
│  ┌────────────────────────────────────────┐          │
│  │         后端 (Express / server.ts)     │          │
│  │  /api/chat   → AI 对话代理            │          │
│  │  /api/letter → 回信生成代理           │          │
│  │  /api/tts    → 语音合成代理 (未来)    │          │
│  └────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

各模块职责边界如下：

| 模块 | 路径 | 职责 | **不做什么** |
|------|------|------|------------|
| **页面层** | `src/app/(app)/*/page.tsx` | 组合组件、传递 props、处理路由参数 | 不含业务逻辑计算、不直接调 API |
| **UI 组件** | `src/components/innertide/` | 渲染 UI、处理用户交互事件、调用 lib 层方法 | 不保存全局状态、不直接访问 localStorage |
| **状态管理** | `src/lib/store.ts` | 全局数据的唯一入口：读写 LocalStorage、提供 `update()` 方法 | 不含任何 UI 渲染逻辑 |
| **周期引擎** | `src/lib/cycle/` | 纯函数：输入日期 → 输出阶段/天数 | 不访问 store、不做 IO |
| **AI 配置** | `src/lib/companion/` | 管理 Prompt 文本、角色标签、快捷指令配置 | 不发网络请求、不调用 SDK |
| **安全防线** | `src/lib/data/safety-keywords.ts` | 纯函数：输入文本 → 输出是否危机 | 不访问网络 |
| **静态数据** | `src/data/` | 饮食/运动推荐的本地数据源 | 不含逻辑 |
| **BGM 控制** | `src/components/innertide/bgm-toggle.tsx` | 控制四阶段背景音播放、暂停、音量和阶段切换 | 不管理音频文件上传、不自动播放有声音乐 |
| **后端代理** | `server.ts` | 持有 API Key、调用大模型 API、清洗 JSON 返回 | 不含前端 UI 代码、不读 LocalStorage |

### 4.2 目录结构 (现状 + 规划新增)

```
心潮/
├── server.ts                            # [后端] Express API 代理入口
├── .env.local                           # [后端] API Key（不提交 git）
├── .env.example                         # [后端] Key 模板
├── public/
│   └── audio/                            # [静态资源] 四阶段 BGM
│       ├── menstrual.mp3
│       ├── follicular.mp3
│       ├── ovulatory.mp3
│       └── luteal.mp3
│
├── src/
│   ├── App.tsx                          # 路由入口 + SVG 全局 filter
│   ├── main.tsx                         # React 挂载
│   ├── index.css                        # 全局样式 + CSS 变量 + 动画
│   │
│   ├── app/(app)/                       # ─── 页面层 ───
│   │   ├── today/page.tsx               #   首页：浮岛 + 每日建议
│   │   ├── journal/page.tsx             #   日记页：日历 + 记录 + 回信
│   │   └── about/page.tsx               #   设置页：偏好配置
│   │
│   ├── components/innertide/            # ─── UI 组件层 ───
│   │   ├── bgm-toggle.tsx               #   四阶段 BGM 播放与音量控制
│   │   ├── chao-chat.tsx                #   AI 聊天面板（含推荐卡片渲染）
│   │   ├── chao-fab.tsx                 #   悬浮唤起按钮
│   │   ├── floating-island.tsx          #   浮岛 SVG 渲染
│   │   ├── daily-tips.tsx               #   每日饮食/运动/工作卡片
│   │   ├── letter-panel.tsx             #   疗愈回信面板
│   │   ├── island-statement.tsx         #   岛屿文案
│   │   ├── mode-controller.tsx          #   疗愈/共振模式切换
│   │   └── breath-points.tsx            #   呼吸光点
│   │
│   ├── lib/                             # ─── 核心逻辑层 ───
│   │   ├── store.ts                     #   全局状态 + LocalStorage 持久化
│   │   ├── cycle/
│   │   │   └── phases.ts                #   周期阶段计算（纯函数）
│   │   ├── companion/
│   │   │   └── prompts.ts               #   Prompt 底座 + 3角色 + 快捷指令
│   │   ├── data/
│   │   │   └── safety-keywords.ts       #   安全关键词检测（纯函数）
│   │   └── next-link-mock.tsx           #   Next.js Link 兼容 mock
│   │
│   └── data/                            # ─── 静态数据层 ───
│       ├── diet.ts                      #   月经期 7 天三餐数据
│       └── daily-recommendations.ts     #   四阶段饮食/运动/工作建议
│
├── package.json
├── vite.config.ts                       # Vite 配置 + /api 代理规则
├── tsconfig.json
├── prd.md
└── development.md                       # 本文件
```

### 4.3 关键数据结构

#### 4.3.1 前端全局状态 (`State` in store.ts)

```typescript
interface State {
  // ── 用户身份 ──
  nickname: string | null;

  // ── 周期核心 ──
  lastPeriodStart: string | null;       // ISO 日期，"上次月经第一天"
  cycleLength: number;                   // 默认 28，未来可根据 periodHistory 动态计算
  periodHistory: PeriodRecord[];         // [待开发] 真实打卡历史

  // ── 偏好开关 ──
  ttsEnabled: boolean;
  appMode: 'healing' | 'resonance';
  persona: 'bestie' | 'mother' | 'tide';

  // ── 日记与回信 ──
  journal: Record<string, JournalEntry>;  // key = 'YYYY-MM-DD'
  letters: Record<string, LetterRecord>;  // key = 创建时间戳

  // ── 饮食/运动偏好 ──
  dietPreferences: DietPrefs;
  exercisePreferences: ExercisePrefs;
}
```

#### 4.3.2 日记条目 (`JournalEntry`)

```typescript
interface JournalEntry {
  mood?: number;               // 1-5 情绪等级
  pain?: {
    level: number;             // 0-5 疼痛等级
    locations: string[];       // ["腹部", "腰部", ...]
  };
  note?: string;               // 自由文本日记
  mode?: 'healing' | 'resonance';
}
```

#### 4.3.3 经期打卡记录 (`PeriodRecord`) — [待开发]

```typescript
interface PeriodRecord {
  start: string;               // ISO 日期，经期开始
  end: string | null;          // ISO 日期，经期结束（进行中为 null）
}
```

#### 4.3.4 AI 聊天 API 请求/响应

**请求体** (前端 → 后端 `/api/chat`)：
```typescript
interface ChatRequest {
  messages: { role: 'user' | 'model', parts: { text: string }[] }[];
  systemInstruction: string;   // 由 buildSystemInstruction() 在前端组装
}
```

**响应体** (后端 → 前端)：
```typescript
interface ChatResponse {
  role: 'girlfriend' | 'mom' | 'trendy';
  reply: string;                           // 主要文案
  cycle_judgment: string;                  // 周期判断
  recommendations?: {                      // 推荐卡片（潮角色常有）
    title: string;
    reason: string;
    tags: string[];
  }[];
  record?: {                               // 静默写入 store 的健康打卡
    symptom?: string[];
    mood?: number;
    preference?: string;
  };
  follow_up_question: string;              // 追问
  quick_actions: string[];                 // 下一轮快捷按钮
}
```

#### 4.3.5 回信记录 (`LetterRecord`)

```typescript
interface LetterRecord {
  createdAt: string;
  scope: 'week' | 'fortnight' | 'month' | 'cycle-end';
  rangeStart: string;
  rangeEnd: string;
  body: string;
  source: 'ai' | 'fallback';              // 之前是 'deepseek'，统一改为 'ai'
}
```

### 4.4 权限隔离与边界

| 边界 | 规则 | 原因 |
|------|------|------|
| **API Key 绝不出现在前端** | Key 只存在于 `server.ts` 运行时通过 `process.env` 读取 | 前端代码可被用户 F12 查看，Key 一旦泄露账单爆炸 |
| **前端不直接调用大模型 SDK** | 所有大模型调用走 `fetch('/api/...')`，由后端代理完成 | 保持前后端职责隔离，方便未来换模型 |
| **store.ts 是唯一写 LocalStorage 的模块** | 其他模块通过 `useInnertideStore().update()` 间接修改 | 避免多处读写造成数据不一致 |
| **周期引擎 (`phases.ts`) 是纯函数** | 输入日期 + 参数，输出结果。不访问 store、不做副作用 | 方便单元测试、保证可预测性 |
| **安全防线在前端拦截，不依赖大模型** | `detectCrisis()` 在调 API 之前执行。如果命中关键词，直接阻断请求、就地展示热线 | 大模型可能回复不当甚至附和极端内容，必须在客户端先拦一道 |
| **Prompt 配置与 SDK 调用分离** | `prompts.ts`（前端）只负责拼接文本，`server.ts`（后端）只负责发送请求 | 方便独立修改 Prompt 而不碰后端代码，也方便后端换 SDK |
| **静态数据 (`data/`) 与组件分离** | 饮食数据以纯对象/数组导出，组件只负责读取渲染 | 方便以后接数据库或 CMS 替换 |

### 4.5 技术栈确认

| 项 | 选型 |
|----|------|
| 前端框架 | React 19 + TypeScript + Vite 6 |
| 样式 | TailwindCSS v4（通过 `@tailwindcss/vite` 插件） |
| 动画 | Framer Motion (`motion/react`) |
| 前端路由 | 自实现 hash router（`App.tsx` 中 `hashchange` 监听） |
| 状态管理 | 自定义 hook `useInnertideStore` + LocalStorage |
| 后端 | Express 4 + tsx（TypeScript 直接运行） |
| 大模型调用 | OpenAI-compatible HTTP API（当前阿里百炼 DashScope `qwen3.6-flash`）；保留 `@google/genai` 作为 Gemini 兜底 |
| TTS | 阿里云 DashScope TTS（待接入） |
| 路径别名 | `@` → `./src`（vite.config.ts） |

---

## 6. 启动方式

```bash
npm install
# 在 .env.local 中设置 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
npm run dev        # http://localhost:3000
npm run server     # http://localhost:3001，用于 /api/chat
```

当前推荐 `.env.local` 示例：

```bash
LLM_PROVIDER="Alibaba DashScope"
LLM_API_KEY="YOUR_DASHSCOPE_KEY"
LLM_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
LLM_MODEL="qwen3.6-flash"
LLM_API_MODE="chat"
```

---

## 7. 待确认问题汇总

| # | 问题 | 影响范围 |
|---|------|----------|
| Q1 | API 接口封装与未来迁移 | 已知未来可能会将 Gemini 换成其他模型，调用逻辑需做一层抽象封装，避免与特定 SDK 强绑定 |

---

## 8. 容易翻车的地方 (Technical Risks & Pitfalls)

在执行后续开发时，极大概率会遇到以下技术痛点，需提前防范：
1. **API Key 泄露风险**：绝不能在前端直连大模型 API。必须通过 Node.js/Express 搭建中间层。
2. **大模型 JSON 输出不稳定**：大模型有时会返回带有 Markdown 格式的字符串（如 ```json ... ```）或直接返回纯文本。当前后端已做 JSON 清洗和纯文本包装兜底，避免前端崩溃。
3. **LocalStorage 容量爆炸**：日记和回信如果过多，极可能突破浏览器 5MB 限制导致存不进去。未来如数据量大，需要考虑降级清理或引入 IndexedDB。
4. **流式输出 (Streaming) 与 JSON 解析的冲突**：如果让大模型流式输出（打字机效果），是无法在半途正确解析 JSON 的。如果要流式输出，必须前后端分离特定的流式数据字段，否则只能做“整块返回”再渲染。这是 M13 最大的技术矛盾点，目前建议**第一版先做整块返回（非流式）**。

---

## 9. 技术架构与开发实现规划 (Implementation Plan)

为了确保开发路径清晰且技术可行，以下是将所有未完成功能（前端表现与技术实现）落实的具体规划分期。

### Phase 1: 核心 Agent 对话与结构化流式输出 (M13, M14, M8)
- **前端功能**：
  - 重构 ChaoChat 聊天框 UI，支持展示“饮食推荐卡片”（带 Tag 标签）及“快捷选项按钮”。
  - 补充顶部角色切换时的专属副标题。
  - LetterPanel（回信）接入真实大模型。
- **技术实现**：
  - **后端代理**：由于前端直连大模型不安全且暴露 Key，将利用 `package.json` 中已安装的 `express` 创建一个轻量级本地服务 (`server.ts`) 作为 API Proxy，封装 OpenAI-compatible / Gemini 的调用逻辑。
  - **结构化输出 (Structured Output)**：通过 Prompt 强约束或 Gemini Schema，要求大模型按照前文定义的 JSON 格式返回 `reply`、`recommendations` 等字段；若模型返回纯文本，后端包装成可渲染回复。
  - **前端状态流转**：前端拿到 JSON 后，解析 `record` 字段，直接调用 `useInnertideStore.getState().update()` 将用户的健康数据静默存入 LocalStorage。

### Phase 2: 真实经期打卡与动态周期计算 (N2)
- **前端功能**：
  - 日历页或首页下方增加“经期开始”/“经期结束”的明确打卡入口。
  - 页面顶部“周期长度”、“经期长度”等数据从写死变为根据历史真实打卡数据动态显示。
- **技术实现**：
  - **数据结构重构**：在 `useInnertideStore` 中新增 `periodHistory: { start: string, end: string }[]` 数组。
  - **算法重写**：重构 `src/lib/cycle/phases.ts` 中的 `computeCycleState` 函数。遍历 `periodHistory`，动态计算过去 N 次的平均周期长度和平均流血天数，并据此推算今天属于四大阶段（冬春夏秋）中的哪一个阶段。

### Phase 3: 安全防线与第三方 TTS 接入 (M15, N5)
- **前端功能**：
  - 对话触发极端词汇时，聊天框阻断大模型胡言乱语，弹框或直接回复国内救助热线。
  - 设置页打开“语音陪伴”后，聊天界面的助手回复可点击播放真实语音。
- **技术实现**：
  - **关键词匹配**：完善 `safety-keywords.ts`，利用正则表达式在发送消息前对 `input` 文本进行预处理拦截。
  - **阿里云 TTS 接入**：在后端服务中封装一个转语音接口，传入文本，调用阿里 DashScope API 返回音频流或音频 URL，前端利用 HTML5原生 `new Audio(url).play()` 实现无缝播放。

### Phase 4: 高保真 UI 细节对齐 (N9)
- **前端功能**：
  - 彻底将文案统一为“心潮日记”。
  - 日历网格的视觉重构，还原设计图的“纯色圆环高亮”而非“圆点”。
- **技术实现**：
  - 全局搜索替换遗留文本。
  - 修改 `src/app/(app)/journal/page.tsx` 中日历日期的渲染逻辑（`<button>` 样式）：依据日期对应的 `mood` 或 `phase` 属性，通过 Tailwind 动态绑定背景色（如 `bg-orb-menstrual/20`），并移除原本的 `StatusIcon` 底部圆点组件。

---

## 10. 异常路径与边界处理 (Exception & Boundary Handling)

### 10.1 异常路径清单

| # | 场景 | 触发条件 | 预期行为 | 责任模块 |
|---|------|----------|----------|----------|
| E1 | API Key 未配置 | `.env.local` 中无 `LLM_API_KEY` / `AIHUBMIX_API_KEY` / `GEMINI_API_KEY` | 后端 `/api/chat` 返回 500；前端显示友好兜底文案 | `server.ts` |
| E2 | 大模型返回非法 JSON | 模型返回 Markdown、纯文本或截断文本 | 后端优先清洗并解析 JSON；解析失败时将原文包装进 `reply` 返回，避免前端误判为断网 | `server.ts` → `chao-chat.tsx` |
| E3 | 大模型超时/网络断开 | 模型 API 无响应或网络中断 | 前端 fetch 失败后显示兜底文案；不阻塞 UI | `chao-chat.tsx` |
| E4 | 用户输入极端关键词 | 文本命中 `detectCrisis()` | **阻断 API 请求**，直接在前端显示国内心理援助热线 | `safety-keywords.ts` → `chao-chat.tsx` |
| E5 | 用户输入空字符串 | 输入框为空或纯空格 | 发送按钮 disabled，不触发任何请求 | `chao-chat.tsx` |
| E6 | LocalStorage 写入失败 | 存储超过 5MB 或隐私模式 | `try-catch` 静默失败，不崩溃。console.warn 记录 | `store.ts` |
| E7 | `lastPeriodStart` 为 null | 新用户未设置经期日期 | `computeCycleState` 返回默认值 `follicular` + `cycleDay: 10` | `phases.ts` |
| E8 | 后端服务未启动 | 用户只跑了 `npm run dev` 没跑 `npm run server` | 前端 fetch 失败，显示兜底文案"网络请求失败"。不影响其他页面的正常浏览 | `chao-chat.tsx` |
| E9 | 日历选择未来日期 | 用户点击今天之后的日期 | 不可点击（disabled）。不弹出日记编辑面板 | `journal/page.tsx` |
| E10 | TTS 播放失败 | 阿里云 API 异常或音频 URL 过期 | `Audio.play()` catch 住，不弹错误。静默降级为纯文本 | `chao-chat.tsx`（未来） |
| E11 | BGM 文件缺失 | `public/audio/*.mp3` 不存在或路径错误 | 喇叭按钮不崩溃，显示“等你放入音乐文件”；其他页面功能不受影响 | `bgm-toggle.tsx` |
| E12 | 浏览器阻止自动播放 | 用户未点击页面就试图播放有声音乐 | 默认不自动播放；必须用户点击喇叭后再调用 `audio.play()` | `bgm-toggle.tsx` |

### 10.2 输入校验规则

| 输入点 | 校验规则 | 处理 |
|--------|----------|------|
| 聊天输入框 | 去除首尾空格后不为空；**不做**字数上限限制（但单条消息超过 2000 字时应 console.warn） | 空输入 → 按钮 disabled |
| 昵称输入 | 最大 20 字符；去除首尾空格 | 超长截断 |
| 经期日期选择 | 不能选择未来日期 | 未来日期 disabled |
| 疼痛等级滑块 | 整数 0-5 | 前端 slider 组件天然约束 |
| 饮食偏好标签 | 点选 toggle，无需校验 | — |
| 自定义过敏原输入 | 非空 + 去重 | 回车或失焦后写入数组 |

### 10.3 权限边界

| 边界 | 客户端 | 服务端 |
|------|--------|--------|
| 大模型 API Key | ❌ 绝不可见 | ✅ 唯一持有者 |
| 用户健康数据 | ✅ 仅存本地 LocalStorage | ❌ 不保存、不传输用户数据 |
| AI 对话历史 | ✅ 仅存当前会话内存（刷新即清空） | ❌ 不落盘、不持久化 |
| 安全防线判定 | ✅ 前端在发送前拦截 | ❌ 后端不负责内容审核 |
| BGM 音频文件 | ✅ 作为静态资源从 `/audio/*.mp3` 读取 | ❌ 不参与后端 API |
| BGM 音量偏好 | ✅ 存在 LocalStorage (`innertide-bgm-volume`) | ❌ 不上传、不同步 |

### 10.4 测试职责划分

| 角色 | 职责范围 |
|------|----------|
| **开发者 (你/AI)** | 编写代码、修复编译错误、执行 `tsc --noEmit` 编译检查、用 curl 手动测试后端接口 |
| **集成测试 (手动)** | 在浏览器中走完"打开聊天 → 发送消息 → 收到回复 → 切换角色 → 点击快捷按钮"全流程 |
| **边界测试 (手动)** | 故意输入空消息、极端关键词、极长文本、关闭后端服务后再发送，验证所有兜底逻辑 |
| **未来 (可选)** | 如果项目规模扩大，可引入 Vitest 对 `computeCycleState` 和 `detectCrisis` 做自动化单元测试 |

### 10.5 预览入口文件

项目根目录新增 `preview.html`，用于本地文件夹内快速点击预览。

- 双击 `preview.html` 可打开一个轻量入口页。
- 入口页包含云端网站 `http://47.118.80.247:3002/`。
- 入口页同时保留本地 `localhost:3002` 和 `localhost:3000` 入口。
- 该文件不参与 React 构建，不影响线上页面逻辑，仅作为开发和演示时的快捷入口。
- 若云端入口打不开，优先检查 `pm2 status` 中 `xinchao-web` 是否 `online`，以及 `curl -I http://localhost:3002` 是否返回 200。

---

## 11. 按证据验收 (Evidence-Based Acceptance)

### 11.1 已被证明的部分 ✅

| 项 | 证据 | 可提交？ |
|----|------|----------|
| TypeScript 编译通过 | `npm run lint` / `tsc --noEmit` 返回 0 errors | ✅ 可提交 |
| store.ts 数据结构完整 | `cycleLength` 字段已补入 State 接口和默认值 | ✅ 可提交 |
| prompts.ts 三角色 Prompt | 全局底座 + 闺蜜/妈妈/潮 三套完整 Prompt 已写入 | ✅ 可提交 |
| chao-chat.tsx UI 重构 | 角色副标题、快捷按钮、推荐卡片渲染逻辑已写入 | ✅ 可提交 |
| server.ts 后端代理 | Express 路由 + OpenAI-compatible 调用 + JSON/纯文本兜底逻辑已写入 | ✅ 可提交 |
| vite.config.ts 代理 | `/api` → `localhost:3001` 代理配置已写入 | ✅ 可提交 |
| 阿里百炼模型调用 | `qwen3.6-flash` 已通过 `localhost:3000/api/chat` 返回结构化 JSON | ✅ 可提交 |
| 妈妈/潮角色回归 | 分别用 curl 测试“妈妈”和“潮”角色，均成功返回 JSON | ✅ 可提交 |
| 四阶段 BGM | 四个 `/audio/*.mp3` 路径返回 200，按钮和音量滑杆已实现 | ✅ 可提交 |

### 11.2 尚未被证明的部分 ⚠️

| 项 | 原因 | 阻塞条件 |
|----|------|----------|
| 安全防线实际拦截 | `detectCrisis()` 当前实现为 `return false`（stub） | Phase 3 开发 |
| LetterPanel 真实生成 | 当前仍为 mock fallback | Phase 1 后半段 |
| 经期打卡交互 | 尚未开发 | Phase 2 |
| TTS 语音播放 | 尚未开发 | Phase 3 |

### 11.3 主链路测试内容

以下是**最小闭环验证**时必须跑通的关键路径：

```
[主链路 1] 聊天完整闭环
用户打开 App → 点击"潮"悬浮按钮 → ChaoChat 打开
→ 看到开场白 + 角色副标题 + 快捷按钮
→ 点击 [今天喝什么] 或手动输入
→ 前端发 POST /api/chat
→ 后端调 OpenAI-compatible 模型（当前 qwen3.6-flash）→ 返回 JSON
→ 前端渲染 reply 气泡 + 推荐卡片 + 新一轮快捷按钮
→ 切换到"闺蜜" → 开场白和快捷按钮同步变化

[主链路 2] 异常降级
关闭后端服务 → 在聊天框发送消息 → 显示"网络请求失败"兜底文案 → 不崩溃、不白屏

[主链路 3] 安全防线（Phase 3 后测试）
输入"我不想活了" → 不调 API → 立即显示心理援助热线
```

### 11.4 测试缺口

| # | 缺口 | 风险等级 | 计划覆盖时间 |
|---|------|----------|-------------|
| G1 | `computeCycleState` 无自动化单元测试 | 中 | 可选：引入 Vitest 后补充 |
| G2 | `detectCrisis` 关键词列表为空 | **高** | Phase 3 必须补充 |
| G3 | 大模型返回异常 JSON 的前端兜底 | 低 | 后端已做 JSON 清洗和纯文本包装；仍建议后续记录异常样本 |
| G4 | LocalStorage 满容量的降级 | 低 | 短期内数据量不会触发 5MB，可后续补 |
| G5 | 多标签页同时操作的 store 数据竞争 | 低 | 当前无跨标签同步机制，但用户极少会开多标签页用此 App |
| G6 | 移动端浏览器兼容性 | 中 | 未在 iOS Safari / 微信内置浏览器中实测 |
| G7 | 后端无请求频率限制 (Rate Limiting) | 中 | 用户如果疯狂点击发送，会对模型 API 产生大量请求，建议后续加节流 |
| G8 | BGM 版权与带宽 | 中 | Demo 可随 `public/audio` 部署；正式上线需确认授权，访问量大时迁移 CDN |

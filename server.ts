import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// ---------------- GEMINI AI CLIENT (SERVER-SIDE ONLY) ----------------
function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapLanguageName(lang: string): string {
  if (lang === 'fr') return 'French';
  if (lang === 'rn') return 'Kirundi';
  return 'English';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractAiErrorInfo(err: unknown): { status: number; message: string; isTransient: boolean } {
  const errObj = err as { status?: number; code?: number; message?: string } | null;
  let status = Number(errObj?.status || errObj?.code) || 500;
  let message = err instanceof Error ? err.message : 'AI service request failed.';

  // Unwrap JSON-formatted SDK error strings like {"error":{"code":503,"message":"...","status":"UNAVAILABLE"}}
  const trimmed = message.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: { code?: number; message?: string; status?: string };
        message?: string;
        code?: number;
      };
      if (parsed.error) {
        if (parsed.error.code) status = Number(parsed.error.code);
        if (parsed.error.message) message = parsed.error.message;
      } else if (parsed.message) {
        if (parsed.code) status = Number(parsed.code);
        message = parsed.message;
      }
    } catch {
      // Keep original message if not valid JSON
    }
  }

  const lower = message.toLowerCase();
  if (status === 500) {
    if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
      status = 503;
    } else if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
      status = 429;
    } else if (lower.includes('403') || lower.includes('permission_denied')) {
      status = 403;
    } else if (lower.includes('api_key') || lower.includes('400')) {
      status = 400;
    } else if (lower.includes('404') || lower.includes('not_found')) {
      status = 404;
    }
  }

  const isTransient =
    status === 503 ||
    status === 429 ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily');

  return { status, message, isTransient };
}

async function generateJsonContentWithRetry<T>(params: {
  contents: string;
  systemInstruction: string;
  responseSchema: Record<string, unknown>;
}): Promise<T> {
  const ai = getAiClient();
  const attempts: { model: string; useLowThinking: boolean; delayMs: number }[] = [
    { model: 'gemini-4-hydrogen', useLowThinking: true, delayMs: 0 },
    { model: 'gemini-4-hydrogen', useLowThinking: true, delayMs: 700 },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false, delayMs: 1200 },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false, delayMs: 2000 },
  ];

  let lastError: unknown = null;

  for (const step of attempts) {
    if (step.delayMs > 0) {
      await sleep(step.delayMs);
    }
    try {
      const response = await ai.models.generateContent({
        model: step.model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          ...(step.useLowThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
        },
      });

      const raw = (response.text ?? '{}').trim();
      return JSON.parse(raw) as T;
    } catch (err) {
      lastError = err;
      const info = extractAiErrorInfo(err);
      if (!info.isTransient) {
        throw err;
      }
    }
  }

  throw lastError;
}

function handleAiError(res: express.Response, err: unknown): void {
  const info = extractAiErrorInfo(err);
  let friendlyMessage = info.message;
  if (info.status === 503) {
    friendlyMessage =
      'AI model is temporarily experiencing high demand (503). Please wait a moment and try again.';
  } else if (info.status === 429) {
    friendlyMessage =
      'AI rate limit or quota reached (429). Please try again shortly or check Settings > Secrets.';
  } else if (info.status === 400 || info.status === 403) {
    friendlyMessage = `${info.message} Check your Gemini API key in Settings > Secrets.`;
  }
  res.status(info.status).json({ error: friendlyMessage });
}

// ---------------- LIVE BATTLE AUTHORITATIVE ROOM ENGINE ----------------
interface LiveQuestion {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

interface LiveParticipant {
  id: string;
  nickname: string;
  score: number;
  correctCount: number;
  connected: boolean;
  answeredCurrent: boolean;
  lastPointsEarned: number;
}

type RoomStatus = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'FINISHED';

interface LiveRoom {
  code: string;
  title: string;
  hostParticipantId: string;
  status: RoomStatus;
  secondsPerQuestion: number;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questionEndsAt: number | null;
  questions: LiveQuestion[];
  participants: Map<string, LiveParticipant>;
  answersByQuestion: Map<number, Map<string, { optionId: string; answeredAt: number }>>;
  sockets: Map<string, Set<WebSocket>>;
  timerHandle: NodeJS.Timeout | null;
  createdAt: string;
}

const liveRooms = new Map<string, LiveRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 30; i += 1) {
    let code = '';
    for (let j = 0; j < 6; j += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!liveRooms.has(code)) return code;
  }
  return `LV${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function serializeRoomState(room: LiveRoom) {
  const currentQ = room.questions[room.currentQuestionIndex] ?? null;
  const showCorrect = room.status === 'REVEAL' || room.status === 'FINISHED';

  const players = Array.from(room.participants.values()).sort(
    (a, b) => b.score - a.score || b.correctCount - a.correctCount
  );

  return {
    code: room.code,
    title: room.title,
    hostParticipantId: room.hostParticipantId,
    status: room.status,
    secondsPerQuestion: room.secondsPerQuestion,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    questionEndsAt: room.questionEndsAt,
    currentQuestion: currentQ
      ? {
          id: currentQ.id,
          prompt: currentQ.prompt,
          options: currentQ.options,
          correctOptionId: showCorrect ? currentQ.correctOptionId : undefined,
        }
      : null,
    players,
  };
}

function broadcastRoomState(room: LiveRoom): void {
  const payload = JSON.stringify({
    type: 'room:state',
    state: serializeRoomState(room),
  });
  for (const socketSet of room.sockets.values()) {
    for (const ws of socketSet) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

function clearRoomTimer(room: LiveRoom): void {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
}

function revealCurrentQuestion(room: LiveRoom): void {
  if (room.status !== 'QUESTION') return;
  clearRoomTimer(room);

  const qIdx = room.currentQuestionIndex;
  const question = room.questions[qIdx];
  const qAnswers = room.answersByQuestion.get(qIdx) ?? new Map();
  const startedAt = room.questionStartedAt ?? Date.now();
  const maxDurationMs = room.secondsPerQuestion * 1000;

  for (const participant of room.participants.values()) {
    participant.lastPointsEarned = 0;
    const submission = qAnswers.get(participant.id);
    if (submission && question && submission.optionId === question.correctOptionId) {
      const elapsed = Math.max(0, submission.answeredAt - startedAt);
      const speedRatio = Math.max(0, 1 - elapsed / maxDurationMs);
      const earned = 100 + Math.round(speedRatio * 50);
      participant.score += earned;
      participant.correctCount += 1;
      participant.lastPointsEarned = earned;
    }
  }

  room.status = 'REVEAL';
  room.questionEndsAt = null;
  broadcastRoomState(room);
}

function startQuestion(room: LiveRoom, index: number): void {
  clearRoomTimer(room);
  if (index >= room.questions.length) {
    room.status = 'FINISHED';
    room.questionEndsAt = null;
    broadcastRoomState(room);
    return;
  }

  room.currentQuestionIndex = index;
  room.status = 'QUESTION';
  room.questionStartedAt = Date.now();
  room.questionEndsAt = room.questionStartedAt + room.secondsPerQuestion * 1000;

  for (const p of room.participants.values()) {
    p.answeredCurrent = false;
    p.lastPointsEarned = 0;
  }

  room.timerHandle = setTimeout(() => {
    revealCurrentQuestion(room);
  }, room.secondsPerQuestion * 1000);

  broadcastRoomState(room);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // ---------------- HEALTH CHECK ----------------
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'vibebattle-server' });
  });

  // ---------------- GEMINI AI ROUTES ----------------
  app.post('/api/ai/generate-quiz', async (req, res) => {
    try {
      const {
        topic = '',
        category = 'friendship',
        questionCount = 5,
        language = 'en',
      } = req.body as {
        topic?: string;
        category?: string;
        questionCount?: number;
        language?: string;
      };

      const count = Math.min(10, Math.max(5, Number(questionCount) || 5));
      const langName = mapLanguageName(language);

      const parsed = await generateJsonContentWithRetry({
        contents: `Generate ${count} engaging, funny, friendly "Who Knows Me Best?" quiz questions in ${langName}.
Category: ${category}.
Creator vibe / personal details: ${topic.trim() || 'A fun young adult who loves music, travel, food, and inside jokes with friends'}.
Each question must be written in first person ("my", "I", "mon/ma" in French, etc.) so friends have to guess about the creator.
Provide exactly 4 distinct, playful answer options per question and indicate correctIndex (0 to 3).`,
        systemInstruction:
          'You are a creative social party-game writer for VibeBattle. Keep questions lighthearted, clever, safe, and non-offensive. Always output valid JSON matching the schema.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                },
                required: ['prompt', 'options', 'correctIndex'],
              },
            },
          },
          required: ['suggestedTitle', 'suggestedDescription', 'questions'],
        },
      });

      res.json(parsed);
    } catch (err) {
      handleAiError(res, err);
    }
  });

  app.post('/api/ai/generate-battle', async (req, res) => {
    try {
      const {
        mode = 'funny_battle',
        subCategory = 'Best Friends Challenge',
        topic = '',
        language = 'en',
      } = req.body as {
        mode?: 'funny_battle' | 'love_friendship';
        subCategory?: string;
        topic?: string;
        language?: string;
      };

      const langName = mapLanguageName(language);

      const promptText =
        mode === 'funny_battle'
          ? `Generate 5 hilarious, friendly group voting prompts in ${langName} (e.g. "Who is most likely to...") for friends. Context: ${topic || 'group hangout'}. Never humiliating or mean.`
          : `Generate 5 fun ${subCategory} prompts in ${langName} where two people answer separately to compare tastes and habits. Each prompt must have 2 to 4 crisp options. Context: ${topic || 'besties or couples'}.`;

      const parsed = await generateJsonContentWithRetry({
        contents: promptText,
        systemInstruction:
          'You create joyful, inclusive social party prompts for VibeBattle. Never generate hurtful or offensive prompts.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['prompt'],
              },
            },
          },
          required: ['title', 'prompts'],
        },
      });

      res.json(parsed);
    } catch (err) {
      handleAiError(res, err);
    }
  });

  app.post('/api/ai/score-verdict', async (req, res) => {
    try {
      const {
        quizTitle,
        playerNickname,
        percentage,
        score,
        totalQuestions,
        language = 'en',
        missedPrompts = [],
      } = req.body as {
        quizTitle: string;
        playerNickname: string;
        percentage: number;
        score: number;
        totalQuestions: number;
        language?: string;
        missedPrompts?: string[];
      };

      const langName = mapLanguageName(language);

      const parsed = await generateJsonContentWithRetry({
        contents: `Write a witty, warm, 2-sentence VibeBattle score reaction in ${langName} for ${playerNickname}, who scored ${score}/${totalQuestions} (${percentage}%) on "${quizTitle}".
Missed questions sample: ${missedPrompts.slice(0, 2).join(' | ') || 'None'}.
Keep it playful and encouraging, never insulting.`,
        systemInstruction:
          'You are the playful VibeBattle game host. Write concise, funny, heartwarming 2-sentence reactions.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            commentary: { type: Type.STRING },
          },
          required: ['headline', 'commentary'],
        },
      });

      res.json(parsed);
    } catch (err) {
      handleAiError(res, err);
    }
  });

  app.post('/api/ai/daily-challenge', async (req, res) => {
    try {
      const { language = 'en', theme = 'everyday life' } = req.body as {
        language?: string;
        theme?: string;
      };
      const langName = mapLanguageName(language);

      const parsed = await generateJsonContentWithRetry({
        contents: `Create 1 creative Daily Challenge in ${langName} about "${theme}". It can be a clever riddle, a "complete the sentence" prompt, or a 1-question mini-quiz with 4 options and an entertaining explanation.`,
        systemInstruction:
          'You create bite-sized daily brain-teasers and social icebreakers for VibeBattle.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            title: { type: Type.STRING },
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctIndex: { type: Type.INTEGER },
            funFact: { type: Type.STRING },
          },
          required: ['type', 'title', 'prompt', 'options', 'correctIndex', 'funFact'],
        },
      });

      res.json(parsed);
    } catch (err) {
      handleAiError(res, err);
    }
  });

  app.post('/api/ai/moderate-report', async (req, res) => {
    try {
      const { quizTitle, quizDescription, reason, details } = req.body as {
        quizTitle: string;
        quizDescription: string;
        reason: string;
        details?: string;
      };

      const parsed = await generateJsonContentWithRetry({
        contents: `Assess this reported VibeBattle quiz for community safety (harassment, hate speech, doxxing, or spam).
Quiz title: ${quizTitle}
Description: ${quizDescription}
Report reason: ${reason}
Reporter details: ${details || 'None'}`,
        systemInstruction:
          'You are a concise trust & safety moderation advisor. Recommend "safe", "review", or "hide" and explain in 1-2 clear sentences.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ['recommendation', 'summary'],
        },
      });

      res.json(parsed);
    } catch (err) {
      handleAiError(res, err);
    }
  });

  // ---------------- LIVE BATTLE HTTP ROOM ENDPOINTS ----------------
  app.post('/api/rooms', (req, res) => {
    const {
      title = 'Live VibeBattle',
      hostNickname = 'Host',
      hostParticipantId,
      secondsPerQuestion = 15,
      questions = [],
    } = req.body as {
      title?: string;
      hostNickname?: string;
      hostParticipantId?: string;
      secondsPerQuestion?: number;
      questions?: LiveQuestion[];
    };

    if (!Array.isArray(questions) || questions.length < 3) {
      res.status(400).json({ error: 'At least 3 questions are required for a Live Battle.' });
      return;
    }

    const code = generateRoomCode();
    const hostId = hostParticipantId || `p-${Date.now().toString(36)}`;
    const room: LiveRoom = {
      code,
      title: title.trim() || 'Live VibeBattle',
      hostParticipantId: hostId,
      status: 'LOBBY',
      secondsPerQuestion: Math.min(30, Math.max(8, Number(secondsPerQuestion) || 15)),
      currentQuestionIndex: 0,
      questionStartedAt: null,
      questionEndsAt: null,
      questions,
      participants: new Map([
        [
          hostId,
          {
            id: hostId,
            nickname: hostNickname.trim() || 'Host',
            score: 0,
            correctCount: 0,
            connected: true,
            answeredCurrent: false,
            lastPointsEarned: 0,
          },
        ],
      ]),
      answersByQuestion: new Map(),
      sockets: new Map(),
      timerHandle: null,
      createdAt: new Date().toISOString(),
    };

    liveRooms.set(code, room);
    res.status(201).json({
      code: room.code,
      hostParticipantId: hostId,
      state: serializeRoomState(room),
    });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const room = liveRooms.get(req.params.code.trim().toUpperCase());
    if (!room) {
      res.status(404).json({ error: 'Live room not found.' });
      return;
    }
    res.json({ state: serializeRoomState(room) });
  });

  // ---------------- VITE / STATIC SERVING ----------------
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // ---------------- HTTP + WEBSOCKET SERVER ----------------
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/rooms' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);
    const code = (url.searchParams.get('code') || '').trim().toUpperCase();
    const participantId =
      (url.searchParams.get('participantId') || '').trim() ||
      `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const nickname = (url.searchParams.get('nickname') || 'Player').trim().slice(0, 28);

    const room = liveRooms.get(code);
    if (!room) {
      ws.send(JSON.stringify({ type: 'room:error', error: 'Room not found.' }));
      ws.close();
      return;
    }

    // Idempotent join / reconnect
    const existing = room.participants.get(participantId);
    if (existing) {
      existing.connected = true;
      if (nickname) existing.nickname = nickname;
    } else {
      room.participants.set(participantId, {
        id: participantId,
        nickname,
        score: 0,
        correctCount: 0,
        connected: true,
        answeredCurrent: false,
        lastPointsEarned: 0,
      });
    }

    if (!room.sockets.has(participantId)) {
      room.sockets.set(participantId, new Set());
    }
    room.sockets.get(participantId)!.add(ws);

    ws.send(
      JSON.stringify({
        type: 'room:joined',
        participantId,
        state: serializeRoomState(room),
      })
    );
    broadcastRoomState(room);

    ws.on('message', (rawMsg) => {
      try {
        const msg = JSON.parse(rawMsg.toString()) as {
          type: string;
          optionId?: string;
        };

        if (msg.type === 'room:start' && participantId === room.hostParticipantId) {
          if (room.status === 'LOBBY') {
            startQuestion(room, 0);
          }
        } else if (msg.type === 'room:next' && participantId === room.hostParticipantId) {
          if (room.status === 'REVEAL') {
            startQuestion(room, room.currentQuestionIndex + 1);
          }
        } else if (msg.type === 'room:answer' && room.status === 'QUESTION' && msg.optionId) {
          const qIdx = room.currentQuestionIndex;
          if (!room.answersByQuestion.has(qIdx)) {
            room.answersByQuestion.set(qIdx, new Map());
          }
          const qMap = room.answersByQuestion.get(qIdx)!;
          // Idempotent: ignore duplicate answer for same question
          if (!qMap.has(participantId)) {
            qMap.set(participantId, {
              optionId: msg.optionId,
              answeredAt: Date.now(),
            });
            const p = room.participants.get(participantId);
            if (p) p.answeredCurrent = true;

            // If all connected participants answered, reveal immediately
            const allConnectedAnswered = Array.from(room.participants.values())
              .filter((pItem) => pItem.connected)
              .every((pItem) => pItem.answeredCurrent);

            if (allConnectedAnswered) {
              revealCurrentQuestion(room);
            } else {
              broadcastRoomState(room);
            }
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      const set = room.sockets.get(participantId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          room.sockets.delete(participantId);
          const p = room.participants.get(participantId);
          if (p) p.connected = false;
          broadcastRoomState(room);
        }
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`VibeBattle server running at http://0.0.0.0:${PORT}`);
  });
}

void startServer();

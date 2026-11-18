import type { Language, Quiz } from '../types/vibebattle';

export interface GeneratedQuizPayload {
  suggestedTitle: string;
  suggestedDescription: string;
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
  }[];
}

export interface GeneratedBattlePayload {
  title: string;
  prompts: {
    prompt: string;
    options?: string[];
  }[];
}

export interface GeneratedScoreVerdict {
  headline: string;
  commentary: string;
}

export interface GeneratedDailyChallenge {
  type: string;
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  funFact: string;
}

export interface ModerationAdvice {
  recommendation: string;
  summary: string;
}

function extractFriendlyError(raw: unknown, status: number): string {
  if (raw && typeof raw === 'object') {
    const obj = raw as { error?: unknown; message?: string };
    if (typeof obj.error === 'string') {
      const trimmed = obj.error.trim();
      if (trimmed.startsWith('{')) {
        try {
          const nested = JSON.parse(trimmed) as { error?: { message?: string }; message?: string };
          if (nested.error?.message) return nested.error.message;
          if (nested.message) return nested.message;
        } catch {
          return obj.error;
        }
      }
      return obj.error;
    }
    if (obj.error && typeof obj.error === 'object') {
      const nested = obj.error as { message?: string };
      if (nested.message) return nested.message;
    }
    if (typeof obj.message === 'string') return obj.message;
  }
  if (status === 503) {
    return 'AI service is temporarily experiencing high demand. Please try again in a few seconds.';
  }
  return `Request failed with status ${status}`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return data as T;
    }
    if (res.status === 503 && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }
    throw new Error(extractFriendlyError(data, res.status));
  }
  throw new Error('AI request failed. Please try again.');
}

export const aiClient = {
  generateQuiz(input: {
    topic: string;
    category: Quiz['category'];
    questionCount: number;
    language: Language;
  }): Promise<GeneratedQuizPayload> {
    return postJson('/api/ai/generate-quiz', input);
  },

  generateBattle(input: {
    mode: 'funny_battle' | 'love_friendship';
    subCategory?: string;
    topic: string;
    language: Language;
  }): Promise<GeneratedBattlePayload> {
    return postJson('/api/ai/generate-battle', input);
  },

  generateScoreVerdict(input: {
    quizTitle: string;
    playerNickname: string;
    percentage: number;
    score: number;
    totalQuestions: number;
    language: Language;
    missedPrompts?: string[];
  }): Promise<GeneratedScoreVerdict> {
    return postJson('/api/ai/score-verdict', input);
  },

  generateDailyChallenge(input: {
    language: Language;
    theme?: string;
  }): Promise<GeneratedDailyChallenge> {
    return postJson('/api/ai/daily-challenge', input);
  },

  moderateReport(input: {
    quizTitle: string;
    quizDescription: string;
    reason: string;
    details?: string;
  }): Promise<ModerationAdvice> {
    return postJson('/api/ai/moderate-report', input);
  },
};

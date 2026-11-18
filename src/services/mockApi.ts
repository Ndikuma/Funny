import {
  BADGE_DEFINITIONS,
  SEED_ATTEMPTS,
  SEED_COMPATIBILITY_SESSIONS,
  SEED_DAILY_CHALLENGES,
  SEED_FRIENDSHIPS,
  SEED_FUNNY_BATTLES,
  SEED_GAMIFICATION,
  SEED_MODERATION_LOG,
  SEED_NOTIFICATIONS,
  SEED_QUIZZES,
  SEED_REPORTS,
  SEED_TEMPLATES,
  SEED_USERS,
  SEED_XP_TRANSACTIONS,
} from '../data/seedData';
import type {
  AttemptAnswerBreakdown,
  AttemptAnswerInput,
  BadgeDef,
  CompatibilityCategory,
  CompatibilityQuestion,
  CompatibilitySession,
  DailyChallengeItem,
  DailyParticipation,
  DashboardSummary,
  FriendshipRecord,
  FunnyBattle,
  GlobalLeaderboardRow,
  Language,
  LeaderboardEntry,
  ModerationAction,
  NotificationItem,
  PerformanceTrendPoint,
  PlayableQuiz,
  Question,
  QuestionTemplate,
  Quiz,
  QuizAttempt,
  QuizDraftInput,
  Report,
  User,
  UserGamification,
  UserProfile,
  XPTransaction,
} from '../types/vibebattle';

const STORAGE_KEY = 'vibebattle_mvp_store_v2';
const DAILY_XP_CAP = 300;

interface StoreState {
  users: User[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  templates: QuestionTemplate[];
  reports: Report[];
  moderationLog: ModerationAction[];
  funnyBattles: FunnyBattle[];
  compatibilitySessions: CompatibilitySession[];
  dailyChallenges: DailyChallengeItem[];
  dailyParticipations: DailyParticipation[];
  gamification: UserGamification[];
  xpTransactions: XPTransaction[];
  friendships: FriendshipRecord[];
  notifications: NotificationItem[];
  sessionUserId: string | null;
}

let memoryStore: StoreState | null = null;

function createInitialState(): StoreState {
  return {
    users: structuredClone(SEED_USERS),
    quizzes: structuredClone(SEED_QUIZZES),
    attempts: structuredClone(SEED_ATTEMPTS),
    templates: structuredClone(SEED_TEMPLATES),
    reports: structuredClone(SEED_REPORTS),
    moderationLog: structuredClone(SEED_MODERATION_LOG),
    funnyBattles: structuredClone(SEED_FUNNY_BATTLES),
    compatibilitySessions: structuredClone(SEED_COMPATIBILITY_SESSIONS),
    dailyChallenges: structuredClone(SEED_DAILY_CHALLENGES),
    dailyParticipations: [],
    gamification: structuredClone(SEED_GAMIFICATION),
    xpTransactions: structuredClone(SEED_XP_TRANSACTIONS),
    friendships: structuredClone(SEED_FRIENDSHIPS),
    notifications: structuredClone(SEED_NOTIFICATIONS),
    sessionUserId: null,
  };
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readStore(): StoreState {
  if (hasLocalStorage()) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StoreState>;
        const defaults = createInitialState();
        return {
          ...defaults,
          ...parsed,
        };
      } catch {
        // Fallback to clean state if corrupted
      }
    }
    const fresh = createInitialState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  if (!memoryStore) {
    memoryStore = createInitialState();
  }
  return memoryStore;
}

function writeStore(next: StoreState): void {
  if (hasLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    memoryStore = next;
  }
}

export function resetMockStore(): void {
  const fresh = createInitialState();
  writeStore(fresh);
}

function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

function generateUniqueCode(existingCodes: string[]): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 30; attempt += 1) {
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!existingCodes.includes(code)) {
      return code;
    }
  }
  return `VB${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureUserGamification(store: StoreState, userId: string): UserGamification {
  let g = store.gamification.find((item) => item.userId === userId);
  if (!g) {
    g = {
      userId,
      xp: 0,
      level: 1,
      currentStreak: 0,
      bestStreak: 0,
      lastDailyDate: null,
      dailyXpDate: todayDateKey(),
      dailyXpToday: 0,
      unlockedBadgeIds: [],
    };
    store.gamification.push(g);
  }
  return g;
}

function pushNotification(
  store: StoreState,
  input: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>
): void {
  store.notifications.unshift({
    id: generateId('notif'),
    ...input,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

function awardXpAndBadges(
  store: StoreState,
  userId: string,
  reason: string,
  requestedAmount: number,
  badgeHint?: string
): number {
  const g = ensureUserGamification(store, userId);
  const today = todayDateKey();
  if (g.dailyXpDate !== today) {
    g.dailyXpDate = today;
    g.dailyXpToday = 0;
  }

  const remainingCap = Math.max(0, DAILY_XP_CAP - g.dailyXpToday);
  const awarded = Math.min(requestedAmount, remainingCap);
  if (awarded > 0) {
    g.xp += awarded;
    g.dailyXpToday += awarded;
    g.level = Math.max(1, Math.floor(g.xp / 100) + 1);
    store.xpTransactions.unshift({
      id: generateId('xp'),
      userId,
      reason,
      amount: awarded,
      createdAt: new Date().toISOString(),
    });
  }

  const unlock = (badgeId: string) => {
    if (!g.unlockedBadgeIds.includes(badgeId)) {
      g.unlockedBadgeIds.push(badgeId);
      const badge = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
      if (badge) {
        pushNotification(store, {
          userId,
          type: 'badge',
          title: `Badge unlocked: ${badge.name}`,
          body: badge.description,
          link: '/achievements',
        });
      }
    }
  };

  if (badgeHint) unlock(badgeHint);
  if (g.xp >= 300) unlock('social_legend');
  if (g.currentStreak >= 7) unlock('streak_7');

  return awarded;
}

export function validateQuizInput(input: QuizDraftInput): string | null {
  if (!input.title.trim()) {
    return 'Quiz title is required.';
  }
  if (input.isPublished && input.questions.length < 5) {
    return 'At least 5 questions are required to publish a quiz.';
  }
  if (input.questions.length > 20) {
    return 'A quiz can have at most 20 questions.';
  }
  for (const q of input.questions) {
    if (!q.prompt.trim()) {
      return 'Every question must have prompt text.';
    }
    const validOptions = q.options.filter((o) => o.text.trim().length > 0);
    if (validOptions.length < 2 || validOptions.length > 4) {
      return 'Every question must have 2 to 4 non-empty options.';
    }
    if (!validOptions.some((o) => o.id === q.correctOptionId)) {
      return 'Every question must have a valid correct answer selected.';
    }
  }
  return null;
}

function toPlayableQuiz(quiz: Quiz): PlayableQuiz {
  const creatorVisible = quiz.showCreator;
  return {
    id: quiz.id,
    shareCode: quiz.shareCode,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    theme: quiz.theme,
    visibility: quiz.visibility,
    creatorLabel: creatorVisible ? quiz.creatorDisplayName : null,
    creatorUsername: creatorVisible ? quiz.creatorUsername : null,
    creatorAvatarId: creatorVisible ? quiz.creatorAvatarId : null,
    questionCount: quiz.questions.length,
    playCount: quiz.playCount,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
    createdAt: quiz.createdAt,
  };
}

export const mockApi = {
  // ---------------- AUTH ----------------
  async getCurrentUser(): Promise<User | null> {
    const store = readStore();
    if (!store.sessionUserId) return null;
    const found = store.users.find((u) => u.id === store.sessionUserId);
    if (!found || !found.isActive) return null;
    return found;
  },

  async login(email: string, password: string): Promise<User> {
    if (!email.trim() || password.length < 4) {
      throw new Error('Please enter a valid email and password (4+ characters).');
    }
    const store = readStore();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user) {
      throw new Error('No account found with that email address.');
    }
    if (!user.isActive) {
      throw new Error('This account has been suspended by moderation.');
    }
    store.sessionUserId = user.id;
    ensureUserGamification(store, user.id);
    writeStore(store);
    return user;
  },

  async register(input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    preferredLanguage?: Language;
  }): Promise<User> {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanUsername = input.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (input.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    if (cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 alphanumeric characters.');
    }
    const store = readStore();
    if (store.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email already exists.');
    }
    if (store.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('This username is already taken.');
    }

    const newUser: User = {
      id: generateId('u'),
      username: cleanUsername,
      displayName: input.displayName.trim() || cleanUsername,
      email: cleanEmail,
      emailVerified: false,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        bio: '',
        avatarId: 'coral',
        isPublic: true,
        showCreatorOnQuizzes: true,
        preferredLanguage: input.preferredLanguage ?? 'en',
      },
    };
    store.users.push(newUser);
    store.sessionUserId = newUser.id;
    ensureUserGamification(store, newUser.id);
    writeStore(store);
    return newUser;
  },

  async logout(): Promise<void> {
    const store = readStore();
    store.sessionUserId = null;
    writeStore(store);
  },

  async verifyEmail(): Promise<User> {
    const store = readStore();
    const user = store.users.find((u) => u.id === store.sessionUserId);
    if (!user) throw new Error('Authentication required.');
    user.emailVerified = true;
    writeStore(store);
    return user;
  },

  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    return { ok: true };
  },

  async updateProfile(updates: {
    displayName?: string;
    username?: string;
    profile?: Partial<UserProfile>;
  }): Promise<User> {
    const store = readStore();
    const user = store.users.find((u) => u.id === store.sessionUserId);
    if (!user) throw new Error('Authentication required.');

    if (updates.username) {
      const clean = updates.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (clean.length < 3) {
        throw new Error('Username must be at least 3 characters.');
      }
      if (store.users.some((u) => u.id !== user.id && u.username === clean)) {
        throw new Error('That username is already in use.');
      }
      user.username = clean;
    }

    if (updates.displayName !== undefined && updates.displayName.trim()) {
      user.displayName = updates.displayName.trim();
    }

    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
    }

    for (const q of store.quizzes) {
      if (q.creatorId === user.id) {
        q.creatorDisplayName = user.displayName;
        q.creatorUsername = user.username;
        q.creatorAvatarId = user.profile.avatarId;
        q.showCreator = user.profile.showCreatorOnQuizzes;
      }
    }

    writeStore(store);
    return user;
  },

  async getPublicProfile(username: string): Promise<{
    user: Pick<User, 'username' | 'displayName' | 'createdAt' | 'profile'>;
    quizzes: PlayableQuiz[];
    totalPlays: number;
  } | null> {
    const store = readStore();
    const user = store.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.isActive
    );
    if (!user || !user.profile.isPublic) {
      return null;
    }
    const quizzes = store.quizzes
      .filter(
        (q) =>
          q.creatorId === user.id &&
          q.isPublished &&
          q.visibility === 'public' &&
          !q.isHiddenByModeration
      )
      .map(toPlayableQuiz);
    const totalPlays = quizzes.reduce((sum, q) => sum + q.playCount, 0);
    return {
      user: {
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt,
        profile: user.profile,
      },
      quizzes,
      totalPlays,
    };
  },

  // ---------------- QUIZZES ----------------
  async listPublicQuizzes(params?: {
    search?: string;
    category?: string;
  }): Promise<PlayableQuiz[]> {
    const store = readStore();
    let list = store.quizzes.filter(
      (q) => q.isPublished && q.visibility === 'public' && !q.isHiddenByModeration
    );
    if (params?.category && params.category !== 'all') {
      list = list.filter((q) => q.category === params.category);
    }
    if (params?.search?.trim()) {
      const term = params.search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.title.toLowerCase().includes(term) ||
          q.description.toLowerCase().includes(term) ||
          (q.showCreator && q.creatorDisplayName.toLowerCase().includes(term))
      );
    }
    list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.playCount - a.playCount);
    return list.map(toPlayableQuiz);
  },

  async listMyQuizzes(): Promise<Quiz[]> {
    const store = readStore();
    if (!store.sessionUserId) throw new Error('Authentication required.');
    return store.quizzes
      .filter((q) => q.creatorId === store.sessionUserId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getQuizForEdit(quizId: string): Promise<Quiz> {
    const store = readStore();
    if (!store.sessionUserId) throw new Error('Authentication required.');
    const quiz = store.quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found.');
    const currentUser = store.users.find((u) => u.id === store.sessionUserId);
    if (quiz.creatorId !== store.sessionUserId && currentUser?.role !== 'admin') {
      throw new Error('You do not have permission to edit this quiz.');
    }
    return quiz;
  },

  async createQuiz(input: QuizDraftInput): Promise<Quiz> {
    const store = readStore();
    const user = store.users.find((u) => u.id === store.sessionUserId);
    if (!user) throw new Error('Please sign in to create a quiz.');

    const validationError = validateQuizInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const now = new Date().toISOString();
    const newQuiz: Quiz = {
      id: generateId('q'),
      shareCode: generateUniqueCode(store.quizzes.map((q) => q.shareCode)),
      creatorId: user.id,
      creatorUsername: user.username,
      creatorDisplayName: user.displayName,
      creatorAvatarId: user.profile.avatarId,
      showCreator: user.profile.showCreatorOnQuizzes,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      theme: input.theme,
      visibility: input.visibility,
      isPublished: input.isPublished,
      isFeatured: false,
      isHiddenByModeration: false,
      questions: input.questions.map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        options: q.options
          .filter((o) => o.text.trim().length > 0)
          .map((o) => ({ ...o, text: o.text.trim() })),
      })),
      playCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    store.quizzes.unshift(newQuiz);
    if (input.isPublished) {
      awardXpAndBadges(store, user.id, `Published quiz "${newQuiz.title}"`, 40, 'quiz_master');
    }
    writeStore(store);
    return newQuiz;
  },

  async updateQuiz(quizId: string, input: QuizDraftInput): Promise<Quiz> {
    const store = readStore();
    const user = store.users.find((u) => u.id === store.sessionUserId);
    if (!user) throw new Error('Authentication required.');
    const idx = store.quizzes.findIndex((q) => q.id === quizId);
    if (idx === -1) throw new Error('Quiz not found.');
    const existing = store.quizzes[idx];
    if (existing.creatorId !== user.id && user.role !== 'admin') {
      throw new Error('Permission denied.');
    }

    const validationError = validateQuizInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const updated: Quiz = {
      ...existing,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      theme: input.theme,
      visibility: input.visibility,
      isPublished: input.isPublished,
      questions: input.questions.map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        options: q.options
          .filter((o) => o.text.trim().length > 0)
          .map((o) => ({ ...o, text: o.text.trim() })),
      })),
      updatedAt: new Date().toISOString(),
    };

    store.quizzes[idx] = updated;
    writeStore(store);
    return updated;
  },

  async deleteQuiz(quizId: string): Promise<void> {
    const store = readStore();
    const user = store.users.find((u) => u.id === store.sessionUserId);
    if (!user) throw new Error('Authentication required.');
    const existing = store.quizzes.find((q) => q.id === quizId);
    if (!existing) throw new Error('Quiz not found.');
    if (existing.creatorId !== user.id && user.role !== 'admin') {
      throw new Error('Permission denied.');
    }
    store.quizzes = store.quizzes.filter((q) => q.id !== quizId);
    store.attempts = store.attempts.filter((a) => a.quizId !== quizId);
    writeStore(store);
  },

  // ---------------- PLAY & SERVER-SIDE SCORING ----------------
  async getQuizByShareCode(shareCode: string): Promise<PlayableQuiz> {
    const store = readStore();
    const normalized = shareCode.trim().toUpperCase();
    const quiz = store.quizzes.find((q) => q.shareCode.toUpperCase() === normalized);
    if (!quiz || quiz.isHiddenByModeration) {
      throw new Error('Quiz not found.');
    }
    if (!quiz.isPublished && quiz.creatorId !== store.sessionUserId) {
      throw new Error('This quiz is not published yet.');
    }
    if (quiz.visibility === 'private' && quiz.creatorId !== store.sessionUserId) {
      throw new Error('This quiz is private.');
    }
    return toPlayableQuiz(quiz);
  },

  async submitQuizAttempt(input: {
    shareCode: string;
    playerNickname: string;
    durationSeconds: number;
    answers: AttemptAnswerInput[];
  }): Promise<QuizAttempt> {
    const store = readStore();
    const quiz = store.quizzes.find(
      (q) => q.shareCode.toUpperCase() === input.shareCode.trim().toUpperCase()
    );
    if (!quiz || quiz.isHiddenByModeration || !quiz.isPublished) {
      throw new Error('Quiz is unavailable.');
    }
    if (quiz.visibility === 'private' && quiz.creatorId !== store.sessionUserId) {
      throw new Error('This quiz is private.');
    }

    const nickname = input.playerNickname.trim();
    if (!nickname) {
      throw new Error('Please enter a nickname before finishing.');
    }

    const answerMap = new Map<string, string>();
    for (const ans of input.answers) {
      if (!answerMap.has(ans.questionId)) {
        answerMap.set(ans.questionId, ans.selectedOptionId);
      }
    }

    let score = 0;
    const breakdown: AttemptAnswerBreakdown[] = quiz.questions.map((question: Question) => {
      const selectedId = answerMap.get(question.id) ?? '';
      const selectedOption = question.options.find((o) => o.id === selectedId);
      const correctOption = question.options.find((o) => o.id === question.correctOptionId);
      const isCorrect = selectedId === question.correctOptionId;
      if (isCorrect) score += 1;

      return {
        questionId: question.id,
        prompt: question.prompt,
        selectedOptionId: selectedId,
        selectedText: selectedOption?.text ?? '—',
        correctOptionId: question.correctOptionId,
        correctText: correctOption?.text ?? '—',
        isCorrect,
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const currentUser = store.sessionUserId
      ? store.users.find((u) => u.id === store.sessionUserId) ?? null
      : null;

    const attempt: QuizAttempt = {
      id: generateId('att'),
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizShareCode: quiz.shareCode,
      playerUserId: currentUser?.id ?? null,
      playerNickname: nickname.slice(0, 32),
      isGuest: !currentUser,
      score,
      totalQuestions,
      percentage,
      durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
      answers: breakdown,
      completedAt: new Date().toISOString(),
    };

    quiz.playCount += 1;
    store.attempts.unshift(attempt);

    if (currentUser) {
      awardXpAndBadges(
        store,
        currentUser.id,
        `Completed "${quiz.title}" (${percentage}%)`,
        percentage >= 80 ? 35 : 20,
        percentage >= 80 ? 'best_friend_expert' : 'first_battle'
      );
    }

    if (quiz.creatorId !== currentUser?.id) {
      pushNotification(store, {
        userId: quiz.creatorId,
        type: 'quiz_play',
        title: `${attempt.playerNickname} played your quiz`,
        body: `Scored ${percentage}% (${score}/${totalQuestions}) on "${quiz.title}".`,
        link: `/q/${quiz.shareCode}`,
      });
    }

    writeStore(store);
    return attempt;
  },

  async claimGuestAttempt(attemptId: string): Promise<QuizAttempt | null> {
    const store = readStore();
    if (!store.sessionUserId) return null;
    const attempt = store.attempts.find((a) => a.id === attemptId);
    if (!attempt) return null;
    const user = store.users.find((u) => u.id === store.sessionUserId);
    if (!user) return null;

    attempt.playerUserId = user.id;
    attempt.isGuest = false;
    attempt.playerNickname = user.displayName;
    awardXpAndBadges(store, user.id, `Claimed score on "${attempt.quizTitle}"`, 20, 'first_battle');
    writeStore(store);
    return attempt;
  },

  async getAttemptById(attemptId: string): Promise<QuizAttempt | null> {
    const store = readStore();
    return store.attempts.find((a) => a.id === attemptId) ?? null;
  },

  async getQuizLeaderboard(shareCode: string): Promise<LeaderboardEntry[]> {
    const store = readStore();
    const quiz = store.quizzes.find(
      (q) => q.shareCode.toUpperCase() === shareCode.trim().toUpperCase()
    );
    if (!quiz) return [];

    const sorted = store.attempts
      .filter((a) => a.quizId === quiz.id)
      .sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
        return a.completedAt.localeCompare(b.completedAt);
      });

    return sorted.map((a, idx) => ({
      attemptId: a.id,
      rank: idx + 1,
      playerNickname: a.playerNickname,
      playerUserId: a.playerUserId,
      isGuest: a.isGuest,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage,
      durationSeconds: a.durationSeconds,
      completedAt: a.completedAt,
    }));
  },

  // ---------------- FUNNY BATTLE (PHASE 2) ----------------
  async listFunnyBattles(): Promise<FunnyBattle[]> {
    const store = readStore();
    return store.funnyBattles
      .filter((b) => !b.isHiddenByModeration)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getFunnyBattleByCode(code: string): Promise<FunnyBattle> {
    const store = readStore();
    const found = store.funnyBattles.find(
      (b) => b.shareCode.toUpperCase() === code.trim().toUpperCase() && !b.isHiddenByModeration
    );
    if (!found) throw new Error('Funny Battle not found.');
    return found;
  },

  async createFunnyBattle(input: {
    title: string;
    nominees: string[];
    prompts: string[];
    creatorName?: string;
  }): Promise<FunnyBattle> {
    const store = readStore();
    const user = store.sessionUserId
      ? store.users.find((u) => u.id === store.sessionUserId) ?? null
      : null;

    const cleanNominees = Array.from(
      new Set(input.nominees.map((n) => n.trim()).filter(Boolean))
    );
    const cleanPrompts = input.prompts.map((p) => p.trim()).filter(Boolean);

    if (!input.title.trim()) throw new Error('Battle title is required.');
    if (cleanNominees.length < 2) throw new Error('Add at least 2 friends/nominees.');
    if (cleanPrompts.length < 1) throw new Error('Add at least 1 voting question.');

    const battle: FunnyBattle = {
      id: generateId('fb'),
      shareCode: generateUniqueCode(store.funnyBattles.map((b) => b.shareCode)),
      creatorId: user?.id ?? null,
      creatorName: user?.displayName ?? (input.creatorName?.trim() || 'Host'),
      title: input.title.trim(),
      nominees: cleanNominees.slice(0, 10),
      prompts: cleanPrompts.slice(0, 10).map((text, idx) => ({
        id: `fbp-${Date.now().toString(36)}-${idx}`,
        prompt: text,
      })),
      votes: [],
      isHiddenByModeration: false,
      createdAt: new Date().toISOString(),
    };

    store.funnyBattles.unshift(battle);
    if (user) {
      awardXpAndBadges(store, user.id, `Created Funny Battle "${battle.title}"`, 30, 'challenge_champion');
    }
    writeStore(store);
    return battle;
  },

  async submitFunnyBattleVotes(input: {
    code: string;
    voterName: string;
    selections: Record<string, string>;
  }): Promise<FunnyBattle> {
    const store = readStore();
    const battle = store.funnyBattles.find(
      (b) => b.shareCode.toUpperCase() === input.code.trim().toUpperCase() && !b.isHiddenByModeration
    );
    if (!battle) throw new Error('Funny Battle not found.');

    const cleanVoter = input.voterName.trim();
    if (!cleanVoter) throw new Error('Please enter your nickname to vote.');

    const user = store.sessionUserId
      ? store.users.find((u) => u.id === store.sessionUserId) ?? null
      : null;
    const voterKey = user ? user.id : `guest:${cleanVoter.toLowerCase()}`;

    // Replace/upsert votes by voterKey to prevent ballot stuffing
    for (const p of battle.prompts) {
      const chosenNominee = input.selections[p.id];
      if (!chosenNominee || !battle.nominees.includes(chosenNominee)) continue;
      battle.votes = battle.votes.filter(
        (v) => !(v.promptId === p.id && v.voterKey === voterKey)
      );
      battle.votes.push({
        promptId: p.id,
        voterKey,
        voterName: cleanVoter,
        nominee: chosenNominee,
        createdAt: new Date().toISOString(),
      });
    }

    if (user) {
      awardXpAndBadges(store, user.id, `Voted in "${battle.title}"`, 20, 'challenge_champion');
    }
    if (battle.creatorId && battle.creatorId !== user?.id) {
      pushNotification(store, {
        userId: battle.creatorId,
        type: 'battle_vote',
        title: `${cleanVoter} voted in ${battle.title}`,
        body: 'Check the live Funny Battle tally to see who is leading.',
        link: `/battles/${battle.shareCode}`,
      });
    }

    writeStore(store);
    return battle;
  },

  // ---------------- LOVE & FRIENDSHIP (PHASE 2) ----------------
  async listCompatibilitySessions(): Promise<CompatibilitySession[]> {
    const store = readStore();
    return [...store.compatibilitySessions].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  async getCompatibilityByCode(code: string): Promise<CompatibilitySession> {
    const store = readStore();
    const found = store.compatibilitySessions.find(
      (s) => s.shareCode.toUpperCase() === code.trim().toUpperCase()
    );
    if (!found) throw new Error('Compatibility session not found.');
    return found;
  },

  async createCompatibilitySession(input: {
    category: CompatibilityCategory;
    title: string;
    creatorName: string;
    questions: CompatibilityQuestion[];
    creatorAnswers: Record<string, string>;
  }): Promise<CompatibilitySession> {
    const store = readStore();
    const user = store.sessionUserId
      ? store.users.find((u) => u.id === store.sessionUserId) ?? null
      : null;

    if (!input.title.trim()) throw new Error('Session title is required.');
    if (input.questions.length < 3) throw new Error('Add at least 3 prompts.');

    const session: CompatibilitySession = {
      id: generateId('comp'),
      shareCode: generateUniqueCode(store.compatibilitySessions.map((s) => s.shareCode)),
      category: input.category,
      title: input.title.trim(),
      creatorName: user?.displayName ?? (input.creatorName.trim() || 'Player 1'),
      creatorUserId: user?.id ?? null,
      partnerName: null,
      questions: input.questions,
      creatorAnswers: input.creatorAnswers,
      partnerAnswers: null,
      matchPercentage: null,
      commonCount: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    store.compatibilitySessions.unshift(session);
    if (user) {
      awardXpAndBadges(store, user.id, `Started "${session.title}"`, 25, 'challenge_champion');
    }
    writeStore(store);
    return session;
  },

  async submitCompatibilityPartner(input: {
    code: string;
    partnerName: string;
    partnerAnswers: Record<string, string>;
  }): Promise<CompatibilitySession> {
    const store = readStore();
    const session = store.compatibilitySessions.find(
      (s) => s.shareCode.toUpperCase() === input.code.trim().toUpperCase()
    );
    if (!session) throw new Error('Compatibility session not found.');
    const partnerName = input.partnerName.trim();
    if (!partnerName) throw new Error('Enter your name to compare answers.');

    let common = 0;
    for (const q of session.questions) {
      if (
        session.creatorAnswers[q.id] &&
        session.creatorAnswers[q.id] === input.partnerAnswers[q.id]
      ) {
        common += 1;
      }
    }
    const pct =
      session.questions.length > 0
        ? Math.round((common / session.questions.length) * 100)
        : 0;

    session.partnerName = partnerName;
    session.partnerAnswers = input.partnerAnswers;
    session.commonCount = common;
    session.matchPercentage = pct;
    session.completedAt = new Date().toISOString();

    const user = store.sessionUserId
      ? store.users.find((u) => u.id === store.sessionUserId) ?? null
      : null;
    if (user) {
      awardXpAndBadges(store, user.id, `Matched ${pct}% on "${session.title}"`, 30, 'challenge_champion');
    }

    writeStore(store);
    return session;
  },

  // ---------------- DAILY CHALLENGE & GAMIFICATION (PHASE 2) ----------------
  async getDailyChallengeHub(): Promise<{
    challenges: DailyChallengeItem[];
    participations: DailyParticipation[];
    gamification: UserGamification | null;
    badges: BadgeDef[];
    xpHistory: XPTransaction[];
  }> {
    const store = readStore();
    const userId = store.sessionUserId;
    const gamification = userId ? ensureUserGamification(store, userId) : null;
    const participations = userId
      ? store.dailyParticipations.filter((p) => p.userId === userId)
      : [];
    const xpHistory = userId
      ? store.xpTransactions.filter((x) => x.userId === userId).slice(0, 12)
      : [];
    return {
      challenges: store.dailyChallenges,
      participations,
      gamification,
      badges: BADGE_DEFINITIONS,
      xpHistory,
    };
  },

  async addAiDailyChallenge(item: Omit<DailyChallengeItem, 'id' | 'dateKey' | 'xpReward'>): Promise<DailyChallengeItem> {
    const store = readStore();
    const created: DailyChallengeItem = {
      id: generateId('dc'),
      dateKey: todayDateKey(),
      type: item.type,
      title: item.title,
      prompt: item.prompt,
      options: item.options,
      correctIndex: item.correctIndex,
      funFact: item.funFact,
      xpReward: 45,
    };
    store.dailyChallenges.unshift(created);
    writeStore(store);
    return created;
  },

  async submitDailyChallenge(input: {
    challengeId: string;
    selectedIndex: number;
  }): Promise<{
    participation: DailyParticipation;
    gamification: UserGamification | null;
  }> {
    const store = readStore();
    const challenge = store.dailyChallenges.find((c) => c.id === input.challengeId);
    if (!challenge) throw new Error('Daily challenge not found.');

    const isCorrect = input.selectedIndex === challenge.correctIndex;
    const userId = store.sessionUserId;
    const xpAwarded = isCorrect ? challenge.xpReward : Math.round(challenge.xpReward / 2);

    const participation: DailyParticipation = {
      id: generateId('dp'),
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      userId: userId ?? 'guest',
      selectedIndex: input.selectedIndex,
      isCorrect,
      xpAwarded,
      completedAt: new Date().toISOString(),
    };

    let gamification: UserGamification | null = null;
    if (userId) {
      const alreadyDone = store.dailyParticipations.some(
        (p) => p.userId === userId && p.challengeId === challenge.id
      );
      if (alreadyDone) {
        throw new Error('You already completed this daily challenge!');
      }
      store.dailyParticipations.unshift(participation);
      const g = ensureUserGamification(store, userId);
      const today = todayDateKey();
      if (g.lastDailyDate !== today) {
        g.currentStreak += 1;
        g.bestStreak = Math.max(g.bestStreak, g.currentStreak);
        g.lastDailyDate = today;
      }
      awardXpAndBadges(store, userId, `Daily Challenge: ${challenge.title}`, xpAwarded, 'first_battle');
      gamification = g;
      writeStore(store);
    }

    return { participation, gamification };
  },

  async getGlobalLeaderboards(scope: 'global' | 'weekly' | 'monthly' | 'friends'): Promise<GlobalLeaderboardRow[]> {
    const store = readStore();
    const currentUserId = store.sessionUserId;
    const friendIds = new Set<string>();
    if (currentUserId) {
      friendIds.add(currentUserId);
      for (const f of store.friendships) {
        if (f.status === 'accepted') {
          if (f.requesterId === currentUserId) friendIds.add(f.addresseeId);
          if (f.addresseeId === currentUserId) friendIds.add(f.requesterId);
        }
      }
    }

    const factor = scope === 'weekly' ? 0.45 : scope === 'monthly' ? 0.8 : 1;

    const rows = store.users
      .filter((u) => u.isActive && u.role !== 'admin' && u.profile.isPublic)
      .filter((u) => (scope === 'friends' ? friendIds.has(u.id) : true))
      .map((u) => {
        const g = store.gamification.find((item) => item.userId === u.id);
        const xp = Math.round((g?.xp ?? 0) * factor);
        return {
          rank: 0,
          userId: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarId: u.profile.avatarId,
          xp,
          level: g?.level ?? 1,
          streak: g?.currentStreak ?? 0,
          badgesCount: g?.unlockedBadgeIds.length ?? 0,
        };
      })
      .sort((a, b) => b.xp - a.xp || b.streak - a.streak);

    return rows.map((row, idx) => ({ ...row, rank: idx + 1 }));
  },

  // ---------------- FRIENDS & NOTIFICATIONS (PHASE 2) ----------------
  async getFriendsOverview(): Promise<{
    friends: User[];
    incomingRequests: { friendshipId: string; user: User }[];
    outgoingRequests: { friendshipId: string; user: User }[];
    blocked: { friendshipId: string; user: User }[];
    suggestions: User[];
  }> {
    const store = readStore();
    const uid = store.sessionUserId;
    if (!uid) throw new Error('Authentication required.');

    const related = store.friendships.filter(
      (f) => f.requesterId === uid || f.addresseeId === uid
    );
    const connectedIds = new Set<string>([uid]);
    const friends: User[] = [];
    const incomingRequests: { friendshipId: string; user: User }[] = [];
    const outgoingRequests: { friendshipId: string; user: User }[] = [];
    const blocked: { friendshipId: string; user: User }[] = [];

    for (const f of related) {
      const otherId = f.requesterId === uid ? f.addresseeId : f.requesterId;
      connectedIds.add(otherId);
      const other = store.users.find((u) => u.id === otherId && u.isActive);
      if (!other) continue;

      if (f.status === 'accepted') friends.push(other);
      else if (f.status === 'blocked') blocked.push({ friendshipId: f.id, user: other });
      else if (f.status === 'pending') {
        if (f.addresseeId === uid) incomingRequests.push({ friendshipId: f.id, user: other });
        else outgoingRequests.push({ friendshipId: f.id, user: other });
      }
    }

    const suggestions = store.users.filter(
      (u) => u.isActive && u.role !== 'admin' && !connectedIds.has(u.id)
    );

    return { friends, incomingRequests, outgoingRequests, blocked, suggestions };
  },

  async sendFriendRequest(targetUserId: string): Promise<void> {
    const store = readStore();
    const uid = store.sessionUserId;
    if (!uid) throw new Error('Authentication required.');
    const sender = store.users.find((u) => u.id === uid);
    if (!sender) throw new Error('User not found.');
    if (uid === targetUserId) throw new Error('Cannot add yourself.');

    const existing = store.friendships.find(
      (f) =>
        (f.requesterId === uid && f.addresseeId === targetUserId) ||
        (f.requesterId === targetUserId && f.addresseeId === uid)
    );
    if (existing) throw new Error('Connection already exists.');

    store.friendships.unshift({
      id: generateId('fr'),
      requesterId: uid,
      addresseeId: targetUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    pushNotification(store, {
      userId: targetUserId,
      type: 'friend_request',
      title: 'New friend request',
      body: `${sender.displayName} (@${sender.username}) wants to connect.`,
      link: '/friends',
    });
    writeStore(store);
  },

  async respondFriendRequest(
    friendshipId: string,
    action: 'accept' | 'decline' | 'block' | 'remove'
  ): Promise<void> {
    const store = readStore();
    const uid = store.sessionUserId;
    if (!uid) throw new Error('Authentication required.');
    const idx = store.friendships.findIndex((f) => f.id === friendshipId);
    if (idx === -1) throw new Error('Request not found.');
    const record = store.friendships[idx];

    if (action === 'decline' || action === 'remove') {
      store.friendships.splice(idx, 1);
    } else if (action === 'accept') {
      record.status = 'accepted';
      awardXpAndBadges(store, uid, 'Made a new VibeBattle friend', 15);
    } else if (action === 'block') {
      record.status = 'blocked';
    }
    writeStore(store);
  },

  async listNotifications(): Promise<NotificationItem[]> {
    const store = readStore();
    if (!store.sessionUserId) return [];
    return store.notifications
      .filter((n) => n.userId === store.sessionUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async markNotificationsRead(notificationId?: string): Promise<void> {
    const store = readStore();
    if (!store.sessionUserId) return;
    for (const n of store.notifications) {
      if (n.userId === store.sessionUserId && (!notificationId || n.id === notificationId)) {
        n.isRead = true;
      }
    }
    writeStore(store);
  },

  // ---------------- DASHBOARD & TEMPLATES ----------------
  async getDashboardSummary(): Promise<DashboardSummary> {
    const store = readStore();
    if (!store.sessionUserId) throw new Error('Authentication required.');

    const myQuizzes = store.quizzes
      .filter((q) => q.creatorId === store.sessionUserId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const myQuizIds = new Set(myQuizzes.map((q) => q.id));

    const playsOnMyQuizzes = store.attempts.filter((a) => myQuizIds.has(a.quizId));
    const avgScore =
      playsOnMyQuizzes.length > 0
        ? Math.round(
            playsOnMyQuizzes.reduce((sum, a) => sum + a.percentage, 0) /
              playsOnMyQuizzes.length
          )
        : 0;

    const myAttempts = store.attempts
      .filter((a) => a.playerUserId === store.sessionUserId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    return {
      quizzesCreated: myQuizzes.length,
      totalPlaysReceived: myQuizzes.reduce((sum, q) => sum + q.playCount, 0),
      attemptsCompleted: myAttempts.length,
      averageScoreReceived: avgScore,
      recentQuizzes: myQuizzes.slice(0, 5),
      recentAttempts: myAttempts.slice(0, 6),
    };
  },

  async getUserPerformanceTrends(): Promise<{
    points: PerformanceTrendPoint[];
    weeklyXpTotal: number;
    averageAccuracy: number | null;
    quizzesThisWeek: number;
  }> {
    const store = readStore();
    if (!store.sessionUserId) throw new Error('Authentication required.');
    const uid = store.sessionUserId;

    const xpByDay = new Map<string, number>();
    for (const tx of store.xpTransactions) {
      if (tx.userId !== uid) continue;
      const key = tx.createdAt.slice(0, 10);
      xpByDay.set(key, (xpByDay.get(key) ?? 0) + tx.amount);
    }

    const attemptsByDay = new Map<string, number[]>();
    for (const att of store.attempts) {
      if (att.playerUserId !== uid) continue;
      const key = att.completedAt.slice(0, 10);
      const arr = attemptsByDay.get(key) ?? [];
      arr.push(att.percentage);
      attemptsByDay.set(key, arr);
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const points: PerformanceTrendPoint[] = [];
    let weeklyXpTotal = 0;
    let accuracySum = 0;
    let quizzesThisWeek = 0;

    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - offset);
      const dateKey = d.toISOString().slice(0, 10);
      const day = dayLabels[d.getUTCDay()];
      const xpEarned = xpByDay.get(dateKey) ?? 0;
      const scores = attemptsByDay.get(dateKey) ?? [];
      const accuracy =
        scores.length > 0
          ? Math.round(scores.reduce((sum, pct) => sum + pct, 0) / scores.length)
          : null;

      weeklyXpTotal += xpEarned;
      if (scores.length > 0) {
        accuracySum += scores.reduce((sum, pct) => sum + pct, 0);
        quizzesThisWeek += scores.length;
      }

      points.push({
        day,
        dateKey,
        xpEarned,
        accuracy,
        quizzesPlayed: scores.length,
      });
    }

    return {
      points,
      weeklyXpTotal,
      averageAccuracy: quizzesThisWeek > 0 ? Math.round(accuracySum / quizzesThisWeek) : null,
      quizzesThisWeek,
    };
  },

  async listTemplates(): Promise<QuestionTemplate[]> {
    const store = readStore();
    return store.templates.filter((t) => t.isActive);
  },

  // ---------------- REPORTS & ADMIN ----------------
  async submitReport(input: {
    quizId: string;
    reason: string;
    details: string;
  }): Promise<Report> {
    const store = readStore();
    const quiz =
      store.quizzes.find((q) => q.id === input.quizId) ??
      store.funnyBattles.find((b) => b.id === input.quizId);

    const currentUser = store.sessionUserId
      ? store.users.find((u) => u.id === store.sessionUserId)
      : null;

    const report: Report = {
      id: generateId('rep'),
      quizId: input.quizId,
      quizTitle: quiz ? quiz.title : 'Reported Battle',
      quizShareCode: quiz ? quiz.shareCode : 'N/A',
      reporterLabel: currentUser ? `@${currentUser.username}` : 'Guest player',
      reason: input.reason.trim() || 'Inappropriate content',
      details: input.details.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    store.reports.unshift(report);
    writeStore(store);
    return report;
  },

  async getAdminSnapshot(): Promise<{
    users: User[];
    quizzes: Quiz[];
    reports: Report[];
    templates: QuestionTemplate[];
    moderationLog: ModerationAction[];
    totalAttempts: number;
  }> {
    const store = readStore();
    const currentUser = store.users.find((u) => u.id === store.sessionUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Administrator access required.');
    }
    return {
      users: store.users,
      quizzes: store.quizzes,
      reports: store.reports,
      templates: store.templates,
      moderationLog: store.moderationLog,
      totalAttempts: store.attempts.length,
    };
  },

  async adminToggleUserActive(userId: string): Promise<User> {
    const store = readStore();
    const admin = store.users.find((u) => u.id === store.sessionUserId);
    if (!admin || admin.role !== 'admin') throw new Error('Admin access required.');
    const target = store.users.find((u) => u.id === userId);
    if (!target) throw new Error('User not found.');
    if (target.id === admin.id) throw new Error('Cannot suspend your own admin account.');
    target.isActive = !target.isActive;

    store.moderationLog.unshift({
      id: generateId('mod'),
      adminUsername: admin.username,
      actionType: target.isActive ? 'RESTORE_USER' : 'SUSPEND_USER',
      targetType: 'user',
      targetId: target.id,
      note: `Updated @${target.username} active status to ${target.isActive}.`,
      createdAt: new Date().toISOString(),
    });
    writeStore(store);
    return target;
  },

  async adminModerateQuiz(
    quizId: string,
    action: 'toggle_hide' | 'toggle_feature'
  ): Promise<Quiz> {
    const store = readStore();
    const admin = store.users.find((u) => u.id === store.sessionUserId);
    if (!admin || admin.role !== 'admin') throw new Error('Admin access required.');
    const quiz = store.quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found.');

    if (action === 'toggle_hide') {
      quiz.isHiddenByModeration = !quiz.isHiddenByModeration;
    } else {
      quiz.isFeatured = !quiz.isFeatured;
    }

    store.moderationLog.unshift({
      id: generateId('mod'),
      adminUsername: admin.username,
      actionType: action === 'toggle_hide' ? 'MODERATE_VISIBILITY' : 'FEATURE_TOGGLE',
      targetType: 'quiz',
      targetId: quiz.id,
      note: `Updated "${quiz.title}" (${quiz.shareCode}).`,
      createdAt: new Date().toISOString(),
    });
    writeStore(store);
    return quiz;
  },

  async adminResolveReport(
    reportId: string,
    status: 'resolved' | 'dismissed'
  ): Promise<Report> {
    const store = readStore();
    const admin = store.users.find((u) => u.id === store.sessionUserId);
    if (!admin || admin.role !== 'admin') throw new Error('Admin access required.');
    const report = store.reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Report not found.');
    report.status = status;

    store.moderationLog.unshift({
      id: generateId('mod'),
      adminUsername: admin.username,
      actionType: status === 'resolved' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT',
      targetType: 'report',
      targetId: report.id,
      note: `Marked report on ${report.quizShareCode} as ${status}.`,
      createdAt: new Date().toISOString(),
    });
    writeStore(store);
    return report;
  },

  async adminAddTemplate(input: {
    category: Quiz['category'];
    promptEn: string;
    promptFr: string;
    promptRn: string;
  }): Promise<QuestionTemplate> {
    const store = readStore();
    const admin = store.users.find((u) => u.id === store.sessionUserId);
    if (!admin || admin.role !== 'admin') throw new Error('Admin access required.');
    if (!input.promptEn.trim()) throw new Error('English prompt is required.');

    const template: QuestionTemplate = {
      id: generateId('tpl'),
      category: input.category,
      prompt: {
        en: input.promptEn.trim(),
        fr: input.promptFr.trim() || input.promptEn.trim(),
        rn: input.promptRn.trim() || input.promptEn.trim(),
      },
      suggestedOptions: {
        en: ['Option A', 'Option B', 'Option C'],
        fr: ['Option A', 'Option B', 'Option C'],
        rn: ['Inyishu A', 'Inyishu B', 'Inyishu C'],
      },
      isActive: true,
    };
    store.templates.unshift(template);
    store.moderationLog.unshift({
      id: generateId('mod'),
      adminUsername: admin.username,
      actionType: 'CREATE_TEMPLATE',
      targetType: 'template',
      targetId: template.id,
      note: `Added template "${template.prompt.en}".`,
      createdAt: new Date().toISOString(),
    });
    writeStore(store);
    return template;
  },
};

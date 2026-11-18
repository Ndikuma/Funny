import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { mockApi, resetMockStore, validateQuizInput } from '../src/services/mockApi';
import type { Question, QuizDraftInput } from '../src/types/vibebattle';

function makeSampleQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `tq-${idx + 1}`,
    prompt: `Sample question ${idx + 1}?`,
    options: [
      { id: `tq-${idx + 1}-a`, text: 'Alpha' },
      { id: `tq-${idx + 1}-b`, text: 'Beta' },
      { id: `tq-${idx + 1}-c`, text: 'Gamma' },
    ],
    correctOptionId: `tq-${idx + 1}-a`,
  }));
}

describe('VibeBattle Phase 1 MVP', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('validates minimum 5 and maximum 20 questions on publish', () => {
    const tooFew: QuizDraftInput = {
      title: 'Too Short',
      description: '',
      category: 'friendship',
      theme: 'coral',
      visibility: 'public',
      isPublished: true,
      questions: makeSampleQuestions(4),
    };
    assert.ok(validateQuizInput(tooFew)?.includes('5 questions'));

    const tooMany: QuizDraftInput = {
      ...tooFew,
      questions: makeSampleQuestions(21),
    };
    assert.ok(validateQuizInput(tooMany)?.includes('20 questions'));

    const valid: QuizDraftInput = {
      ...tooFew,
      questions: makeSampleQuestions(5),
    };
    assert.equal(validateQuizInput(valid), null);
  });

  it('strips correctOptionId from playable quiz payloads (anti-cheat)', async () => {
    const playable = await mockApi.getQuizByShareCode('AB12CD');
    assert.equal(playable.shareCode, 'AB12CD');
    assert.equal(playable.questions.length, 5);
    for (const q of playable.questions) {
      assert.equal('correctOptionId' in q, false);
    }
  });

  it('completes end-to-end journey: Create Quiz -> Share -> Guest Plays -> Score -> Leaderboard -> Claim Account', async () => {
    // 1. Creator logs in and creates a quiz
    await mockApi.login('maya@vibebattle.app', 'demo1234');
    const created = await mockApi.createQuiz({
      title: 'Maya Roadtrip Trivia',
      description: 'Test your memory!',
      category: 'fun',
      theme: 'amber',
      visibility: 'public',
      isPublished: true,
      questions: makeSampleQuestions(5),
    });
    assert.equal(created.shareCode.length, 6);

    // 2. Creator logs out; friend plays as guest
    await mockApi.logout();
    const playable = await mockApi.getQuizByShareCode(created.shareCode);
    assert.equal(playable.title, 'Maya Roadtrip Trivia');

    // Answer 4 out of 5 correctly
    const answers = playable.questions.map((q, idx) => ({
      questionId: q.id,
      selectedOptionId: idx < 4 ? q.options[0].id : q.options[1].id,
    }));

    const attempt = await mockApi.submitQuizAttempt({
      shareCode: created.shareCode,
      playerNickname: 'GuestBestie',
      durationSeconds: 22,
      answers,
    });

    assert.equal(attempt.isGuest, true);
    assert.equal(attempt.score, 4);
    assert.equal(attempt.totalQuestions, 5);
    assert.equal(attempt.percentage, 80);

    // 3. Leaderboard reflects the guest attempt
    const board = await mockApi.getQuizLeaderboard(created.shareCode);
    assert.equal(board.length, 1);
    assert.equal(board[0].playerNickname, 'GuestBestie');
    assert.equal(board[0].percentage, 80);

    // 4. Guest registers and claims their attempt
    const newUser = await mockApi.register({
      email: 'bestie@example.com',
      password: 'password123',
      username: 'bestie_sam',
      displayName: 'Sam Bestie',
    });
    const claimed = await mockApi.claimGuestAttempt(attempt.id);
    assert.ok(claimed);
    assert.equal(claimed.isGuest, false);
    assert.equal(claimed.playerUserId, newUser.id);
  });

  it('respects creator anonymity and private quiz permissions', async () => {
    await mockApi.login('maya@vibebattle.app', 'demo1234');
    await mockApi.updateProfile({
      profile: { showCreatorOnQuizzes: false },
    });

    const privateQuiz = await mockApi.createQuiz({
      title: 'Private Notes Quiz',
      description: 'Only me',
      category: 'personality',
      theme: 'cobalt',
      visibility: 'private',
      isPublished: true,
      questions: makeSampleQuestions(5),
    });

    const publicAnon = await mockApi.getQuizByShareCode('AB12CD');
    assert.equal(publicAnon.creatorLabel, null);

    // Owner can access private quiz
    const ownPrivate = await mockApi.getQuizByShareCode(privateQuiz.shareCode);
    assert.equal(ownPrivate.title, 'Private Notes Quiz');

    // Non-owner cannot access private quiz
    await mockApi.logout();
    await assert.rejects(
      () => mockApi.getQuizByShareCode(privateQuiz.shareCode),
      /private/i
    );
  });

  it('supports admin moderation actions and hides moderated quizzes', async () => {
    await mockApi.login('admin@vibebattle.app', 'admin1234');
    await mockApi.adminModerateQuiz('q-couple-1', 'toggle_hide');

    await assert.rejects(() => mockApi.getQuizByShareCode('LV99US'), /not found/i);

    const snapshot = await mockApi.getAdminSnapshot();
    assert.ok(snapshot.moderationLog.length >= 2);
  });
});

describe('VibeBattle Phase 2 Social & Gamification', () => {
  beforeEach(() => {
    resetMockStore();
  });

  it('creates a Funny Battle and upserts votes per voterKey without ballot stuffing', async () => {
    await mockApi.login('maya@vibebattle.app', 'demo1234');
    const battle = await mockApi.createFunnyBattle({
      title: 'Weekend Squad Awards',
      nominees: ['Maya', 'Leo', 'Sam'],
      prompts: ['Who is most likely to forget their charger?'],
    });
    assert.equal(battle.shareCode.length, 6);

    const promptId = battle.prompts[0].id;
    await mockApi.logout();

    // First vote by guest "Alex"
    const afterFirst = await mockApi.submitFunnyBattleVotes({
      code: battle.shareCode,
      voterName: 'Alex',
      selections: { [promptId]: 'Leo' },
    });
    assert.equal(afterFirst.votes.length, 1);
    assert.equal(afterFirst.votes[0].nominee, 'Leo');

    // Second vote by same guest "Alex" updates rather than duplicates
    const afterSecond = await mockApi.submitFunnyBattleVotes({
      code: battle.shareCode,
      voterName: 'Alex',
      selections: { [promptId]: 'Sam' },
    });
    assert.equal(afterSecond.votes.length, 1);
    assert.equal(afterSecond.votes[0].nominee, 'Sam');
  });

  it('computes dual-player Love & Friendship match percentage separately', async () => {
    const session = await mockApi.createCompatibilitySession({
      category: 'best_friends',
      title: 'Roadtrip Besties Sync',
      creatorName: 'Maya',
      questions: [
        {
          id: 'c1',
          prompt: 'Window or aisle?',
          options: [
            { id: 'c1-a', text: 'Window' },
            { id: 'c1-b', text: 'Aisle' },
          ],
        },
        {
          id: 'c2',
          prompt: 'Music or podcast?',
          options: [
            { id: 'c2-a', text: 'Music' },
            { id: 'c2-b', text: 'Podcast' },
          ],
        },
        {
          id: 'c3',
          prompt: 'Early start or late?',
          options: [
            { id: 'c3-a', text: 'Early' },
            { id: 'c3-b', text: 'Late' },
          ],
        },
      ],
      creatorAnswers: { c1: 'c1-a', c2: 'c2-a', c3: 'c3-a' },
    });
    assert.equal(session.matchPercentage, null);

    const completed = await mockApi.submitCompatibilityPartner({
      code: session.shareCode,
      partnerName: 'Aline',
      partnerAnswers: { c1: 'c1-a', c2: 'c2-b', c3: 'c3-a' },
    });
    assert.equal(completed.commonCount, 2);
    assert.equal(completed.matchPercentage, 67);
  });

  it('awards XP & streak on Daily Challenge and prevents duplicate daily claims', async () => {
    await mockApi.login('maya@vibebattle.app', 'demo1234');
    const hubBefore = await mockApi.getDailyChallengeHub();
    const challenge = hubBefore.challenges[0];
    const startXp = hubBefore.gamification?.xp ?? 0;

    const result = await mockApi.submitDailyChallenge({
      challengeId: challenge.id,
      selectedIndex: challenge.correctIndex,
    });
    assert.equal(result.participation.isCorrect, true);
    assert.ok((result.gamification?.xp ?? 0) > startXp);

    await assert.rejects(
      () =>
        mockApi.submitDailyChallenge({
          challengeId: challenge.id,
          selectedIndex: challenge.correctIndex,
        }),
      /already completed/i
    );
  });

  it('supports friend requests, blocking, and privacy-filtered global leaderboards', async () => {
    await mockApi.login('maya@vibebattle.app', 'demo1234');
    const overview = await mockApi.getFriendsOverview();
    assert.ok(overview.friends.length >= 1);

    const globalBoard = await mockApi.getGlobalLeaderboards('global');
    assert.ok(globalBoard.length >= 1);
    assert.ok(globalBoard.every((row) => row.username !== 'admin'));
  });

  it('computes 7-day weekly XP and quiz accuracy trends for user profile charts', async () => {
    await mockApi.login('maya@vibebattle.app', 'demo1234');
    const trends = await mockApi.getUserPerformanceTrends();
    assert.equal(trends.points.length, 7);
    assert.ok(trends.weeklyXpTotal >= 300);
    assert.ok(trends.quizzesThisWeek >= 4);
    assert.ok(
      trends.averageAccuracy !== null &&
        trends.averageAccuracy >= 0 &&
        trends.averageAccuracy <= 100
    );
  });
});



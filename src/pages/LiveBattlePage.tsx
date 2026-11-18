import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Play, Radio, Trophy, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { SEED_QUIZZES } from '../data/seedData';
import { mockApi } from '../services/mockApi';

interface RoomPlayer {
  id: string;
  nickname: string;
  score: number;
  correctCount: number;
  connected: boolean;
  answeredCurrent: boolean;
  lastPointsEarned: number;
}

interface RoomState {
  code: string;
  title: string;
  hostParticipantId: string;
  status: 'LOBBY' | 'QUESTION' | 'REVEAL' | 'FINISHED';
  secondsPerQuestion: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  questionEndsAt: number | null;
  currentQuestion: {
    id: string;
    prompt: string;
    options: { id: string; text: string }[];
    correctOptionId?: string;
  } | null;
  players: RoomPlayer[];
}

function getOrCreateParticipantId(roomCode: string): string {
  const key = `vb_live_pid_${roomCode.toUpperCase()}`;
  try {
    const saved = window.sessionStorage.getItem(key);
    if (saved) return saved;
    const created = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return `p-${Date.now().toString(36)}`;
  }
}

export function LiveBattlePage() {
  const { code } = useParams<{ code?: string }>();
  if (code) {
    return <LiveRoomArena code={code} />;
  }
  return <LiveRoomHub />;
}

function LiveRoomHub() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState('');
  const [hostNickname, setHostNickname] = useState(user?.displayName ?? 'Maya');
  const [selectedQuizId, setSelectedQuizId] = useState(SEED_QUIZZES[0].id);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(15);
  const [creating, setCreating] = useState(false);

  const { data: myQuizzes = [] } = useQuery({
    queryKey: ['my-quizzes', user?.id],
    queryFn: () => mockApi.listMyQuizzes(),
    enabled: Boolean(user),
  });

  const availableDecks = [...myQuizzes.filter((q) => q.questions.length >= 3), ...SEED_QUIZZES].filter(
    (q, idx, arr) => arr.findIndex((item) => item.id === q.id) === idx
  );

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const deck = availableDecks.find((q) => q.id === selectedQuizId) ?? availableDecks[0];
    if (!deck) return;

    setCreating(true);
    try {
      const tempId = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deck.title,
          hostNickname: hostNickname.trim() || 'Host',
          hostParticipantId: tempId,
          secondsPerQuestion,
          questions: deck.questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create room');

      try {
        window.sessionStorage.setItem(`vb_live_pid_${data.code}`, data.hostParticipantId);
        window.sessionStorage.setItem(`vb_live_nick_${data.code}`, hostNickname.trim() || 'Host');
      } catch {
        // Ignore
      }
      navigate(`/live/${data.code}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.errorGeneric, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    navigate(`/live/${clean}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {t.modes.liveTitle}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-300">
          {t.modes.liveSubtitle}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Create Room */}
        <form
          onSubmit={handleCreateRoom}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
            Create a Live Room
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Host Nickname
            </label>
            <input
              type="text"
              required
              value={hostNickname}
              onChange={(e) => setHostNickname(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Quiz Deck
            </label>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {availableDecks.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.questions.length} questions)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Seconds per question
            </label>
            <select
              value={secondsPerQuestion}
              onChange={(e) => setSecondsPerQuestion(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value={10}>10 seconds (Fast)</option>
              <option value={15}>15 seconds (Standard)</option>
              <option value={25}>25 seconds (Relaxed)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <Radio className="h-4 w-4" />
            <span>{creating ? 'Creating Room...' : 'Open Live Room'}</span>
          </button>
        </form>

        {/* Join Room */}
        <form
          onSubmit={handleJoinSubmit}
          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              Join with Room Code
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Enter the 6-character code shared by your host to enter the live lobby.
            </p>
            <input
              type="text"
              required
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. X7K9MP"
              className="font-mono mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-bold tracking-widest uppercase dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
          >
            <span>Enter Lobby</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function LiveRoomArena({ code }: { code: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  const [participantId] = useState(() => getOrCreateParticipantId(code));
  const [nickname, setNickname] = useState(() => {
    try {
      return window.sessionStorage.getItem(`vb_live_nick_${code.toUpperCase()}`) || user?.displayName || '';
    } catch {
      return user?.displayName || '';
    }
  });
  const [joined, setJoined] = useState(() => {
    try {
      return Boolean(window.sessionStorage.getItem(`vb_live_nick_${code.toUpperCase()}`));
    } catch {
      return false;
    }
  });
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!joined) return;

    let reconnectTimer: number | undefined;
    let disposed = false;

    const connect = () => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws/rooms?code=${encodeURIComponent(code)}&participantId=${encodeURIComponent(participantId)}&nickname=${encodeURIComponent(nickname || 'Player')}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) {
          setWsConnected(true);
          setErrorMsg(null);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'room:error') {
            setErrorMsg(msg.error);
          } else if (msg.state) {
            setRoomState((prev) => {
              if (
                prev &&
                msg.state.currentQuestionIndex !== prev.currentQuestionIndex
              ) {
                setSelectedOption(null);
              }
              return msg.state;
            });
          }
        } catch {
          // Ignore malformed message
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          setWsConnected(false);
          reconnectTimer = window.setTimeout(connect, 1800);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [joined, code, participantId, nickname]);

  useEffect(() => {
    if (!roomState?.questionEndsAt || roomState.status !== 'QUESTION') {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((roomState.questionEndsAt! - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [roomState?.questionEndsAt, roomState?.status]);

  const sendAction = (payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  if (!joined) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!nickname.trim()) return;
            try {
              window.sessionStorage.setItem(`vb_live_nick_${code.toUpperCase()}`, nickname.trim());
            } catch {
              // Ignore
            }
            setJoined(true);
          }}
          className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <p className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
            Room {code.toUpperCase()}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white">
            Join Live Battle
          </h1>
          <label className="mt-4 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Your Nickname
          </label>
          <input
            type="text"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. BestieSam"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Join Lobby
          </button>
        </form>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {errorMsg}
          </h1>
          <Link
            to="/live"
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Live Battle
          </Link>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-slate-500">
        Connecting to live room {code}...
      </div>
    );
  }

  const isHost = roomState.hostParticipantId === participantId;
  const inviteLink = `${window.location.origin}/live/${roomState.code}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Live Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Room <span className="font-mono font-bold">{roomState.code}</span> ·{' '}
            {wsConnected ? 'Connected' : 'Reconnecting...'}
          </p>
          <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
            {roomState.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(inviteLink);
            showToast('Room invite link copied!', 'success');
          }}
          className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
        >
          Copy Room Link
        </button>
      </div>

      {roomState.status === 'LOBBY' && (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-950 dark:text-white">
              <Users className="h-4 w-4 text-rose-600" />
              <span>Lobby Players ({roomState.players.length})</span>
            </h2>
            <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {roomState.players.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {p.nickname}
                    {p.id === roomState.hostParticipantId ? ' (Host)' : ''}
                  </span>
                  <span className="text-xs text-slate-500">
                    {p.connected ? 'Ready' : 'Reconnecting'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 md:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share Code</p>
              <p className="font-mono mt-1 text-3xl font-extrabold tracking-widest text-slate-950 dark:text-white">
                {roomState.code}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {roomState.totalQuestions} questions · {roomState.secondsPerQuestion}s per question
              </p>
            </div>

            {isHost ? (
              <button
                type="button"
                onClick={() => sendAction({ type: 'room:start' })}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700"
              >
                <Play className="h-4 w-4" />
                <span>Start Live Battle</span>
              </button>
            ) : (
              <p className="mt-6 text-xs font-medium text-slate-500">
                Waiting for the host to start the match...
              </p>
            )}
          </div>
        </div>
      )}

      {(roomState.status === 'QUESTION' || roomState.status === 'REVEAL') &&
        roomState.currentQuestion && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  Question {roomState.currentQuestionIndex + 1} / {roomState.totalQuestions}
                </span>
                <span className="font-mono-nums text-rose-600 dark:text-rose-400">
                  {roomState.status === 'QUESTION' ? `${secondsLeft}s` : 'Round Complete'}
                </span>
              </div>

              <h2 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">
                {roomState.currentQuestion.prompt}
              </h2>

              <div className="mt-5 space-y-2.5">
                {roomState.currentQuestion.options.map((opt) => {
                  const isPicked = selectedOption === opt.id;
                  const isCorrect =
                    roomState.status === 'REVEAL' &&
                    roomState.currentQuestion?.correctOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={roomState.status !== 'QUESTION' || Boolean(selectedOption)}
                      onClick={() => {
                        setSelectedOption(opt.id);
                        sendAction({ type: 'room:answer', optionId: opt.id });
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                        isCorrect
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-100'
                          : isPicked
                            ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-100'
                            : 'border-slate-200 text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{opt.text}</span>
                      {isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              {roomState.status === 'REVEAL' && isHost && (
                <button
                  type="button"
                  onClick={() => sendAction({ type: 'room:next' })}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  <span>
                    {roomState.currentQuestionIndex + 1 < roomState.totalQuestions
                      ? 'Next Question'
                      : 'Show Final Podium'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-slate-950 dark:text-white">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Live Standings</span>
              </h3>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {roomState.players.map((p, idx) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="truncate pr-2 font-medium text-slate-900 dark:text-white">
                      #{idx + 1} {p.nickname}
                    </span>
                    <span className="font-mono-nums font-bold text-slate-950 dark:text-white">
                      {p.score}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {roomState.status === 'FINISHED' && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <Trophy className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 dark:text-white">
            Final Live Results
          </h2>
          <ul className="mx-auto mt-6 max-w-md divide-y divide-slate-100 text-left dark:divide-slate-800">
            {roomState.players.map((p, idx) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">
                  #{idx + 1} {p.nickname}
                </span>
                <span className="font-mono-nums font-bold text-rose-600 dark:text-rose-400">
                  {p.score} pts ({p.correctCount}/{roomState.totalQuestions})
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/live"
            className="mt-8 inline-flex rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Host Another Battle
          </Link>
        </div>
      )}
    </div>
  );
}

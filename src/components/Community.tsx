// Community board: opt-in only, anonymous, ranked on showing up.
// Off by default. Turning it off removes the client from the board at
// once. Only the guardian name and this month's consistency counts are
// ever shared: workouts, check-ins, cardio minutes, streak days. Never
// a real name, email, weight, measurement, or photo. Ranked on
// consistency only, never on strength or weight. Top 5 shown, plus the
// viewer's own place. The board resets on the 1st of every month.
import { useEffect, useState } from 'react';
import type { Ctx } from '../App';
import * as api from '../lib/api';
import type { LeaderboardEntry, LeaderboardResponse } from '../lib/api';
import Switch from './Switch';
import { streakDaysForDoc, cardioCreditMinutes } from '../lib/store';

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

function entryLine(e: LeaderboardEntry): string {
  return `${e.workouts} ${e.workouts === 1 ? 'workout' : 'workouts'} · ${e.checkins} ${e.checkins === 1 ? 'check-in' : 'check-ins'} · ${e.cardioMinutes} cardio min · ${e.streak}-day streak · Score ${Math.round(e.score)}`;
}

export default function Community({ ctx }: { ctx: Ctx }) {
  const { doc, update, toast } = ctx;
  const optedIn = doc.communityOptIn === true;
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);

  // Your own row for this month, worked out on this device. Used when
  // the shared board cannot be reached, so the section still shows
  // something honest instead of a spinner forever.
  const localBoard = (): LeaderboardResponse => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const inMonth = (list: { date?: string }[]) =>
      (list || []).filter((e) => String(e.date || '').slice(0, 7) === monthKey);
    const cardioMinutes = inMonth(doc.cardio || []).reduce(
      (s, e) => s + cardioCreditMinutes(e as { minutes?: unknown; zone?: unknown }),
      0,
    );
    const me: LeaderboardEntry = {
      rank: 1,
      name: doc.guardian ? `${doc.guardian.name} the ${doc.guardian.classId}` : 'Your guardian',
      classId: doc.guardian?.classId || 'Guardian',
      workouts: inMonth(doc.workouts || []).length,
      checkins: inMonth(doc.checkins || []).length,
      cardioMinutes,
      streak: streakDaysForDoc(doc),
      score: 0,
      isMe: true,
    };
    me.score = me.workouts * 10 + me.checkins * 5 + me.streak * 2 + Math.min(me.cardioMinutes, 300) / 10;
    return {
      month: monthKey,
      monthLabel: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      top: doc.guardian ? [me] : [],
      me: doc.guardian ? me : null,
      aheadOfMe: null,
      totalOptedIn: 1,
    };
  };

  const loadBoard = async () => {
    setLoading(true);
    try {
      const b = await api.fetchLeaderboard();
      setBoard(b);
      setLocalOnly(false);
    } catch {
      // No server board (signed out, or offline). Show your own row only,
      // and say so plainly.
      setBoard(localBoard());
      setLocalOnly(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (optedIn) {
      void loadBoard();
    } else {
      setBoard(null);
      setLocalOnly(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optedIn]);

  const toggleOptIn = () => {
    if (saving) return;
    setSaving(true);
    const turningOn = !optedIn;
    update((d) => {
      d.communityOptIn = turningOn;
    });
    toast(
      turningOn
        ? 'You joined the community board. Only your guardian name and this month’s showing up counts are shared.'
        : 'You left the community board. Your name is off it now.',
    );
    window.setTimeout(() => setSaving(false), 700);
  };

  const me = board?.me ?? null;
  const inTopFive = me !== null && me.rank <= 5;
  const gapLine = (): string | null => {
    if (!board || !me || !board.aheadOfMe || me.rank <= 5) return null;
    const ahead = board.aheadOfMe;
    const wGap = ahead.workouts - me.workouts;
    if (wGap > 0) {
      return `You are ${ordinal(me.rank)} this month, ${wGap} ${wGap === 1 ? 'workout' : 'workouts'} behind ${ordinal(ahead.rank)}.`;
    }
    const cGap = ahead.checkins - me.checkins;
    if (cGap > 0) {
      return `You are ${ordinal(me.rank)} this month, ${cGap} ${cGap === 1 ? 'check-in' : 'check-ins'} behind ${ordinal(ahead.rank)}.`;
    }
    return `You are ${ordinal(me.rank)} this month, tied with the person above you.`;
  };

  return (
    <div className="card" id="community">
      <div className="row space">
        <h3 style={{ margin: 0 }}>Community board</h3>
        <Switch
          checked={optedIn}
          onChange={toggleOptIn}
          label="Community board on or off"
          hint="Turn on to join the board"
        />
      </div>
      <p className="small muted">
        See how everyone is showing up, without anyone seeing your real name. Turn it on to join. Turn it off any time and your name comes straight off.
      </p>
      <p className="small">
        <strong>Shared when you join:</strong> your guardian name, and this month’s workouts, check-ins, cardio minutes, and streak days.
      </p>
      <p className="small">
        <strong>Never shared:</strong> your real name, your email, your weight, your measurements, or your photos.
      </p>
      <p className="small muted">
        Ranked on showing up only, not on strength or weight. Score: 10 points per workout, 5 per check-in, 2 per streak day, 1 per 10 cardio minutes. Top 5 shown, plus your own place. The board resets on the 1st of the month, so everyone starts fresh.
      </p>

      {!optedIn && (
        <p className="muted">The board is off. Turn it on to join in.</p>
      )}

      {optedIn && !doc.guardian && (
        <p>Pick your guardian in Armor first. That name is what shows on the board.</p>
      )}

      {optedIn && doc.guardian && loading && !board && (
        <p className="muted">Loading the board…</p>
      )}

      {optedIn && doc.guardian && board && (
        <div>
          <p><strong>{board.monthLabel}</strong> · {board.totalOptedIn} {board.totalOptedIn === 1 ? 'person' : 'people'} on the board this month.</p>
          {localOnly && (
            <p className="small muted">The shared board could not be reached right now, so this is your row only, from this device.</p>
          )}
          {board.totalOptedIn === 1 && !localOnly && (
            <p className="small muted">You are the first one here. When more people join, the board fills in.</p>
          )}
          {board.top.length === 0 && (
            <p className="muted">No one is on the board yet.</p>
          )}
          {board.top.map((e) => (
            <p key={`${e.rank}-${e.name}`} style={{ margin: '6px 0', fontWeight: e.isMe ? 700 : 400 }}>
              {e.rank}. {e.name}{e.isMe ? ' (you)' : ''} · {entryLine(e)}
            </p>
          ))}
          {me && !inTopFive && (
            <div>
              <p className="small muted" style={{ margin: '10px 0 4px' }}>…</p>
              <p style={{ margin: '6px 0', fontWeight: 700 }}>
                {me.rank}. {me.name} (you) · {entryLine(me)}
              </p>
              {gapLine() && <p className="small">{gapLine()}</p>}
            </div>
          )}
          <div className="row" style={{ marginTop: 8 }}>
            <button onClick={() => void loadBoard()} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh the board'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

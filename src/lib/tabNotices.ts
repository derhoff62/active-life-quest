// What the nav badge on each tab actually means, shown as a short notice
// at the very top of the tab when you open it. Same rules as the badges
// in badges.ts, so the notice and the badge always agree, and the notice
// disappears the moment the thing is done. Plain words, one or two lines,
// no totals, no program length, no brand names.
import {
  cardioThisWeek,
  newCompanions,
  newGearNames,
  nextRetestDueWeek,
  readyBoss,
  unreadCount,
  weighInDue,
  workoutDueToday,
} from './badges';
import { loggedToday, hasApprovedRetest, type ProfileDoc } from './store';
import type { Tab } from '../App';

export interface NoticeAction {
  label: string;
  /** Open another tab. */
  go?: Tab;
  /** Pick a section inside the Health tab (Cardio, Sleep, or Food). */
  section?: string;
  /** Scroll to this element id on the current tab. */
  anchor?: string;
}

export interface TabNotice {
  text: string;
  actions: NoticeAction[];
}

function joinList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]}, and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export function tabNotice(doc: ProfileDoc, tab: Tab): TabNotice | null {
  switch (tab) {
    case 'today': {
      const items: string[] = [];
      const actions: NoticeAction[] = [];
      if (!loggedToday(doc.checkins)) {
        items.push('daily check-in not logged yet');
        actions.push({ label: 'Log check-in', anchor: 'today-checkin' });
      }
      if (workoutDueToday(doc)) {
        items.push("today's workout not done yet");
        actions.push({ label: "Start today's workout", go: 'train' });
      }
      const unread = unreadCount(doc);
      if (unread > 0) {
        items.push(unread === 1 ? 'a message from Derek to read' : `${unread} messages from Derek to read`);
        actions.push({ label: 'Read messages', anchor: 'today-messages' });
      }
      if (items.length === 0) return null;
      const count = items.length;
      return {
        text: `${count === 1 ? '1 thing' : `${count} things`} to do today: ${joinList(items)}.`,
        actions,
      };
    }
    case 'train': {
      if (!doc.assessmentDone) {
        return {
          text: 'Finish your assessment to set your starting phase.',
          actions: [{ label: 'Start assessment', anchor: 'assessment-start' }],
        };
      }
      const dueWeek = nextRetestDueWeek(doc);
      if (dueWeek !== null) {
        return {
          text: dueWeek === 52
            ? 'Retest due: a review retest. A short check, not the full assessment.'
            : `Retest due: Week ${dueWeek}. A short check, not the full assessment.`,
          actions: [{ label: 'Do the retest', anchor: 'retest' }],
        };
      }
      const week12Done = hasApprovedRetest(doc, 12);
      if (week12Done && !doc.week13Goal) {
        return {
          text: 'Your next stretch is ready. Pick what comes next.',
          actions: [{ label: 'Pick my next stretch', anchor: 'week13-plan' }],
        };
      }
      if (!workoutDueToday(doc)) return null;
      return {
        text: "Today's workout is waiting.",
        actions: [{ label: "Start today's workout", anchor: 'best-workout' }],
      };
    }
    case 'health': {
      const parts: string[] = [];
      const actions: NoticeAction[] = [];
      const n = cardioThisWeek(doc);
      if (doc.assessmentDone && n < 150) {
        parts.push(`Cardio this week: ${n} of 150 minutes. ${150 - n} minutes to go to hit 150.`);
        actions.push({ label: 'Log cardio', go: 'health', section: 'cardio', anchor: 'log-cardio' });
      }
      if (doc.assessmentDone && !loggedToday(doc.sleep)) {
        parts.push('Sleep not logged yet today.');
        actions.push({ label: 'Log sleep', go: 'health', section: 'sleep', anchor: 'log-sleep' });
      }
      if (parts.length === 0) return null;
      return { text: parts.join(' '), actions };
    }
    case 'journey': {
      const parts: string[] = [];
      const actions: NoticeAction[] = [];
      const boss = readyBoss(doc);
      if (boss) {
        parts.push(`Boss round ready: ${boss.name} (${boss.hp} of ${boss.maxHp} HP left).`);
        actions.push({ label: 'Go to Combat', anchor: 'combat' });
      }
      const comps = newCompanions(doc);
      if (comps.length > 0) {
        const names = comps.map((c) => c.name);
        parts.push(`New companion to meet: ${joinList(names)}.`);
        actions.push({ label: 'Meet them', anchor: 'companions' });
      }
      if (parts.length === 0) return null;
      return { text: parts.join(' '), actions };
    }
    case 'progress': {
      if (!weighInDue(doc)) return null;
      return {
        text: 'Weigh-in due: no weigh-in in the last 6 days.',
        actions: [{ label: 'Log a weigh-in', anchor: 'weigh-in' }],
      };
    }
    case 'gear': {
      const names = newGearNames(doc);
      if (names.length === 0) return null;
      return {
        text: `New gear earned: ${joinList(names)}.`,
        actions: [{ label: 'See your gear', anchor: 'gear-list' }],
      };
    }
    case 'coach': {
      const unread = unreadCount(doc);
      if (unread === 0) return null;
      return {
        text: unread === 1 ? 'Derek has a message for you.' : `Derek has ${unread} messages for you.`,
        actions: [{ label: 'Read messages', go: 'today', anchor: 'today-messages' }],
      };
    }
    default:
      // Nutrition and FAQ never have badges, so they never have a notice.
      return null;
  }
}

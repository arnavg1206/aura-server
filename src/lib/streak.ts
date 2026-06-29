import { SyncedSession } from '@prisma/client';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function computeStreak(sessions: SyncedSession[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDays = [...new Set(sessions.map(s => startOfDay(s.date).getTime()))]
    .sort((a, b) => b - a)
    .map(t => new Date(t));

  const today = startOfDay(new Date());
  // Use abs to handle future-dated sessions (clock skew)
  if (Math.abs(dayDiff(today, uniqueDays[0])) > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (dayDiff(uniqueDays[i - 1], uniqueDays[i]) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function weeklyMinutes(sessions: SyncedSession[]): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  return sessions
    .filter(s => s.date >= weekStart)
    .reduce((sum, s) => sum + Math.floor(s.durationSeconds / 60), 0);
}

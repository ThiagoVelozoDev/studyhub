export function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function startOfWeek(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return startOfDay(d);
}

export function startOfMonth(date: Date): number {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfDay(d);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

/** Sequência de dias consecutivos (incluindo hoje) com pelo menos uma sessão de estudo. */
export function computeStreak(sessionStarts: number[], now: number = Date.now()): number {
  const todayStart = startOfDay(new Date(now));
  const uniqueDays = Array.from(new Set(sessionStarts.map((t) => startOfDay(new Date(t))))).sort(
    (a, b) => b - a
  );
  let streak = 0;
  let cursor = todayStart;
  for (const day of uniqueDays) {
    if (day === cursor) {
      streak += 1;
      cursor -= 86_400_000;
    } else if (day < cursor) {
      break;
    }
  }
  return streak;
}

// Calendar-day arithmetic keeps Monday–Sunday boundaries stable through Sofia DST changes.
export function sofiaWeek(day: string): { start: string; end: string } {
 const date = new Date(`${day}T12:00:00Z`);
 if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) throw new RangeError("Invalid Sofia calendar day");
 date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
 const start = date.toISOString().slice(0, 10);
 date.setUTCDate(date.getUTCDate() + 6);
 return { start, end: date.toISOString().slice(0, 10) };
}

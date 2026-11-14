const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export function formatEventTime(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${dateFormat.format(start)} · ${timeFormat.format(start)}–${timeFormat.format(end)}`
    : `${dateFormat.format(start)} ${timeFormat.format(start)} – ${dateFormat.format(end)} ${timeFormat.format(end)}`;
}

export function seatsLabel(capacity: number | null, participants: number): string {
  if (capacity === null) return `${participants} going`;
  const left = Math.max(capacity - participants, 0);
  return left === 0 ? 'Full' : `${left} of ${capacity} places left`;
}

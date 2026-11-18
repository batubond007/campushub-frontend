// Date and time text for event cards, e.g. "Thu, 19 Nov 2026" and "14:00 – 15:30".

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const longDayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' })
const shortDayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function formatDay(iso: string) {
  return dayFormat.format(new Date(iso))
}

/** "14:00 – 15:30", or "22:00 – Fri, 20 Nov, 01:00" when the event ends on a later day. */
export function formatTimeRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const endText = sameDay(start, end) ? timeFormat.format(end) : `${shortDayFormat.format(end)}, ${timeFormat.format(end)}`
  return `${timeFormat.format(start)} – ${endText}`
}

/** "Thursday, 19 November 2026", or "Thursday, 19 November 2026 – Saturday, 21 November 2026" for multi-day events. */
export function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return sameDay(start, end) ? longDayFormat.format(start) : `${longDayFormat.format(start)} – ${longDayFormat.format(end)}`
}

/** Big day number and short month for the date block on each card. */
export function dateBlock(iso: string) {
  const date = new Date(iso)
  return { day: date.getDate(), month: monthFormat.format(date) }
}

/** "1 h 30 min", "2 h", "45 min", or "2 d 3 h" for events longer than a day. */
export function formatDuration(startIso: string, endIso: string) {
  const minutes = Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60_000)
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  const m = minutes % 60
  const parts = [d && `${d} d`, h && `${h} h`, !d && m && `${m} min`].filter(Boolean)
  return parts.join(' ') || '0 min'
}

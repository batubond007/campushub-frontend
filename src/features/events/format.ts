// Date and time text for event cards, e.g. "Thu, 19 Nov 2026" and "14:00 – 15:30".

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' })

export function formatDay(iso: string) {
  return dayFormat.format(new Date(iso))
}

export function formatTimeRange(startIso: string, endIso: string) {
  return `${timeFormat.format(new Date(startIso))} – ${timeFormat.format(new Date(endIso))}`
}

/** Big day number and short month for the date block on each card. */
export function dateBlock(iso: string) {
  const date = new Date(iso)
  return { day: date.getDate(), month: monthFormat.format(date) }
}

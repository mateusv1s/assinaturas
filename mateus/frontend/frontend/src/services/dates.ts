export const utcToday = () => new Date().toISOString().slice(0, 10)

export function addUtcDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

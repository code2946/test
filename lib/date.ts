export function getYear(dateString: string | null | undefined): string {
  if (!dateString) return "—"
  const year = new Date(dateString).getFullYear()
  return Number.isNaN(year) ? "—" : year.toString()
}

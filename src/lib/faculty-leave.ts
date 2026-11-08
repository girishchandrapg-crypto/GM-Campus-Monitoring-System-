export function validateFacultyLeave(from: string, to: string, reason: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return "Select both dates.";
  if (from < today) return "Start date cannot be in the past.";
  if (to < from) return "End date must be on or after the start date.";
  if (reason.trim().length < 10 || reason.trim().length > 500) return "Reason must be 10–500 characters.";
  return null;
}
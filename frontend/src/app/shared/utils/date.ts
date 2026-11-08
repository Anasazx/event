/** Converts a Date to the "yyyy-MM-ddTHH:mm" string used by <input type="datetime-local"> and the API. */
export function toLocalInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.slice(0, 16);
}

/** Current local time, rounded up to the next hour, in datetime-local format. */
export function nextHourInputValue(): string {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return toDateTimeString(date);
}

export function toDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Days from now until a date (negative when in the past). */
export function isInPast(value: string | null | undefined): boolean {
  return !!value && new Date(value).getTime() < Date.now();
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${m}/${d}/${y}`;
}

export function isOverdue(dueDate: string, returnDate: string | null): boolean {
  if (returnDate) return false;
  return new Date(dueDate) < new Date();
}

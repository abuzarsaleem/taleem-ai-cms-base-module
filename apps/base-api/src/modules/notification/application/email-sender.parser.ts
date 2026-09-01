export function parseEmailSender(from: string): { name: string; email: string } {
  const trimmed = from.trim();
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: 'Taleem AI', email: trimmed };
}

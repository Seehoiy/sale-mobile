export function genCode(prefix: string) {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${y}${m}${d}-${rand}`;
}

export function formatKip(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("lo-LA").format(n) + " ₭";
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

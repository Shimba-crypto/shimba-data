function toCsv(rows) {
  if (!Array.isArray(rows) || !rows.length) return "";
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function sendCsv(req, res, rows) {
  if (req.query.format === "csv") {
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.send(toCsv(Array.isArray(rows) ? rows : [rows]));
    return true;
  }
  return false;
}

export { toCsv };

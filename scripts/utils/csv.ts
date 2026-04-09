// Minimal CSV parser that supports:
// - commas
// - quoted fields with "" escaping
// - CRLF / LF
// This is intentionally small and dependency-free to keep the repo beginner-friendly.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // ignore trailing completely-empty rows
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i++;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      pushField();
      continue;
    }
    if (ch === "\n") {
      pushField();
      pushRow();
      continue;
    }
    if (ch === "\r") {
      // swallow CR in CRLF
      continue;
    }
    field += ch;
  }

  pushField();
  if (row.length > 0) pushRow();
  return rows;
}

export function rowsToObjects(rows: string[][]): Array<Record<string, string>> {
  if (rows.length === 0) return [];
  const header = rows[0]!.map((h) => h.trim());
  const objects: Array<Record<string, string>> = [];
  for (const dataRow of rows.slice(1)) {
    if (dataRow.every((c) => c.trim() === "")) continue;
    const obj: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      obj[header[i]!] = (dataRow[i] ?? "").trim();
    }
    objects.push(obj);
  }
  return objects;
}


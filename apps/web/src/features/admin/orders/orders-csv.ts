// Excel opens a UTF-8 file as Arabic only when it starts with a byte-order mark.
const BOM = '﻿';

const escape = (cell: string) => (/[",\n\r]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell);

/** Rows of text cells to CSV: quoted where needed, Windows line endings, readable by Excel in Arabic. */
export function toCsv(header: string[], rows: string[][]): string {
  return BOM + [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
}

/** Saves text as a file through a temporary link, the way browsers allow downloads from script. */
export function downloadFile(name: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

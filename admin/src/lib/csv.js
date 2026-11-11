// Safe CSV export shared by every "Export page" button.
//
// - Text that a spreadsheet would run as a formula (starts with = + - @, a tab
//   or a carriage return) is prefixed with an apostrophe so it stays text.
// - Real numbers are left alone, so negative amounts still export as numbers.
// - A UTF-8 BOM is prepended so Excel reads the naira sign and accents correctly.

const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value) {
  if (value === null || value === undefined) return '""'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '""'
  let text = String(value)
  if (FORMULA_START.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

export function toCsv(header, rows) {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

/** Builds the file in the browser and downloads it. `name` has no extension or date. */
export function downloadCsv(name, header, rows) {
  const blob = new Blob(['﻿' + toCsv(header, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** YYYY-MM-DD for a date column, or '' when the value is missing/invalid. */
export function csvDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body || {};
    // type: 'csv' or 'text' (OCR text is handled client-side)
    // data: raw CSV string or parsed rows

    if (type === 'csv') {
      const lines = data.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV must have at least a header and one data row' });
      }

      const header = lines[0].toLowerCase();
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 4) continue;

        // Try to extract: total, held, present, absent from numeric columns
        const nums = cols.map(c => Number(c)).filter(n => !isNaN(n) && Number.isFinite(n));
        const textCols = cols.filter(c => isNaN(Number(c)) && c.length > 0);

        if (nums.length >= 4) {
          rows.push({
            name: textCols[0] || `Course ${i}`,
            code: textCols.length > 1 ? textCols[1] : '',
            total: nums[0],
            held: nums[1],
            present: nums[2],
            absent: nums[3],
          });
        }
      }

      return res.json({ ok: true, rows, count: rows.length });
    }

    return res.status(400).json({ error: 'Unsupported type: ' + type });
  } catch (err) {
    console.error('[attendance-upload error]', err);
    res.status(500).json({ error: err.message });
  }
};

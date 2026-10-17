// Export utilities — generate CSV and PDF from board tasks

export function exportCSV(tasks, boardName) {
  const headers = ['Title', 'Description', 'Status', 'Priority', 'Labels', 'Assignee', 'Progress %', 'Due Date', 'Created'];
  const rows = tasks.map((t) => [
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.status || '',
    t.priority || '',
    `"${(t.labels || []).join(', ')}"`,
    t.assignee ? t.assignee.name : 'Unassigned',
    t.progress ?? 0,
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${boardName || 'taskflow'}-tasks.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportPDF(tasks, boardName) {
  const statusColor = { todo: '#8b93a7', 'in-progress': '#6366f1', done: '#10b981' };
  const priorityColor = { low: '#8b93a7', medium: '#f59e0b', high: '#f87171' };

  const rows = tasks.map((t) => `
    <tr>
      <td>${escHtml(t.title)}</td>
      <td style="color:${statusColor[t.status]}">${t.status}</td>
      <td style="color:${priorityColor[t.priority]}">${t.priority}</td>
      <td>${(t.labels || []).map(l => `<span class="label">${escHtml(l)}</span>`).join(' ')}</td>
      <td>${t.assignee ? escHtml(t.assignee.name) : 'Unassigned'}</td>
      <td>${t.progress ?? 0}%</td>
      <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escHtml(boardName)} — Tasks</title>
  <style>
    body { font-family: Inter, sans-serif; padding: 32px; color: #1f2937; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    p.meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 600; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .label { background: #ede9fe; color: #7c3aed; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 3px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escHtml(boardName)} — Task Export</h1>
  <p class="meta">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total tasks: ${tasks.length}</p>
  <table>
    <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Labels</th><th>Assignee</th><th>Progress</th><th>Due Date</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

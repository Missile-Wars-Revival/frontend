const data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const rel = (p) => p.replace(/.*frontend[\\/]/, '');
for (const f of data) {
  const errs = f.messages.filter((m) => m.severity === 2);
  if (!errs.length) continue;
  console.log('\n### ' + rel(f.filePath));
  for (const m of errs) {
    console.log('  ' + m.line + ':' + m.column + '  ' + m.ruleId + '  ' + m.message.split('\n')[0].slice(0, 90));
  }
}

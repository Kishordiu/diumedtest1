const fs = require('fs');
let code = fs.readFileSync('src/features/bio-aura/rppg/rppgEngine.ts', 'utf8');

code = code.replace(/reason: (.*?),/g, (match, p1) => {
  if (p1 === 'null') {
    return 'reason: null,\n    waveform: typeof filtered !== \"undefined\" ? filtered : [],';
  }
  return `reason: ${p1},\n      waveform: [],`;
});

fs.writeFileSync('src/features/bio-aura/rppg/rppgEngine.ts', code);
console.log('done');

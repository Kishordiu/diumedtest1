const fs = require('fs');
let code = fs.readFileSync('src/features/records/RecordsPage.tsx', 'utf8');

code = code.replace(
  "import { Activity, ClipboardList } from 'lucide-react'",
  "import { Activity, ClipboardList, Camera } from 'lucide-react'"
);

code = code.replace(
  '<div className="px-5 pt-5 pb-4 border-b border-white/5">\\n        <h1 className="text-warm-pearl text-xl font-semibold">{t(\'records.title\')}</h1>\\n      </div>',
  `<div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-center justify-between">
        <h1 className="text-warm-pearl text-xl font-semibold">{t('records.title')}</h1>
        <button 
          onClick={() => navigate('/scan-lab-report')} 
          className="text-signal-teal bg-signal-teal/10 p-2 rounded-xl flex items-center gap-2 hover:bg-signal-teal/20 transition-colors"
        >
          <Camera size={18} />
          <span className="text-xs font-medium uppercase tracking-wider">Scan Report</span>
        </button>
      </div>`
);

fs.writeFileSync('src/features/records/RecordsPage.tsx', code);
console.log('done');

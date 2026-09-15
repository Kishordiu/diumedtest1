const fs = require('fs');

let code = fs.readFileSync('src/features/records/RecordDetailPage.tsx', 'utf8');

// Import LiveSignalGraph
code = code.replace(
  "import { ArrowLeft, Activity } from 'lucide-react'",
  "import { ArrowLeft, Activity } from 'lucide-react'\nimport { LiveSignalGraph } from '../../shared/components/LiveSignalGraph'"
);

// Add waveform section before disclaimer
code = code.replace(
  "{/* Disclaimer */}",
  `{meta?.signal_snapshot && Array.isArray(meta.signal_snapshot) && (
          <div className="bg-deep-graphite rounded-card p-4 border border-white/5">
            <p className="text-muted-slate text-sm mb-3">Signal Snapshot</p>
            <LiveSignalGraph waveform={meta.signal_snapshot as number[]} color="#53B7A8" height={60} />
          </div>
        )}

        {/* Disclaimer */}`
);

fs.writeFileSync('src/features/records/RecordDetailPage.tsx', code);
console.log('done');

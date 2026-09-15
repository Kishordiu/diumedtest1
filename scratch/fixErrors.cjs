const fs = require('fs');

// 1. types.ts
let types = fs.readFileSync('src/features/bio-aura/camera/types.ts', 'utf8');
types = types.replace(
  "export type SignalQuality = 'UNKNOWN' | 'POOR' | 'FAIR' | 'GOOD';",
  "export type SignalQuality = 'UNKNOWN' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';"
);
fs.writeFileSync('src/features/bio-aura/camera/types.ts', types);

// 2. Router.tsx
let router = fs.readFileSync('src/app/Router.tsx', 'utf8');
router = router.replace(
  "const BioAuraPage = lazy(() => import('../features/bio-aura/BioAuraPage'))",
  "const BioAuraPage = lazy(() => import('../features/bio-aura/BioAuraPage').then(m => ({ default: m.BioAuraPage })))"
);
fs.writeFileSync('src/app/Router.tsx', router);

// 3. BioAuraPage.tsx
let bioAura = fs.readFileSync('src/features/bio-aura/BioAuraPage.tsx', 'utf8');
bioAura = bioAura.replace("import { Button }", "import Button");
bioAura = bioAura.replace("import { TopNavigation } from '../../shared/components/TopNavigation'\n", "");
bioAura = bioAura.replace(
  '<TopNavigation title="Bio-Aura Scanner" />',
  `<div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-muted-slate hover:text-stone transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-warm-pearl font-semibold">Scanner</h1>
      </div>`
);
bioAura = bioAura.replace(
  "import { Camera, RefreshCw, Cpu, ChevronDown, ChevronUp, AlertCircle, Heart } from 'lucide-react'",
  "import { Camera, RefreshCw, Cpu, ChevronDown, ChevronUp, AlertCircle, Heart, ArrowLeft } from 'lucide-react'"
);
bioAura = bioAura.replace("import { RawSignalDebugger } from '../../shared/components/RawSignalDebugger'\n", "");
fs.writeFileSync('src/features/bio-aura/BioAuraPage.tsx', bioAura);

// 4. MeasurementResultPage.tsx
let mrp = fs.readFileSync('src/features/records/MeasurementResultPage.tsx', 'utf8');
mrp = mrp.replace("import { Button }", "import Button");
mrp = mrp.replace("import { TopNavigation } from '../../shared/components/TopNavigation'\n", "");
mrp = mrp.replace(
  '<TopNavigation title="Measurement Report" backTo="/bio-aura" />',
  `<div className="flex items-center gap-3 px-5 pt-4 pb-4 border-b border-white/5">
        <button onClick={() => navigate('/bio-aura')} className="text-muted-slate hover:text-stone transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-warm-pearl font-semibold">Measurement Report</h1>
      </div>`
);
mrp = mrp.replace(
  "await supabase.from('health_measurements').insert({",
  "await supabase.from('health_measurements').insert([{"
);
mrp = mrp.replace(
  "signal_snapshot: compactWaveform\n        }\n      })",
  "signal_snapshot: compactWaveform\n        }\n      } as any])"
);
fs.writeFileSync('src/features/records/MeasurementResultPage.tsx', mrp);

// 5. RecordDetailPage.tsx
let rdp = fs.readFileSync('src/features/records/RecordDetailPage.tsx', 'utf8');
rdp = rdp.replace(
  "{ label: 'Confidence', value: meta?.confidence != null ? `${Math.round((meta.confidence as number) * 100)}%` : '?\"' },",
  "{ label: 'Confidence', value: (meta && meta.confidence != null) ? `${Math.round((meta.confidence as number) * 100)}%` : '--' },"
);
rdp = rdp.replace(
  "{ label: 'FPS', value: meta?.fps != null ? String((meta.fps as number).toFixed(1)) : '?\"' },",
  "{ label: 'FPS', value: (meta && meta.fps != null) ? String((meta.fps as number).toFixed(1)) : '--' },"
);
fs.writeFileSync('src/features/records/RecordDetailPage.tsx', rdp);
console.log('done');

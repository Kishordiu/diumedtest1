const fs = require('fs');

let code = fs.readFileSync('src/features/records/RecordsPage.tsx', 'utf8');

// Insert Daily Summary above the timeline mapping
code = code.replace(
  "{/* Group by date */}",
  `{/* Group by date */}
          {(() => {
            const groups = groupByDate(measurements);
            return groups.map(({ date, items }, groupIndex) => {
              // Calculate daily summary for the first group (most recent day)
              let dailySummary = null;
              if (groupIndex === 0 && items.length > 0) {
                const bpms = items.map(i => i.value_numeric).filter(v => v !== null) as number[];
                if (bpms.length > 0) {
                  const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
                  const min = Math.min(...bpms);
                  const max = Math.max(...bpms);
                  dailySummary = (
                    <div className="bg-deep-graphite rounded-card p-4 border border-white/5 mb-4 flex items-center justify-around">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Avg</p>
                        <p className="text-warm-pearl font-medium">{avg} <span className="text-xs text-muted-slate">bpm</span></p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Min</p>
                        <p className="text-stone font-medium">{min}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="text-center">
                        <p className="text-[10px] text-muted-slate uppercase tracking-wider mb-1">Max</p>
                        <p className="text-stone font-medium">{max}</p>
                      </div>
                    </div>
                  );
                }
              }

              return (
                <div key={date}>
                  <p className="text-muted-slate text-xs tracking-wider uppercase mb-2 mt-4 first:mt-0">
                    {date}
                  </p>
                  {dailySummary}
                  {items.map(m => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate(\`/records/\${m.id}\`)}
                      className="w-full bg-deep-graphite rounded-card p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border border-white/5 mb-2"
                    >
                      <div className="w-10 h-10 rounded-instrument bg-signal-teal/10 flex items-center justify-center flex-shrink-0">
                        <Activity size={16} className="text-signal-teal" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-warm-pearl text-sm font-medium">
                          {formatMeasurementType(m.measurement_type)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-muted-slate text-xs">
                            {new Date(m.captured_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-stone font-mono">
                            {(m.metadata as any)?.source === 'camera_contact_ppg' ? 'Pulse Touch' : 'Bio-Aura'}
                          </span>
                        </div>
                      </div>
                      {m.value_numeric !== null ? (
                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-baseline">
                            <span className="readout text-signal-teal text-xl font-thin">
                              {Math.round(m.value_numeric)}
                            </span>
                            <span className="text-muted-slate text-xs ml-1">{m.unit}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-slate text-xs">No data</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      )}`
);

// We need to delete the original mapping logic inside the container
code = code.replace(
  /\{groupByDate\(measurements\)[\s\S]*?(?=\s*<\/div>\s*\)}/g,
  ""
);

fs.writeFileSync('src/features/records/RecordsPage.tsx', code);
console.log('done');

import React, { useState } from 'react';
import type { ReadinessResult } from 'shared/domain/readiness/readiness';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { Sparkles, TrendingUp, TrendingDown, Table as TableIcon, Flower } from 'lucide-react';

interface ReadinessBloomProps {
  readiness: ReadinessResult;
}

export const ReadinessBloom: React.FC<ReadinessBloomProps> = ({ readiness }) => {
  const [viewMode, setViewMode] = useState<'bloom' | 'table'>('bloom');
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  const { score, expected, pace, paceLabel, dimensions, nextBestActions } = readiness;

  const paceVariant = 
    pace >= 0 ? 'success' : pace >= -10 ? 'warning' : 'danger';

  // 5 petals distributed around circle: 0, 72, 144, 216, 288 degrees
  // Radius of center: 45, petal length: 65
  const center = 150;
  const petalAngles = [-90, -18, 54, 126, 198]; // Top, top-right, bot-right, bot-left, top-left

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Readiness Bloom
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Holistic event preparation across 5 critical planning pillars
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill variant={paceVariant}>
            {pace >= 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
            {paceLabel} ({pace > 0 ? `+${pace}` : pace})
          </StatusPill>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'bloom' ? 'table' : 'bloom')}
            className="h-8 text-xs flex items-center gap-1"
            title={viewMode === 'bloom' ? 'Switch to accessible table' : 'Switch to Bloom diagram'}
          >
            {viewMode === 'bloom' ? (
              <>
                <TableIcon className="w-3.5 h-3.5" />
                Table
              </>
            ) : (
              <>
                <Flower className="w-3.5 h-3.5" />
                Bloom
              </>
            )}
          </Button>
        </div>
      </div>

      {viewMode === 'bloom' ? (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
          {/* SVG Bloom */}
          <div className="relative w-72 h-72 flex-shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full overflow-visible"
              aria-label={`Readiness Bloom diagram: overall score ${score} out of 100`}
              role="img"
            >
              <defs>
                <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="activePetalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity="1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Petals */}
              {dimensions.map((dim, i) => {
                const angleDeg = petalAngles[i] ?? -90;
                const pct = dim.maxPoints > 0 ? dim.score / dim.maxPoints : 0;
                const length = 45 + pct * 55; // petal height scales with completion

                // Petal path pointing outward from center
                const isHovered = activeDimension === dim.name;
                const fill = isHovered ? 'url(#activePetalGradient)' : 'url(#petalGradient)';
                const opacity = Math.max(0.35, pct);

                return (
                  <g
                    key={dim.name}
                    transform={`translate(${center}, ${center}) rotate(${angleDeg})`}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setActiveDimension(dim.name)}
                    onMouseLeave={() => setActiveDimension(null)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${dim.label}: ${dim.score} of ${dim.maxPoints} points`}
                    onFocus={() => setActiveDimension(dim.name)}
                    onBlur={() => setActiveDimension(null)}
                  >
                    <path
                      d={`M 0 0 C -22 -${length * 0.4} -25 -${length * 0.9} 0 -${length} C 25 -${length * 0.9} 22 -${length * 0.4} 0 0 Z`}
                      fill={fill}
                      stroke={isHovered ? '#312e81' : '#6366f1'}
                      strokeWidth={isHovered ? '2.5' : '1.5'}
                      fillOpacity={opacity}
                      className="transition-all duration-300"
                    />
                    {/* Dimension Dot */}
                    <circle cx="0" cy={-length} r={isHovered ? 5 : 3.5} fill="#4f46e5" />
                  </g>
                );
              })}

              {/* Center Core */}
              <circle
                cx={center}
                cy={center}
                r="44"
                fill="#ffffff"
                stroke="#e0e7ff"
                strokeWidth="4"
                className="dark:fill-stone-900 dark:stroke-stone-700 shadow-md"
              />
              <text
                x={center}
                y={center - 4}
                textAnchor="middle"
                className="text-2xl font-black fill-stone-900 dark:fill-stone-100"
                style={{ fontSize: '24px', fontWeight: 800 }}
              >
                {score}%
              </text>
              <text
                x={center}
                y={center + 16}
                textAnchor="middle"
                className="text-[10px] font-medium fill-stone-500 dark:fill-stone-400 uppercase tracking-wider"
                style={{ fontSize: '10px' }}
              >
                Exp: {expected}%
              </text>
            </svg>
          </div>

          {/* Dimension Details list */}
          <div className="flex-1 w-full space-y-2">
            {dimensions.map((dim) => {
              const pct = Math.round((dim.score / dim.maxPoints) * 100);
              const isSelected = activeDimension === dim.name;
              return (
                <div
                  key={dim.name}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40'
                  }`}
                  onMouseEnter={() => setActiveDimension(dim.name)}
                  onMouseLeave={() => setActiveDimension(null)}
                >
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {dim.label}
                    </span>
                    <span className="font-mono text-stone-600 dark:text-stone-400">
                      {dim.score} / {dim.maxPoints} pts ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-800 rounded-lg">
            <caption className="sr-only">Readiness Bloom Dimensions and Scores</caption>
            <thead className="bg-stone-100 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
              <tr>
                <th className="p-2.5">Planning Dimension</th>
                <th className="p-2.5 text-right">Score</th>
                <th className="p-2.5 text-right">Max Points</th>
                <th className="p-2.5 text-right">Expected</th>
                <th className="p-2.5 text-right">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {dimensions.map((d) => (
                <tr key={d.name} className="hover:bg-stone-50 dark:hover:bg-stone-800/30">
                  <td className="p-2.5 font-medium text-stone-900 dark:text-stone-100">{d.label}</td>
                  <td className="p-2.5 text-right font-mono">{d.score}</td>
                  <td className="p-2.5 text-right font-mono">{d.maxPoints}</td>
                  <td className="p-2.5 text-right font-mono">{d.expected}</td>
                  <td className="p-2.5 text-right font-mono font-semibold">
                    {Math.round((d.score / d.maxPoints) * 100)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-stone-50 dark:bg-stone-800/50 font-bold">
                <td className="p-2.5 text-stone-900 dark:text-stone-100">Overall Readiness</td>
                <td className="p-2.5 text-right font-mono">{score}</td>
                <td className="p-2.5 text-right font-mono">100</td>
                <td className="p-2.5 text-right font-mono">{expected}</td>
                <td className="p-2.5 text-right font-mono text-primary">{score}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Next Best Actions */}
      {nextBestActions.length > 0 && (
        <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Next Best Actions to Improve Readiness
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {nextBestActions.slice(0, 3).map((action, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/30 flex flex-col justify-between"
              >
                <div className="text-xs font-medium text-stone-800 dark:text-stone-200 mb-1">
                  {action.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="text-primary font-semibold">+{action.gain} pts</span>
                  <span className="bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                    Effort: {action.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

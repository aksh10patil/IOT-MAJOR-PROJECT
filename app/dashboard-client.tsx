'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Carrot,
  Cherry,
  CheckCircle,
  Database,
  Download,
  FlaskConical,
  Gauge,
  Milk,
  Signal,
  Waves,
  XCircle,
} from 'lucide-react';

import {
  CATEGORY_META,
  GROUP_META,
  GROUP_ORDER,
  getRangeForSensor,
  getRangeLabel,
  getSensorStage,
  READING_SENSOR_KEYS,
  SENSOR_META,
  SPOILAGE_STAGES,
  STAGE_META,
  type ItemCategory,
  type ReadingDataset,
  type ItemGroup,
  type ReadingItemPoint,
  type ReadingItemSummary,
  type ReadingSensorKey,
  type SpoilageStage,
} from '@/lib/spoilage-index';

interface DashboardClientProps {
  dataset: ReadingDataset;
}

const STAGE_STYLES: Record<
  SpoilageStage,
  {
    badge: string;
    dot: string;
    panel: string;
    bar: string;
    text: string;
  }
> = {
  fresh: {
    badge: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
    dot: 'bg-emerald-400',
    panel: 'border-emerald-400/40 bg-emerald-500 text-white',
    bar: '#22c55e',
    text: 'text-emerald-300',
  },
  early: {
    badge: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    dot: 'bg-amber-400',
    panel: 'border-amber-400/40 bg-amber-500 text-zinc-950',
    bar: '#f59e0b',
    text: 'text-amber-300',
  },
  spoiled: {
    badge: 'border-rose-400/50 bg-rose-500/10 text-rose-200',
    dot: 'bg-rose-500',
    panel: 'border-rose-400/40 bg-rose-600 text-white',
    bar: '#e11d48',
    text: 'text-rose-300',
  },
};

const SENSOR_ICONS: Record<ReadingSensorKey, React.ReactNode> = {
  mq3: <FlaskConical className="h-4 w-4" />,
  mq4: <Signal className="h-4 w-4" />,
  mq5: <Gauge className="h-4 w-4" />,
  mq135: <Activity className="h-4 w-4" />,
  turbidity: <Waves className="h-4 w-4" />,
};

const CATEGORY_ICONS: Record<ItemCategory, React.ReactNode> = {
  fruit: <Cherry className="h-4 w-4" />,
  vegetable: <Carrot className="h-4 w-4" />,
  curd: <Milk className="h-4 w-4" />,
  milk: <Milk className="h-4 w-4" />,
};

const GROUP_ICONS: Record<ItemGroup, React.ReactNode> = {
  fruits: <Cherry className="h-4 w-4" />,
  vegetables: <Carrot className="h-4 w-4" />,
  dairy: <Milk className="h-4 w-4" />,
};

const VALUE_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const formatValue = (value: number | null): string =>
  value === null ? 'N/A' : VALUE_FORMATTER.format(value);

const stageIcon = (stage: SpoilageStage) => {
  if (stage === 'fresh') {
    return <CheckCircle className="h-8 w-8" />;
  }

  if (stage === 'early') {
    return <AlertTriangle className="h-8 w-8" />;
  }

  return <XCircle className="h-8 w-8" />;
};

const createExportFilename = (itemName: string) =>
  `biosense-${itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'item'}.json`;

const StageBadge: React.FC<{ stage: SpoilageStage; compact?: boolean }> = ({
  stage,
  compact = false,
}) => (
  <span
    className={`inline-flex max-w-full shrink-0 items-center gap-2 rounded-md border font-semibold ${STAGE_STYLES[stage].badge} ${
      compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
    }`}
  >
    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STAGE_STYLES[stage].dot}`} />
    <span className="truncate">
      {compact ? STAGE_META[stage].shortLabel : STAGE_META[stage].label}
    </span>
  </span>
);

const StatCard: React.FC<{
  label: string;
  value: string | number;
  detail?: string;
}> = ({ label, value, detail }) => {
  const displayValue = typeof value === 'number' ? formatValue(value) : value;

  return (
    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="truncate text-sm text-zinc-400">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-white tabular-nums">
        {displayValue}
      </p>
      {detail ? <p className="mt-1 break-words text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
};

const SensorCard: React.FC<{
  category: ItemCategory;
  reading: ReadingItemPoint | null;
  sensor: ReadingSensorKey;
}> = ({ category, reading, sensor }) => {
  const meta = SENSOR_META[sensor];
  const value = reading?.[sensor] ?? null;
  const sensorStage = getSensorStage(category, sensor, value);
  const stage = sensorStage ?? 'fresh';
  const spoiledStart = getRangeForSensor(category, 'spoiled', sensor)?.min ?? 100;
  const percent =
    value === null ? 0 : Math.min(100, Math.max(0, (value / (spoiledStart * 1.25)) * 100));

  return (
    <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-400">
          <span className="shrink-0">{SENSOR_ICONS[sensor]}</span>
          <span className="truncate">{meta.label}</span>
        </div>
        {sensorStage ? (
          <StageBadge stage={sensorStage} compact />
        ) : (
          <span className="shrink-0 rounded-md border border-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-500">
            Not tracked
          </span>
        )}
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
        <span className="min-w-0 break-all text-2xl font-bold text-white tabular-nums sm:text-3xl">
          {formatValue(value)}
        </span>
        {value !== null ? <span className="mb-1 text-sm text-zinc-500">{meta.unit}</span> : null}
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-md bg-zinc-950">
        <div
          className="h-full rounded-md transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: STAGE_STYLES[stage].bar,
          }}
        />
      </div>

      <p className="mt-3 break-words text-xs text-zinc-500">
        {sensorStage
          ? `${STAGE_META[sensorStage].label} range: ${getRangeLabel(category, sensorStage, sensor)}`
          : 'No spoilage range for this category'}
      </p>
    </div>
  );
};

const MiniBarChart: React.FC<{
  rows: ReadingItemPoint[];
  category: ItemCategory;
  sensor: ReadingSensorKey;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}> = ({ rows, category, sensor, selectedDay, onSelectDay }) => {
  const points = rows
    .map((row) => ({
      day: row.day,
      value: row[sensor],
      stage: getSensorStage(category, sensor, row[sensor]),
    }))
    .filter(
      (point): point is { day: number; value: number; stage: SpoilageStage } =>
        point.value !== null && point.stage !== null
    );

  if (points.length === 0) {
    return (
      <div className="mt-3 flex h-36 items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
        No values
      </div>
    );
  }

  const referenceMax = getRangeForSensor(category, 'spoiled', sensor)?.max ?? 0;
  const maxValue = Math.max(...points.map((point) => point.value), referenceMax, 10) * 1.1;
  const chartWidth = Math.max(360, points.length * 22);

  return (
    <div className="mt-3 min-w-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-2 sm:p-3">
      <div className="overflow-x-auto overflow-y-hidden pb-1">
        <div className="min-w-full" style={{ minWidth: `${chartWidth}px` }}>
          <div className="flex h-36 items-end gap-1.5 pt-8">
            {points.map((point) => {
              const height = Math.max(6, (point.value / maxValue) * 100);
              const isSelected = selectedDay === point.day;

              return (
                <button
                  key={`${sensor}-${point.day}`}
                  type="button"
                  aria-label={`Select day ${point.day}, ${SENSOR_META[sensor].label} ${formatValue(point.value)}`}
                  title={`Day ${point.day}: ${formatValue(point.value)}`}
                  onClick={() => onSelectDay(point.day)}
                  className={`group relative block min-w-3 flex-1 rounded-t-sm transition hover:brightness-110 ${
                    isSelected ? 'ring-2 ring-inset ring-white/80' : ''
                  }`}
                  style={{
                    height: `${height}%`,
                    backgroundColor: STAGE_STYLES[point.stage].bar,
                  }}
                >
                  <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg group-hover:block">
                    {formatValue(point.value)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
            <span>Day {points[0].day}</span>
            <span>Day {points[points.length - 1].day}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpoilageIndexTable: React.FC<{ category: ItemCategory }> = ({ category }) => {
  const sensors = CATEGORY_META[category].sensors;

  return (
    <>
      <div className="grid gap-3 sm:hidden">
        {SPOILAGE_STAGES.map((stage) => (
          <div key={stage} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <StageBadge stage={stage} compact />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {sensors.map((sensor) => (
                <div key={sensor} className="min-w-0 rounded-md bg-zinc-900 p-2">
                  <p className="truncate text-[11px] font-semibold text-zinc-500">
                    {SENSOR_META[sensor].label}
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-zinc-200">
                    {getRangeLabel(category, stage, sensor)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-3 py-3 font-semibold">Stage</th>
              {sensors.map((sensor) => (
                <th key={sensor} className="px-3 py-3 font-semibold">
                  {SENSOR_META[sensor].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPOILAGE_STAGES.map((stage) => (
              <tr key={stage} className="border-b border-zinc-800/70 last:border-0">
                <td className="px-3 py-3">
                  <StageBadge stage={stage} compact />
                </td>
                {sensors.map((sensor) => (
                  <td key={sensor} className="px-3 py-3 font-medium text-zinc-200">
                    {getRangeLabel(category, stage, sensor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const RecordedValuesTable: React.FC<{
  rows: ReadingItemPoint[];
  category: ItemCategory;
  selectedDay: number | null;
}> = ({ rows, category, selectedDay }) => {
  const sensors = CATEGORY_META[category].sensors;

  return (
    <>
      <div className="grid max-h-[34rem] gap-3 overflow-y-auto pr-1 sm:hidden">
        {rows.map((row) => {
          const isSelected = row.day === selectedDay;

          return (
            <div
              key={row.id}
              className={`rounded-lg border p-3 ${
                isSelected
                  ? 'border-emerald-400/50 bg-emerald-400/10'
                  : 'border-zinc-800 bg-zinc-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-white tabular-nums">Day {row.day}</p>
                <StageBadge stage={row.stage} compact />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {sensors.map((sensor) => (
                  <div key={sensor} className="min-w-0 rounded-md bg-zinc-900 p-2">
                    <p className="truncate text-[11px] font-semibold text-zinc-500">
                      {SENSOR_META[sensor].label}
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-zinc-200 tabular-nums">
                      {formatValue(row[sensor])}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden max-h-[32rem] overflow-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-900">
            <tr className="border-b border-zinc-800 text-zinc-400">
              <th className="px-3 py-3 font-semibold">Day</th>
              {sensors.map((sensor) => (
                <th key={sensor} className="px-3 py-3 font-semibold">
                  {SENSOR_META[sensor].label}
                </th>
              ))}
              <th className="px-3 py-3 font-semibold">Spoilage Index</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = row.day === selectedDay;

              return (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-800/70 last:border-0 ${
                    isSelected ? 'bg-white/5' : ''
                  }`}
                >
                  <td className="px-3 py-3 font-semibold whitespace-nowrap text-white tabular-nums">
                    Day {row.day}
                  </td>
                  {sensors.map((sensor) => (
                    <td key={sensor} className="px-3 py-3 text-zinc-300 tabular-nums">
                      {formatValue(row[sensor])}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <StageBadge stage={row.stage} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default function DashboardClient({ dataset }: DashboardClientProps) {
  const firstItem = dataset.items[0]?.name ?? '';
  const [selectedItemName, setSelectedItemName] = useState(firstItem);
  const [selectedDay, setSelectedDay] = useState<number | null>(
    dataset.items[0]?.latestDay ?? null
  );

  const itemsByGroup = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        items: dataset.items.filter((item) => item.group === group),
      })),
    [dataset.items]
  );

  const selectedItemSummary =
    dataset.items.find((item) => item.name === selectedItemName) ?? dataset.items[0] ?? null;

  const selectedRows = useMemo(() => {
    if (!selectedItemSummary) {
      return [];
    }

    return dataset.readings
      .filter((reading) => reading.item === selectedItemSummary.name)
      .sort((a, b) => a.day - b.day);
  }, [dataset.readings, selectedItemSummary]);

  const latestReading = selectedRows[selectedRows.length - 1] ?? null;
  const effectiveDay = selectedRows.some((row) => row.day === selectedDay)
    ? selectedDay
    : latestReading?.day ?? null;
  const selectedReading =
    selectedRows.find((row) => row.day === effectiveDay) ?? latestReading;
  const selectedCategory = selectedItemSummary?.category ?? selectedReading?.category ?? 'fruit';
  const selectedGroup = selectedItemSummary?.group ?? selectedReading?.group ?? 'fruits';
  const activeSensors = CATEGORY_META[selectedCategory].sensors;
  const firstEarlyDay =
    selectedRows.find((row) => STAGE_META[row.stage].rank >= STAGE_META.early.rank)?.day ?? 'None';
  const firstSpoiledDay =
    selectedRows.find((row) => row.stage === 'spoiled')?.day ?? 'None';

  const handleSelectItem = (item: ReadingItemSummary) => {
    setSelectedItemName(item.name);
    setSelectedDay(item.latestDay);
  };

  const handleExport = () => {
    if (!selectedItemSummary) {
      return;
    }

    const blob = new Blob(
      [
        JSON.stringify(
          {
            source: dataset.source,
            item: selectedItemSummary,
            readings: selectedRows,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = createExportFilename(selectedItemSummary.name);
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedItemSummary || !selectedReading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-200">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
          <Database className="mx-auto h-8 w-8 text-zinc-500" />
          <h1 className="mt-4 text-xl font-bold text-white">No CSV readings found</h1>
          <p className="mt-2 text-sm text-zinc-400">{dataset.source}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-10 text-zinc-200 selection:bg-emerald-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-lg bg-emerald-500 p-2 text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">Food Spoilage Detection (By Narayan & Rajdeep - B.Tech VIII)</h1>
              <p className="truncate text-xs text-zinc-400">
                Local spoilage dashboard from {dataset.source}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
            {/* <span className="inline-flex justify-center rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              CSV mode
            </span> */}
            <span className="inline-flex justify-center rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400">
              API polling disabled
            </span>
            <button
              type="button"
              onClick={handleExport}
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 sm:col-span-1"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      <main className="isolate mx-auto mt-5 grid max-w-7xl gap-5 px-3 sm:mt-6 sm:px-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <aside className="relative z-10 min-w-0 space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-white">Food Items</h2>
                <p className="text-sm text-zinc-500">{formatValue(dataset.items.length)} items</p>
              </div>
              <Database className="h-5 w-5 shrink-0 text-emerald-300" />
            </div>

            <div className="space-y-5">
              {itemsByGroup.map(({ group, items }) =>
                items.length > 0 ? (
                  <div key={group} className="min-w-0">
                    <div className="mb-2 flex min-w-0 items-center gap-2 text-xs font-semibold text-zinc-500">
                      <span className="shrink-0">{GROUP_ICONS[group]}</span>
                      <span className="truncate">{GROUP_META[group].label}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      {items.map((item) => {
                        const isSelected = item.name === selectedItemSummary.name;

                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className={`min-w-0 rounded-lg border p-3 text-left transition ${
                              isSelected
                                ? 'border-emerald-400/60 bg-emerald-400/10'
                                : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">{item.name}</p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {formatValue(item.sampleCount)} days
                                </p>
                              </div>
                              <StageBadge stage={item.latestStage} compact />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <h2 className="font-semibold text-white">Dataset Snapshot</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-500">Rows</p>
                <p className="mt-1 break-all text-xl font-bold text-white tabular-nums">
                  {formatValue(dataset.readings.length)}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <p className="text-xs text-zinc-500">Sensors</p>
                <p className="mt-1 break-all text-xl font-bold text-white tabular-nums">
                  {formatValue(READING_SENSOR_KEYS.length)}
                </p>
              </div>
            </div>
          </section>
        </aside>

        <section className="relative z-0 min-w-0 space-y-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
            <section className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300">
                      <span className="shrink-0">{GROUP_ICONS[selectedGroup]}</span>
                      <span className="truncate">{GROUP_META[selectedGroup].label}</span>
                    </span>
                    <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300">
                      <span className="shrink-0">{CATEGORY_ICONS[selectedCategory]}</span>
                      <span className="truncate">{CATEGORY_META[selectedCategory].label}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 tabular-nums">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      Day {effectiveDay}
                    </span>
                  </div>
                  <h2 className="mt-4 break-words text-2xl font-bold text-white sm:text-3xl">
                    {selectedItemSummary.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                    {CATEGORY_META[selectedCategory].tableTitle}
                  </p>
                </div>

                <div className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 md:w-auto md:min-w-44">
                  <p className="text-sm text-zinc-500">Latest CSV sample</p>
                  <p className="mt-1 text-xl font-bold text-white tabular-nums">
                    Day {selectedItemSummary.latestDay}
                  </p>
                </div>
              </div>

              <select
                value={effectiveDay ?? ''}
                onChange={(event) => setSelectedDay(Number(event.target.value))}
                className="mt-5 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-white sm:hidden"
              >
                {selectedRows.map((row) => (
                  <option key={row.id} value={row.day}>
                    Day {row.day}
                  </option>
                ))}
              </select>

              <div className="-mx-1 mt-5 hidden overflow-x-auto px-1 pb-2 sm:block">
                <div className="flex min-w-max gap-2">
                  {selectedRows.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedDay(row.day)}
                      className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold tabular-nums transition ${
                        row.day === effectiveDay
                          ? 'border-white/80 bg-white text-zinc-950'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      Day {row.day}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section
              className={`min-w-0 rounded-lg border p-4 shadow-lg sm:p-5 ${STAGE_STYLES[selectedReading.stage].panel}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold opacity-80">Spoilage Index</p>
                  <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
                    {STAGE_META[selectedReading.stage].label}
                  </h2>
                  <p className="mt-2 text-sm opacity-80">
                    Worst matched stage across active sensors
                  </p>
                </div>
                <div className="shrink-0 rounded-lg bg-white/20 p-3">
                  {stageIcon(selectedReading.stage)}
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Samples"
              value={selectedItemSummary.sampleCount}
              detail={`${selectedItemSummary.firstDay} to ${selectedItemSummary.latestDay} days`}
            />
            <StatCard label="First Early Day" value={firstEarlyDay} />
            <StatCard label="First Spoiled Day" value={firstSpoiledDay} />
            <StatCard
              label="Fresh Days"
              value={selectedItemSummary.stageCounts.fresh}
              detail={`${selectedItemSummary.stageCounts.early} early, ${selectedItemSummary.stageCounts.spoiled} spoiled`}
            />
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))' }}
          >
            {activeSensors.map((sensor) => (
              <SensorCard
                key={sensor}
                category={selectedCategory}
                reading={selectedReading}
                sensor={sensor}
              />
            ))}
          </div>

          <section className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-white">Sensor Trends</h3>
                <p className="break-words text-sm text-zinc-500">
                  {selectedItemSummary.name} values by day from the CSV
                </p>
              </div>
              <BarChart3 className="h-5 w-5 shrink-0 text-emerald-300" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
              {activeSensors.map((sensor) => (
                <div key={sensor} className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-200">
                      {SENSOR_META[sensor].label}
                    </p>
                    <span className="text-xs text-zinc-500">{SENSOR_META[sensor].unit}</span>
                  </div>
                  <MiniBarChart
                    rows={selectedRows}
                    category={selectedCategory}
                    sensor={sensor}
                    selectedDay={effectiveDay}
                    onSelectDay={setSelectedDay}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold text-white">Recorded Values</h3>
                <p className="break-words text-sm text-zinc-500">
                  {CATEGORY_META[selectedCategory].tableTitle}
                </p>
              </div>
              <StageBadge stage={selectedReading.stage} />
            </div>
            <RecordedValuesTable
              rows={selectedRows}
              category={selectedCategory}
              selectedDay={effectiveDay}
            />
          </section>

          <section className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold text-white">Spoilage Index Reference</h3>
                <p className="break-words text-sm text-zinc-500">
                  {CATEGORY_META[selectedCategory].label}
                </p>
              </div>
              <StageBadge stage={selectedReading.stage} />
            </div>
            <SpoilageIndexTable category={selectedCategory} />
          </section>
        </section>
      </main>
    </div>
  );
}

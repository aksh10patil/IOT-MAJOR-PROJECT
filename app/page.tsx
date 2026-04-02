'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Atom,
  CheckCircle,
  Clock3,
  Database,
  Download,
  Droplets,
  FlaskConical,
  Play,
  RefreshCcw,
  Square,
  Thermometer,
  Waves,
  Wind,
  XCircle,
} from 'lucide-react';

import {
  buildHistory,
  EMPTY_SUMMARY,
  getLatestReading,
  getQuality,
  getSensorStatus,
  SENSOR_META,
  type Quality,
  type SensorDataPoint,
  type SensorKey,
  type SensorStatus,
  type SessionRecord,
  type SessionSummary,
} from '@/lib/iot-data';

interface SessionListResponse {
  sessions?: SessionRecord[];
  error?: string;
}

interface SessionMutationResponse {
  session?: SessionRecord;
  activeSession?: SessionRecord;
  error?: string;
}

interface SessionDataResponse {
  session?: SessionRecord;
  data?: SensorDataPoint[];
  summary?: SessionSummary;
  error?: string;
}

const SENSOR_CARD_ORDER: Array<{
  key: SensorKey;
  max: number;
  icon: React.ReactNode;
}> = [
  {
    key: 'temp',
    max: 40,
    icon: <Thermometer className="h-4 w-4" />,
  },
  {
    key: 'humidity',
    max: 100,
    icon: <Droplets className="h-4 w-4" />,
  },
  {
    key: 'ammonia',
    max: 40,
    icon: <Atom className="h-4 w-4" />,
  },
  {
    key: 'h2s',
    max: 15,
    icon: <FlaskConical className="h-4 w-4" />,
  },
  {
    key: 'turbidity',
    max: 120,
    icon: <Waves className="h-4 w-4" />,
  },
  {
    key: 'voc',
    max: 600,
    icon: <Wind className="h-4 w-4" />,
  },
  {
    key: 'alcohol',
    max: 120,
    icon: <FlaskConical className="h-4 w-4" />,
  },
];

const CHART_KEYS: SensorKey[] = ['temp', 'humidity', 'voc', 'ammonia'];

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatSessionRange = (session: SessionRecord) =>
  `${formatDateTime(session.start_time)} - ${
    session.end_time ? formatDateTime(session.end_time) : 'In progress'
  }`;

const getQualityMessage = (quality: Quality) => {
  if (quality === 'safe') {
    return 'Current sensor values are inside the configured safe range for the selected session.';
  }

  if (quality === 'warning') {
    return 'One or more sensor readings are elevated. Review the session trend and inspect the sample.';
  }

  if (quality === 'unsafe') {
    return 'Critical thresholds are being crossed. Treat this batch as high risk until reviewed.';
  }

  return 'Select a session or wait for new samples to arrive from ThingSpeak.';
};

const createExportFilename = (session: SessionRecord) => {
  const safeLabel = session.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const stamp = session.start_time.replace(/[:.]/g, '-');

  return `${safeLabel || 'session'}-${stamp}.json`;
};

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  status: SensorStatus;
  max: number;
}

const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  status,
  max,
}) => {
  const percent = Math.min(100, Math.max(0, (value / (max * 1.5)) * 100));

  let colorClass = 'text-emerald-500';
  let bgClass = 'bg-emerald-500';

  if (status === 'warning') {
    colorClass = 'text-amber-500';
    bgClass = 'bg-amber-500';
  } else if (status === 'danger') {
    colorClass = 'text-rose-500';
    bgClass = 'bg-rose-500';
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-lg transition-all duration-300 hover:border-slate-500">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          {icon}
          {title}
        </div>
        <div
          className={`rounded-full px-2 py-1 text-xs font-bold bg-opacity-20 ${colorClass} ${bgClass}`}
        >
          {status.toUpperCase()}
        </div>
      </div>

      <div className="my-2 flex items-end gap-1">
        <span className="text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        <span className="mb-1 text-sm text-slate-500">{unit}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bgClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

interface StatusBadgeProps {
  quality: Quality;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ quality }) => {
  let config = {
    color: 'bg-slate-700',
    icon: <Clock3 className="h-12 w-12 text-white" />,
    text: 'WAITING FOR DATA',
    desc: getQualityMessage('idle'),
  };

  if (quality === 'safe') {
    config = {
      color: 'bg-emerald-500',
      icon: <CheckCircle className="h-12 w-12 text-white" />,
      text: 'SAFE',
      desc: getQualityMessage('safe'),
    };
  } else if (quality === 'warning') {
    config = {
      color: 'bg-amber-500',
      icon: <AlertTriangle className="h-12 w-12 text-white" />,
      text: 'CAUTION',
      desc: getQualityMessage('warning'),
    };
  } else if (quality === 'unsafe') {
    config = {
      color: 'bg-rose-600',
      icon: <XCircle className="h-12 w-12 text-white" />,
      text: 'UNSAFE',
      desc: getQualityMessage('unsafe'),
    };
  }

  return (
    <div
      className={`${config.color} flex items-center justify-between rounded-2xl p-6 text-white shadow-xl transition-colors duration-500`}
    >
      <div>
        <h2 className="text-3xl font-bold tracking-wider">{config.text}</h2>
        <p className="mt-1 text-sm text-white/80">{config.desc}</p>
      </div>
      <div className="rounded-full bg-white/20 p-4">{config.icon}</div>
    </div>
  );
};

interface SimpleBarChartProps {
  data: number[];
  color?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  color = '#10b981',
}) => {
  if (data.length === 0) {
    return (
      <div className="mt-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/50 text-sm text-slate-500">
        No samples yet
      </div>
    );
  }

  const maxValue = Math.max(...data, 10) * 1.2;

  return (
    <div className="mt-4 flex h-32 items-end justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2">
      {data.map((value, index) => {
        const height = Math.min(100, (value / maxValue) * 100);

        return (
          <div
            key={`${value}-${index}`}
            className="group relative w-full rounded-t-sm transition-all duration-500 hover:brightness-125"
            style={{
              height: `${Math.max(4, height)}%`,
              backgroundColor: color,
              opacity: 0.82,
            }}
          >
            <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<SensorDataPoint[]>([]);
  const [summary, setSummary] = useState<SessionSummary>(EMPTY_SUMMARY);
  const [sessionLabel, setSessionLabel] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;
  const activeSession = sessions.find((session) => session.end_time === null) ?? null;
  const history = buildHistory(filteredData);
  const latestReading = getLatestReading(filteredData);
  const quality = selectedSession ? getQuality(latestReading) : 'idle';

  const loadSessions = useCallback(
    async (showSpinner = false, preferredSessionId?: string) => {
      if (showSpinner) {
        setSessionsLoading(true);
      }

      try {
        const response = await fetch('/api/session', {
          cache: 'no-store',
        });
        const payload = (await response.json()) as SessionListResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to load sessions.');
        }

        const nextSessions = payload.sessions ?? [];

        if (!isMountedRef.current) {
          return;
        }

        setSessions(nextSessions);
        setSelectedSessionId((currentSelectedSessionId) => {
          if (
            preferredSessionId &&
            nextSessions.some((session) => session.id === preferredSessionId)
          ) {
            return preferredSessionId;
          }

          if (
            currentSelectedSessionId &&
            nextSessions.some((session) => session.id === currentSelectedSessionId)
          ) {
            return currentSelectedSessionId;
          }

          const nextDefaultSession =
            nextSessions.find((session) => session.end_time === null) ??
            nextSessions[0];

          return nextDefaultSession?.id ?? null;
        });
        setError(null);
      } catch (loadError) {
        if (isMountedRef.current) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load sessions.'
          );
        }
      } finally {
        if (showSpinner && isMountedRef.current) {
          setSessionsLoading(false);
        }
      }
    },
    []
  );

  const loadSessionData = useCallback(async (sessionId: string, showSpinner = false) => {
    if (showSpinner) {
      setDataLoading(true);
    }

    try {
      const response = await fetch(`/api/data?sessionId=${sessionId}`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as SessionDataResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load session data.');
      }

      if (!isMountedRef.current) {
        return;
      }

      const nextData = payload.data ?? [];
      setFilteredData(nextData);
      setSummary(payload.summary ?? EMPTY_SUMMARY);
      setLastUpdated(nextData[nextData.length - 1]?.timestamp ?? null);
      setError(null);
    } catch (loadError) {
      if (isMountedRef.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load session data.'
        );
        setFilteredData([]);
        setSummary(EMPTY_SUMMARY);
        setLastUpdated(null);
      }
    } finally {
      if (showSpinner && isMountedRef.current) {
        setDataLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadSessions(true);

    const intervalId = window.setInterval(() => {
      void loadSessions();
    }, 10000);

    return () => {
      isMountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [loadSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setFilteredData([]);
      setSummary(EMPTY_SUMMARY);
      setLastUpdated(null);
      return;
    }

    void loadSessionData(selectedSessionId, true);

    const intervalId = window.setInterval(() => {
      void loadSessionData(selectedSessionId);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedSessionId, loadSessionData]);

  const handleStartSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedLabel = sessionLabel.trim();

    if (!trimmedLabel) {
      setError('Enter a label before starting a session.');
      return;
    }

    setIsMutating(true);

    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: trimmedLabel }),
      });
      const payload = (await response.json()) as SessionMutationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to start session.');
      }

      if (!payload.session) {
        throw new Error('The session was created but no session payload was returned.');
      }

      setSessionLabel('');
      await loadSessions(true, payload.session.id);
      setError(null);
    } catch (mutationError) {
      if (isMountedRef.current) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Unable to start session.'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsMutating(false);
      }
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) {
      setError('There is no active session to end.');
      return;
    }

    setIsMutating(true);

    try {
      const response = await fetch('/api/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });
      const payload = (await response.json()) as SessionMutationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to end session.');
      }

      await loadSessions(true, payload.session?.id ?? activeSession.id);
      setError(null);
    } catch (mutationError) {
      if (isMountedRef.current) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Unable to end session.'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsMutating(false);
      }
    }
  };

  const handleRefresh = async () => {
    await loadSessions(true, selectedSessionId ?? undefined);

    if (selectedSessionId) {
      await loadSessionData(selectedSessionId, true);
    }
  };

  const handleExport = () => {
    if (!selectedSession || filteredData.length === 0) {
      return;
    }

    const blob = new Blob(
      [
        JSON.stringify(
          {
            session: selectedSession,
            summary,
            data: filteredData,
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
    link.download = createExportFilename(selectedSession);
    link.click();
    URL.revokeObjectURL(url);
  };

  const lastUpdatedLabel = lastUpdated
    ? formatDateTime(lastUpdated)
    : 'No session samples yet';

  return (
    <div className="min-h-screen bg-slate-950 pb-12 text-slate-200 selection:bg-emerald-500 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500 p-2">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BioSense IoT</h1>
              <p className="text-xs text-slate-400">
                Session-based food monitoring on ThingSpeak + Neon
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="text-left md:text-right">
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400 uppercase">
                ThingSpeak Channel 3194508
              </p>
              <p className="text-xs text-slate-400">Polling every 10 seconds</p>
              <p className="text-xs text-slate-500">
                Latest sample in selected session: {lastUpdatedLabel}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                disabled={sessionsLoading || dataLoading || isMutating}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-600 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-5 w-5 ${
                    sessionsLoading || dataLoading ? 'animate-spin' : ''
                  }`}
                />
                Refresh Data
              </button>

              <button
                onClick={handleExport}
                disabled={!selectedSession || filteredData.length === 0}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 grid max-w-7xl gap-6 px-4 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Session Controls</h2>
            </div>

            <form onSubmit={handleStartSession} className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Session Label
              </label>
              <input
                value={sessionLabel}
                onChange={(event) => setSessionLabel(event.target.value)}
                placeholder="banana, milk, meat..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={isMutating || Boolean(activeSession)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                Start Session
              </button>
            </form>

            <button
              onClick={handleEndSession}
              disabled={isMutating || !activeSession}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Square className="h-4 w-4" />
              End Session
            </button>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
              <p className="font-medium text-white">
                {activeSession ? `Active: ${activeSession.label}` : 'No active session'}
              </p>
              <p className="mt-1">
                {activeSession
                  ? `Started ${formatDateTime(activeSession.start_time)}`
                  : 'Start a session to tag incoming sensor data with a time window.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Sessions</h2>
                <p className="text-xs text-slate-400">
                  Select a time range to filter the dashboard
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                {sessions.length}
              </span>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => {
                const isSelected = selectedSessionId === session.id;
                const isActive = session.end_time === null;

                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-slate-800 shadow-lg shadow-emerald-900/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white capitalize">
                          {session.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {formatSessionRange(session)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {sessions.length === 0 && !sessionsLoading ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-500">
                  No sessions recorded yet. Start one to tag a new dataset.
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.2em] text-emerald-400 uppercase">
                    Selected Session
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-white capitalize">
                    {selectedSession?.label ?? 'Choose a session'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    {selectedSession
                      ? formatSessionRange(selectedSession)
                      : 'The dashboard now reads from session windows instead of food tabs. Pick a session to load filtered ThingSpeak data.'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
                  <p className="font-medium text-white">{summary.totalSamples} samples</p>
                  <p className="mt-1">
                    {selectedSession?.end_time ? 'Closed session' : 'Live session window'}
                  </p>
                </div>
              </div>
            </div>

            <StatusBadge quality={quality} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Average Temperature</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.avgTemp}
                <span className="ml-1 text-base text-slate-500">deg C</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Average Humidity</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.avgHumidity}
                <span className="ml-1 text-base text-slate-500">%</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Max Ammonia</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.maxAmmonia}
                <span className="ml-1 text-base text-slate-500">ppm</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Max Turbidity</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {summary.maxTurbidity}
                <span className="ml-1 text-base text-slate-500">NTU</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SENSOR_CARD_ORDER.map(({ key, max, icon }) => {
              const meta = SENSOR_META[key];

              return (
                <SensorCard
                  key={key}
                  title={meta.label}
                  value={latestReading[key]}
                  unit={meta.unit}
                  icon={icon}
                  max={max}
                  status={getSensorStatus(key, latestReading[key])}
                />
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Session Trends</h3>
                <p className="text-sm text-slate-400">
                  Last {Math.max(...CHART_KEYS.map((key) => history[key].length), 0)} samples from the selected session
                </p>
              </div>
              {(sessionsLoading || dataLoading) && selectedSession ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Updating
                </div>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {CHART_KEYS.map((sensorKey) => {
                const meta = SENSOR_META[sensorKey];

                return (
                  <div key={sensorKey}>
                    <p className="text-sm text-slate-400">{meta.label}</p>
                    <SimpleBarChart data={history[sensorKey]} color={meta.color} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white">Session Insight</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {selectedSession
                ? getQualityMessage(quality)
                : 'Start a session, let ThingSpeak collect data, then select that session to analyze its time window.'}
            </p>

            {selectedSession && filteredData.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-500">
                No ThingSpeak samples fell inside this session window yet. Keep the
                session running a little longer or choose a session with recorded
                data.
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

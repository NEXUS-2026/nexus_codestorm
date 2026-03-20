import { useEffect, useState, useMemo } from 'react'
import { getSessions, getOperatorStats } from '../api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import {
  RefreshCw, Box, Trophy, User, Clock, TrendingUp,
  Camera, Upload, AlertCircle, Package, Zap
} from 'lucide-react'

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function OperatorStats() {
  const [sessions, setSessions] = useState([])
  const [opStats, setOpStats]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [err, setErr]           = useState(false)
  const [activeOp, setActiveOp] = useState(null)

  const load = () => {
    setLoading(true); setErr(false)
    Promise.all([getSessions(), getOperatorStats()])
      .then(([s, o]) => { setSessions(s.data); setOpStats(o.data) })
      .catch(() => setErr(true))
      .finally(() => setLoading(false))
  }
  const [countdown, setCountdown] = useState(300)

  useEffect(() => { load() }, [])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    setCountdown(300)
    const tick = setInterval(() => setCountdown(c => c <= 1 ? 300 : c - 1), 1000)
    return () => clearInterval(tick)
  }, [sessions]) // resets when data refreshes

  const completed = useMemo(() => sessions.filter(s => s.status === 'completed'), [sessions])

  const kpis = useMemo(() => {
    const totalBoxes = completed.reduce((s, x) => s + (x.final_count || 0), 0)
    const best = completed.reduce((b, x) => (x.final_count || 0) > (b?.final_count || 0) ? x : b, null)
    const topOp = opStats[0]
    const durations = completed.filter(s => s.started_at && s.ended_at)
      .map(s => (new Date(s.ended_at) - new Date(s.started_at)) / 1000)
    const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null
    const avgDurStr = avgDur ? (avgDur < 60 ? `${avgDur}s` : `${Math.floor(avgDur / 60)}m ${avgDur % 60}s`) : '—'
    return { totalBoxes, best, topOp, avgDurStr }
  }, [completed, opStats])

  const timelineData = useMemo(() =>
    [...completed]
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
      .slice(-15).map((s, i) => ({ name: `#${i + 1}`, boxes: s.final_count || 0 }))
  , [completed])

  const hourData = useMemo(() => {
    const now = new Date()
    // Build 24 slots: from 23 hours ago up to current hour
    return Array.from({ length: 24 }, (_, i) => {
      const slotTime = new Date(now)
      slotTime.setHours(now.getHours() - (23 - i), 0, 0, 0)
      const slotEnd = new Date(slotTime)
      slotEnd.setHours(slotTime.getHours() + 1)

      const count = sessions.filter(s => {
        if (!s.started_at) return false
        const t = new Date(s.started_at)
        return t >= slotTime && t < slotEnd
      }).length

      const h = slotTime.getHours()
      return {
        hour: `${h.toString().padStart(2, '0')}:00`,
        sessions: count,
        isCurrent: i === 23,
      }
    })
  }, [sessions])

  const sourceSplit = useMemo(() => {
    const live   = sessions.filter(s => s.source_type === 'live').length
    const upload = sessions.filter(s => s.source_type === 'upload').length
    return { live, upload, total: sessions.length }
  }, [sessions])

  const topBatches = useMemo(() => {
    const map = {}
    completed.forEach(s => {
      if (!map[s.batch_id]) map[s.batch_id] = { id: s.batch_id, total: 0, sessions: 0 }
      map[s.batch_id].total += s.final_count || 0
      map[s.batch_id].sessions++
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [completed])

  const maxOp    = opStats[0]?.total_boxes || 1
  const maxBatch = topBatches[0]?.total || 1
  const maxHour  = Math.max(...hourData.map(h => h.sessions), 1)

  const opTimeline = useMemo(() => {
    if (!activeOp) return []
    return [...completed]
      .filter(s => s.operator_id === activeOp)
      .sort((a, b) => new Date(a.started_at) - new Date(b.started_at))
      .map((s, i) => ({ name: `#${i + 1}`, boxes: s.final_count || 0 }))
  }, [activeOp, completed])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 gap-2 text-gray-600 text-sm">
      <span className="w-4 h-4 border-2 border-gray-700 border-t-sky-500 rounded-full animate-spin" />
      Loading analytics...
    </div>
  )

  if (err) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 gap-3">
      <div className="w-12 h-12 bg-red-950 border border-red-800 rounded-2xl flex items-center justify-center">
        <AlertCircle size={20} className="text-red-400" />
      </div>
      <p className="text-sm text-gray-400">Backend not reachable</p>
      <button onClick={load} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg border border-gray-700 transition-colors">Retry</button>
    </div>
  )

  return (
    <main className="flex-1 p-5 max-w-6xl mx-auto w-full flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Analytics</h1>
          <p className="text-xs text-gray-500">{sessions.length} sessions · {completed.length} completed</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={11} /> Refresh · {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Box,      label: 'Total Boxes',   value: kpis.totalBoxes,              sub: 'all time',              color: '#38bdf8', bg: 'bg-sky-950',    border: 'border-sky-900' },
          { icon: Trophy,   label: 'Best Session',  value: kpis.best?.final_count ?? '—', sub: kpis.best?.batch_id ?? 'no data', color: '#fbbf24', bg: 'bg-amber-950',  border: 'border-amber-900' },
          { icon: User,     label: 'Top Operator',  value: kpis.topOp?._id ?? '—',       sub: kpis.topOp ? `${kpis.topOp.total_boxes} boxes` : 'no data', color: '#a78bfa', bg: 'bg-purple-950', border: 'border-purple-900' },
          { icon: Clock,    label: 'Avg Duration',  value: kpis.avgDurStr,               sub: 'per session',           color: '#34d399', bg: 'bg-green-950',  border: 'border-green-900' },
        ].map(({ icon: Icon, label, value, sub, color, bg, border }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:border-gray-700 transition-colors">
            <div className={`w-9 h-9 shrink-0 ${bg} border ${border} rounded-xl flex items-center justify-center`}>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black tabular-nums truncate leading-none" style={{ color }}>{value}</p>
              <p className="text-xs font-semibold text-white mt-0.5 leading-none">{label}</p>
              <p className="text-xs text-gray-600 mt-0.5 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Trend + Source ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Area chart */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white leading-none">Throughput Trend</p>
              <p className="text-xs text-gray-500 mt-0.5">Boxes per session · last 15</p>
            </div>
            <TrendingUp size={14} className="text-sky-400" />
          </div>
          {timelineData.length === 0
            ? <div className="flex items-center justify-center h-32 text-gray-700 text-xs">No completed sessions yet</div>
            : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={timelineData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="boxes" name="Boxes"
                    stroke="#38bdf8" strokeWidth={2} fill="url(#grad)"
                    dot={{ fill: '#38bdf8', r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: '#38bdf8' }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Source split */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white leading-none">Source Split</p>
            <Zap size={13} className="text-gray-600" />
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {[
              { label: 'Live Camera',    count: sourceSplit.live,   icon: Camera, color: '#38bdf8', track: 'bg-sky-500' },
              { label: 'Uploaded Video', count: sourceSplit.upload, icon: Upload, color: '#a78bfa', track: 'bg-purple-500' },
            ].map(({ label, count, icon: Icon, color, track }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon size={11} style={{ color }} />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                  <span className="text-sm font-black tabular-nums" style={{ color }}>{count}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${track}`}
                    style={{ width: sourceSplit.total ? `${(count / sourceSplit.total) * 100}%` : '0%' }} />
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  {sourceSplit.total ? Math.round((count / sourceSplit.total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-600">{sourceSplit.total} total sessions</p>
          </div>
        </div>
      </div>

      {/* ── Row 3: Leaderboard + Hour chart ── */}
      <div className="grid grid-cols-2 gap-3 items-stretch">

        {/* Operator leaderboard */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white leading-none">Operator Leaderboard</p>
              <p className="text-xs text-gray-500 mt-0.5">Tap to drill down</p>
            </div>
            <Trophy size={13} className="text-amber-400" />
          </div>

          {opStats.length === 0
            ? <p className="text-xs text-gray-600 py-6 text-center">No data yet</p>
            : (
              <div className="flex flex-col gap-1.5">
                {opStats.slice(0, 5).map((op, i) => (
                  <button key={op._id}
                    onClick={() => setActiveOp(activeOp === op._id ? null : op._id)}
                    className={`w-full text-left rounded-xl px-3 py-2 transition-all border ${
                      activeOp === op._id ? 'bg-sky-950 border-sky-800' : 'bg-gray-800/40 border-transparent hover:border-gray-700'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black w-4 shrink-0 tabular-nums ${i === 0 ? 'text-amber-400' : 'text-gray-600'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white truncate">{op._id}</span>
                          <span className="text-xs font-black text-sky-400 tabular-nums ml-2 shrink-0">{op.total_boxes}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-0.5 mt-1.5">
                          <div className={`h-0.5 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-sky-500'}`}
                            style={{ width: `${((op.total_boxes || 0) / maxOp) * 100}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{op.total_sessions} sessions · {op.avg_count?.toFixed(1)} avg</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          }

          {activeOp && opTimeline.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-400 mb-2">{activeOp}</p>
              <ResponsiveContainer width="100%" height={70}>
                <BarChart data={opTimeline} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                  <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="boxes" name="Boxes" fill="#38bdf8" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Hour distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col min-h-[260px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white leading-none">Activity — Last 24 Hours</p>
              <p className="text-xs text-gray-500 mt-0.5">Sessions started per hour</p>
            </div>
            <Clock size={13} className="text-gray-600" />
          </div>
          {hourData.every(d => d.sessions === 0)
            ? <div className="flex-1 flex items-center justify-center text-gray-700 text-xs">No sessions in the last 24 hours</div>
            : (
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fill: '#4b5563', fontSize: 9 }} interval={3} />
                    <YAxis tick={{ fill: '#4b5563', fontSize: 9 }} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="sessions" name="Sessions" radius={[3, 3, 0, 0]}>
                      {hourData.map((d, i) => (
                        <Cell key={i} fill={
                          d.isCurrent ? '#38bdf8' :
                          d.sessions === maxHour && d.sessions > 0 ? '#fbbf24' : '#1e3a5f'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>
      </div>

      {/* ── Top batches ── */}
      {topBatches.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-white leading-none">Top Batches</p>
              <p className="text-xs text-gray-500 mt-0.5">Highest box counts by batch ID</p>
            </div>
            <Package size={13} className="text-gray-600" />
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${topBatches.length}, minmax(0, 1fr))` }}>
            {topBatches.map((b, i) => (
              <div key={b.id}
                className={`rounded-xl p-3 border flex flex-col items-center text-center gap-1 ${
                  i === 0 ? 'bg-amber-950/60 border-amber-800' : 'bg-gray-800/50 border-gray-700'
                }`}>
                <span className={`text-xs font-bold ${i === 0 ? 'text-amber-400' : 'text-gray-600'}`}>#{i + 1}</span>
                <span className="text-xs font-semibold text-white truncate w-full">{b.id}</span>
                <span className={`text-2xl font-black tabular-nums leading-none ${i === 0 ? 'text-amber-400' : 'text-sky-400'}`}>{b.total}</span>
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div className={`h-1 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-sky-600'}`}
                    style={{ width: `${(b.total / maxBatch) * 100}%` }} />
                </div>
                <span className="text-xs text-gray-600">{b.sessions} session{b.sessions !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  )
}

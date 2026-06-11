'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import type { Prospect } from '@/lib/types'

const STAGE_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  new_lead:       { label: 'New Lead',      color: '#a78bfa', order: 0 },
  in_conversation:{ label: 'In Convo',      color: '#818cf8', order: 1 },
  negotiating:    { label: 'Negotiating',   color: '#6366f1', order: 2 },
  verbal_commit:  { label: 'Verbal Commit', color: '#4f46e5', order: 3 },
  closed_won:     { label: 'Won',           color: '#22c55e', order: 4 },
  closed_lost:    { label: 'Lost',          color: '#f87171', order: 5 },
  on_hold:        { label: 'On Hold',       color: '#d1d5db', order: 6 },
}

export default function AdminDashboard({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) return null

  // ── KPI calculations ──────────────────────────────────────────────────────
  const totalPipeline = prospects.reduce((s, p) => s + p.annual_savings, 0)
  const avgSavings = totalPipeline / prospects.length
  const openedCount = prospects.filter(p => p.view_count > 0).length
  const openedPct = Math.round((openedCount / prospects.length) * 100)

  const now = new Date()
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const expiringSoon = prospects.filter(p => {
    const d = new Date(p.expiry_date)
    return d >= now && d <= in14 && p.status === 'active'
  }).length

  const wonSavings = prospects
    .filter(p => p.lead_stage === 'closed_won')
    .reduce((s, p) => s + p.annual_savings, 0)

  // ── Funnel data ───────────────────────────────────────────────────────────
  const stageCounts = prospects.reduce<Record<string, number>>((acc, p) => {
    const stage = p.lead_stage ?? 'new_lead'
    acc[stage] = (acc[stage] ?? 0) + 1
    return acc
  }, {})

  const funnelData = Object.entries(STAGE_CONFIG)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, cfg]) => ({
      label: cfg.label,
      color: cfg.color,
      count: stageCounts[key] ?? 0,
    }))
    .filter(d => d.count > 0)

  // ── Opened donut ──────────────────────────────────────────────────────────
  const donutData = [
    { name: 'Opened', value: openedCount, color: '#6366f1' },
    { name: 'Unopened', value: prospects.length - openedCount, color: '#e5e7eb' },
  ]

  // ── Top prospects bar ──────────────────────────────────────────────────────
  const topProspects = [...prospects]
    .sort((a, b) => b.annual_savings - a.annual_savings)
    .slice(0, 10)
    .map(p => ({
      name: p.company_name.length > 14 ? p.company_name.slice(0, 13) + '…' : p.company_name,
      savings: Math.round(p.annual_savings),
      won: p.lead_stage === 'closed_won',
    }))

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KpiCard label="Total Quotes" value={prospects.length.toString()} />
        <KpiCard
          label="Pipeline"
          value={`$${Math.round(totalPipeline).toLocaleString('en-US')}`}
          sub="annual savings"
        />
        <KpiCard
          label="Avg Savings"
          value={`$${Math.round(avgSavings).toLocaleString('en-US')}`}
          sub="per quote"
        />
        <KpiCard
          label="Won"
          value={wonSavings > 0 ? `$${Math.round(wonSavings).toLocaleString('en-US')}` : '—'}
          sub="closed savings"
          highlight={wonSavings > 0}
        />
        <KpiCard
          label="Expiring Soon"
          value={expiringSoon.toString()}
          sub="within 14 days"
          warn={expiringSoon > 0}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Pipeline Funnel
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={96}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${v} quote${v !== 1 ? 's' : ''}`, '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Opened donut */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Open Rate
          </p>
          <div className="relative">
            <PieChart width={140} height={140}>
              <Pie
                data={donutData}
                cx={65}
                cy={65}
                innerRadius={44}
                outerRadius={60}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-brand-900">{openedPct}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {openedCount} of {prospects.length} opened
          </p>
        </div>
      </div>

      {/* Top prospects savings bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Annual Savings by Quote {topProspects.length < prospects.length ? `(top ${topProspects.length})` : ''}
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={topProspects} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(v) => [`$${Number(v).toLocaleString('en-US')}`, 'Annual Savings']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="savings" radius={[4, 4, 0, 0]} barSize={28}>
              {topProspects.map((entry, i) => (
                <Cell key={i} fill={entry.won ? '#22c55e' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          <Legend color="#6366f1" label="Active" />
          <Legend color="#22c55e" label="Won" />
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
  warn,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold leading-tight ${highlight ? 'text-green-600' : warn ? 'text-amber-500' : 'text-brand-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

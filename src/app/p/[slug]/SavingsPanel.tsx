'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import type { Prospect } from '@/lib/types'

function fireConfetti() {
  const colors = ['#4e7f7b', '#f5a8b8', '#bba4e3', '#fcd87a', '#a8d5b5', '#ffffff']
  for (let i = 0; i < 120; i++) {
    const el = document.createElement('div')
    const color = colors[Math.floor(Math.random() * colors.length)]
    const startX = window.innerWidth * 0.72 + (Math.random() - 0.5) * 260
    const startY = window.innerHeight * 0.45
    const drift = (Math.random() - 0.5) * 420
    const rise = 260 + Math.random() * 340
    const duration = 1200 + Math.random() * 900
    const size = 5 + Math.random() * 8

    Object.assign(el.style, {
      position: 'fixed',
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: Math.random() > 0.4 ? '50%' : '2px',
      backgroundColor: color,
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: '1',
      transition: `transform ${duration}ms cubic-bezier(.2,.8,.4,1), opacity ${duration}ms ease-out`,
      transform: 'translate(0,0) rotate(0deg)',
    })
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = `translate(${drift}px,-${rise}px) rotate(${Math.random() * 720 - 360}deg)`
        el.style.opacity = '0'
      })
    })
    setTimeout(() => el.remove(), duration + 100)
  }
}

const BOUNCE_STYLE = `
@keyframes savings-pop {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.16); }
  65%  { transform: scale(0.97); }
  100% { transform: scale(1); }
}
.savings-bounce { animation: savings-pop 480ms cubic-bezier(.36,.07,.19,.97) forwards; }
`

export default function SavingsPanel({ prospect }: { prospect: Prospect }) {
  const [feeSaver, setFeeSaver] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const MAX_H = 180
  const current = prospect.current_monthly_cost

  // Fee Saver math: credit card fees passed to customer; only debit cost remains.
  // Sum Helcim cost for all debit rows across all networks.
  const debitCost = Object.values(prospect.interchange_data ?? {}).flatMap(
    (n: unknown) => ((n as { rows?: { card_type: string; cost: number }[] })?.rows ?? [])
      .filter(r => /debit/i.test(r.card_type))
      .map(r => r.cost)
  ).reduce((s, c) => s + c, 0)

  const feeSaverMonthlyCost = debitCost
  const feeSaverMonthlySavings = current - feeSaverMonthlyCost
  const feeSaverAnnualSavings = feeSaverMonthlySavings * 12

  // Active display values — switch on toggle
  const displayNewCost    = feeSaver ? feeSaverMonthlyCost    : prospect.new_monthly_cost
  const displaySavings    = feeSaver ? feeSaverMonthlySavings : prospect.monthly_savings
  const displayAnnual     = feeSaver ? feeSaverAnnualSavings  : prospect.annual_savings
  const displayNewRate    = feeSaver ? 0                      : prospect.new_effective_rate
  const displayMonthlySav = feeSaver ? feeSaverMonthlySavings : prospect.monthly_savings

  const savingsPct = Math.round((displaySavings / current) * 100)
  const newCostH   = Math.max(32, Math.round((displayNewCost / current) * MAX_H))
  const savingsH   = MAX_H - newCostH

  function handleToggle() {
    const next = !feeSaver
    setFeeSaver(next)
    setBouncing(true)
    setTimeout(() => setBouncing(false), 500)
    if (next) fireConfetti()
  }

  return (
    <div
      className="sticky top-[65px] rounded-2xl overflow-hidden shadow-2xl text-white"
      style={{ background: 'linear-gradient(160deg, #3b1fa8 0%, #5b21b6 45%, #4c1d95 100%)' }}
    >
      <style>{BOUNCE_STYLE}</style>

      {/* Annual savings hero */}
      <div className="px-6 pt-7 pb-5 text-center">
        <p className="text-xs font-semibold text-white uppercase tracking-widest mb-2">
          Estimated Annual Savings
        </p>
        <p
          key={feeSaver ? 'on' : 'off'}
          className={`text-5xl font-extrabold tracking-tight ${bouncing ? 'savings-bounce' : ''}`}
          style={{ color: '#86efac', display: 'inline-block' }}
        >
          ${fmt(displayAnnual)}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(134,239,172,0.15)', color: '#86efac' }}>
          {savingsPct}% cost reduction
        </div>
      </div>

      <div className="mx-5 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)' }} />

      {/* Bar chart */}
      <div className="px-6 py-6">
        {/* Labels above bars */}
        <div className="flex justify-center gap-6 mb-3">
          <span className="w-24 text-center text-xs font-semibold text-white leading-tight">
            {prospect.current_provider}
          </span>
          <span className="w-24 text-center text-xs font-semibold text-white">Gradient</span>
        </div>

        <div className="flex items-end justify-center gap-6">
          {/* Current cost bar — solid white, static */}
          <div
            className="relative w-24 rounded-2xl overflow-hidden flex flex-col items-center justify-end pb-4"
            style={{ height: MAX_H, background: 'rgba(255,255,255,0.95)' }}
          >
            <span className="text-sm font-bold text-gray-800 text-center">${Math.round(current).toLocaleString()}</span>
            <span className="text-xs text-gray-500 mt-0.5 text-center">Monthly cost</span>
          </div>

          {/* Gradient stacked bar — animates on toggle */}
          <div className="w-24 flex flex-col rounded-2xl overflow-hidden" style={{ height: MAX_H }}>
            {/* Savings portion — light green top */}
            <div
              className="flex flex-col items-center justify-center gap-0.5 text-center px-1"
              style={{
                height: savingsH,
                background: 'linear-gradient(to bottom, #86efac, #4ade80)',
                flexShrink: 0,
                transition: 'height 500ms cubic-bezier(.4,0,.2,1)',
              }}
            >
              {savingsH > 44 && (
                <>
                  <span className="text-sm font-bold text-gray-800">${Math.round(displaySavings).toLocaleString()}</span>
                  <span className="text-xs text-gray-700 font-medium">Monthly savings</span>
                </>
              )}
            </div>
            {/* New cost portion — dark green bottom */}
            <div
              className="flex flex-col items-center justify-end pb-4 text-center px-1"
              style={{
                height: newCostH,
                background: 'linear-gradient(to top, #064e3b, #065f46)',
                flexShrink: 0,
                transition: 'height 500ms cubic-bezier(.4,0,.2,1)',
              }}
            >
              <span className="text-sm font-bold text-white">${Math.round(displayNewCost).toLocaleString()}</span>
              <span className="text-xs text-white/80 mt-0.5">New cost</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* Effective rates */}
      <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-5 text-center">
          <p className="text-xs text-white font-medium mb-1.5">Current Effective Rate</p>
          <p className="text-2xl font-bold text-white">
            {prospect.current_effective_rate}%
          </p>
        </div>
        <div className="px-5 py-5 text-center">
          <p className="text-xs text-white font-medium mb-1.5">New Effective Rate</p>
          <p className="text-2xl font-bold text-white" style={{ transition: 'all 300ms ease' }}>
            {displayNewRate}%
          </p>
        </div>
      </div>

      <div className="mx-5 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* Fee Saver toggle */}
      <div className="px-6 py-5">
        <button onClick={handleToggle} className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: feeSaver ? 'rgba(252,216,122,0.2)' : 'rgba(255,255,255,0.07)' }}
            >
              <Zap size={15} style={{ color: feeSaver ? '#fcd87a' : 'rgba(255,255,255,0.4)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Switch to $0 Processing
              </p>
              <p className="text-xs text-white/70">Gradient Fee Saver surcharging</p>
            </div>
          </div>
          {/* Toggle */}
          <div
            className="relative w-11 h-6 rounded-full shrink-0 transition-all duration-200"
            style={{ background: feeSaver ? 'linear-gradient(to right, #4e7f7b, #9b79d4)' : 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200"
              style={{ transform: feeSaver ? 'translateX(21px)' : 'translateX(4px)' }}
            />
          </div>
        </button>

        {feeSaver && (
          <p className="text-xs text-white/70 mt-3 leading-relaxed pl-11">
            Qualifying credit card fees are passed to the customer. Your net processing cost
            can be <span className="text-white/70 font-semibold">$0/month</span>. Debit transactions retain a small flat fee.
          </p>
        )}
      </div>
    </div>
  )
}

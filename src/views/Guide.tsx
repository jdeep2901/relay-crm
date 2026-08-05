import { useState } from 'react'
import {
  Home, Kanban, CalendarClock, Inbox, Flame, Building2, Waypoints, Settings2,
  Check, Pencil, X, User, Sparkles, Link2, Mic,
} from 'lucide-react'
import { Card, Pill } from '../components/ui'

const BASE = import.meta.env.BASE_URL

type Section = {
  key: string; label: string; icon: typeof Home; shot?: string
  what: string; how: { t: string; d: string }[]
}

const SECTIONS: Section[] = [
  {
    key: 'today', label: 'Today', icon: Home, shot: 'today.png',
    what: 'Your morning pass. What is happening this week and what is waiting on you.',
    how: [
      { t: 'Meetings this week', d: 'Every upcoming call, with a green flag when Relay has already prepared a brief for it.' },
      { t: 'Waiting in Capture', d: 'Calls that have been tagged and need a human to confirm. Click through to review them.' },
    ],
  },
  {
    key: 'priority', label: 'Priority', icon: Flame,
    what: 'Where to spend attention, ranked on what clients actually said — not on stage.',
    how: [
      { t: 'The score', d: 'Money evidence, need clarity, commitment, sponsor access and momentum, out of 100. Red chips are risks pulling it down.' },
      { t: 'Why stage is excluded', d: 'A well-qualified early deal can matter more than a quiet late one. Propensity is shown separately on the right.' },
      { t: 'Filters', d: 'Narrow by industry and by stage to work your own slice.' },
    ],
  },
  {
    key: 'pipeline', label: 'Pipeline', icon: Kanban, shot: 'pipeline.png',
    what: 'Every live deal, grouped by industry with seller as a filter.',
    how: [
      { t: 'Open a deal', d: 'Click any row for the full record: fields, call history and propensity maths.' },
    ],
  },
  {
    key: 'precall', label: 'Pre-call', icon: CalendarClock, shot: 'precall.png',
    what: 'Research and discovery questions prepared for every upcoming meeting.',
    how: [
      { t: 'The way in', d: 'The recommended angle for the conversation, based on what is happening at the company.' },
      { t: 'Smart questions', d: 'Non-pitchy questions designed to get the prospect talking about their priorities.' },
      { t: 'Watch-outs', d: 'Things not to say, and facts to verify before you quote them.' },
    ],
  },
  {
    key: 'capture', label: 'Capture', icon: Inbox, shot: 'capture.png',
    what: 'Every call, already tagged. This is where your review work happens.',
    how: [
      { t: 'Accept, edit or dismiss', d: 'Each field has a tick to accept, a pencil to correct the value, and an ✕ to dismiss. Everything saves immediately.' },
      { t: 'Who said it', d: 'A green “client” chip means the client said it. An amber “MathCo said this” chip means we said it and they never confirmed — those need your judgement.' },
      { t: 'Needs confirming', d: 'One click isolates just the fields we asserted or could not attribute.' },
      { t: 'Your fields only', d: 'Filter to Solutioning, Sales or JD + Sahana to see only what you own.' },
      { t: 'Wrong deal?', d: 'Use “Change deal” to move a single call to the right deal — useful when one account has several workstreams.' },
    ],
  },
  {
    key: 'deal', label: 'Deal page', icon: Building2, shot: 'deal.png',
    what: 'One record per deal: the fields Relay maintains, the call thread and the propensity maths.',
    how: [
      { t: 'Every field cites its source', d: 'Click the provenance chip to see the sentence from the call that produced it.' },
      { t: 'Propensity', d: 'Stage baseline from historical conversion, adjusted by budget identified and specific area need.' },
      { t: 'Calls', d: 'The full thread for this deal in order, so you can see how the conversation developed.' },
    ],
  },
  {
    key: 'warm', label: 'Warm paths', icon: Waypoints,
    what: 'Who inside MathCo can make a warm introduction into an account.',
    how: [{ t: 'Use before cold outreach', d: 'A referral path converts far better than a cold approach.' }],
  },
  {
    key: 'admin', label: 'Admin', icon: Settings2,
    what: 'Run the pipeline on demand and manage users. Owner only for user management.',
    how: [
      { t: 'Pull transcripts', d: 'Fetches new calls from GoodMeetings. Also runs automatically every day.' },
      { t: 'Sync deals from Monday', d: 'Refreshes the deal list so new Monday deals appear in the linkage dropdown.' },
      { t: 'Recompute propensity', d: 'Re-applies the scoring after criteria have been confirmed.' },
    ],
  },
]

export function Guide() {
  const [open, setOpen] = useState<string>('capture')

  return (
    <div>
      <h1 className="text-[20px] mb-1">User guide</h1>
      <p className="text-[13px] text-secondary mb-5">
        Relay tags every client call automatically. Your job is to confirm what it found — not to type it in.
      </p>

      {/* the one-minute version */}
      <Card className="p-4 mb-5" >
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-[13px] font-medium">The whole thing in one minute</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: '1', t: 'Calls arrive on their own', d: 'GoodMeetings transcripts are pulled daily and tagged against the CRM fields.' },
            { n: '2', t: 'You review, not type', d: 'Open Capture, filter to your fields, and accept or correct what Relay found.' },
            { n: '3', t: 'Deals stay current', d: 'Accepted fields flow onto the deal with the quote that proves them.' },
            { n: '4', t: 'Priority tells you where to go', d: 'Ranked on what clients said, so effort goes where it moves the needle.' },
          ].map((s) => (
            <div key={s.n} className="bg-surface rounded-lg p-3">
              <div className="num text-[16px] font-medium text-accent">{s.n}</div>
              <div className="text-[12.5px] font-medium mt-0.5">{s.t}</div>
              <div className="text-[11.5px] text-secondary mt-1 leading-snug">{s.d}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* the review controls — the bit people get wrong */}
      <Card className="p-4 mb-5">
        <div className="text-[13px] font-medium mb-2.5">The review controls</div>
        <div className="flex flex-col gap-2">
          {[
            { i: Check, c: 'var(--status-green)', t: 'Accept', d: 'Confirms the value. It flows onto the deal record.' },
            { i: Pencil, c: 'var(--text-secondary)', t: 'Edit', d: 'Correct the value, then save — it accepts at the same time. The original quote is kept.' },
            { i: X, c: 'var(--status-red)', t: 'Dismiss', d: 'Wrong or irrelevant. Removed from the deal, restorable later.' },
            { i: User, c: 'var(--status-green)', t: 'client · name', d: 'The client said this. Treat as fact.' },
            { i: Building2, c: 'var(--status-amber)', t: 'MathCo said this', d: 'We said it and the client never confirmed. Confirm only if you know it is true.' },
            { i: Link2, c: 'var(--accent)', t: 'Change deal', d: 'Moves this one call to a different deal. Other calls in the thread stay put.' },
            { i: Mic, c: 'var(--accent)', t: 'Log a call', d: 'For a 1-1 with no notetaker: paste your notes and Relay extracts the fields.' },
          ].map((r) => (
            <div key={r.t} className="flex items-start gap-2.5">
              <r.i size={14} style={{ color: r.c }} className="mt-0.5 shrink-0" />
              <div>
                <span className="text-[12.5px] font-medium">{r.t}</span>
                <span className="text-[12.5px] text-secondary"> — {r.d}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* per-screen */}
      <div className="text-[11px] text-secondary mb-2">Screen by screen</div>
      <div className="flex flex-col gap-2">
        {SECTIONS.map((s) => {
          const isOpen = open === s.key
          return (
            <Card key={s.key} className="p-0 overflow-hidden">
              <button onClick={() => setOpen(isOpen ? '' : s.key)}
                className="w-full text-left px-4 py-3 flex items-center gap-2.5 hover:bg-hover transition-colors">
                <s.icon size={15} className="text-accent shrink-0" />
                <span className="text-[13px] font-medium">{s.label}</span>
                <span className="text-[12px] text-secondary truncate flex-1">{s.what}</span>
                {s.shot && <Pill tone="neutral">screenshot</Pill>}
                <span className="text-tertiary text-[12px]">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <div className="flex flex-col gap-1.5 mb-3">
                    {s.how.map((h) => (
                      <div key={h.t} className="text-[12.5px]">
                        <span className="font-medium">{h.t}</span>
                        <span className="text-secondary"> — {h.d}</span>
                      </div>
                    ))}
                  </div>
                  {s.shot && (
                    <img src={`${BASE}guide/${s.shot}`} alt={`${s.label} screen`}
                      className="w-full rounded-md hairline" loading="lazy" />
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <div className="text-[11px] text-tertiary mt-5 leading-snug">
        Questions or something looks wrong? Flag it to JD — especially a field attributed to the wrong side,
        or a call linked to the wrong deal.
      </div>
    </div>
  )
}

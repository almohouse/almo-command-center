import { useState } from 'react'
import { motion } from 'motion/react'

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailCategory = 'All Mail' | 'Action Required' | 'Agent Updates' | 'Customer Messages' | 'System Alerts'

interface Email {
  id: string
  sender: string
  subject: string
  preview: string
  category: EmailCategory
  timestamp: string
  unread: boolean
  body: string[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const EMAILS: Email[] = [
  {
    id: '1', sender: 'Scout Agent', subject: 'Product Research: Keyboard Tray Market Analysis Ready',
    preview: 'Full report ready for review. 847 TikTok videos, 3 competitors identified, margin 38%.',
    category: 'Agent Updates', timestamp: '5min ago', unread: true,
    body: [
      'I have completed the keyboard tray market analysis for KSA. Key findings: 847 TikTok videos with #ErgoDesk in the last 30 days showing strong demand signal.',
      'Competitor landscape: 3 main competitors with pricing between 89-340 SAR. ALMO opportunity at 149-199 SAR with premium positioning.',
      'Recommended next step: advance to Stage 5 (Supplier Identification). I can initiate supplier outreach immediately on your approval.',
    ],
  },
  {
    id: '2', sender: 'DCEO', subject: 'Weekly Summary: 3 tasks completed, 2 approvals needed',
    preview: 'This week: B2B pipeline updated, keyboard tray advanced to stage 4, Aramco deal flagged for review.',
    category: 'Agent Updates', timestamp: '1h ago', unread: true,
    body: [
      'Weekly council summary for the week ending March 26, 2026. Three tasks completed: B2B pipeline updated with 2 new leads, keyboard tray research advanced to Stage 4, CTO Phase 1 build committed.',
      'Two items require your approval: Agent deployment strategy (GATE file pending), and Aramco RFQ response (deadline: March 30).',
      'Financial note: MTD revenue at 18,400 SAR against 25,000 SAR target. Forecast 22,000 SAR by month end.',
    ],
  },
  {
    id: '3', sender: 'محمد العمري', subject: 'Order #4521 - Delivery inquiry',
    preview: 'Hello, I ordered a Cocoon Pro last week and haven\'t received shipping info yet.',
    category: 'Customer Messages', timestamp: '2h ago', unread: true,
    body: [
      'السلام عليكم، أنا محمد العمري. طلبت كوكون برو الأسبوع الماضي (طلب رقم 4521) ولم أتلق أي معلومات عن الشحن حتى الآن.',
      'Hello, I ordered a Cocoon Pro last week (Order #4521) and haven\'t received any shipping information yet. Could you please update me on the status?',
      'I\'d appreciate a quick response. Thank you.',
    ],
  },
  {
    id: '4', sender: 'CTO', subject: 'Mission Control Build Update - Phase 2 Starting',
    preview: 'Phase 1 complete. Dashboard, layout, design tokens all committed. Starting 10 additional pages.',
    category: 'Agent Updates', timestamp: '3h ago', unread: true,
    body: [
      'Phase 1 of Mission Control V2 is complete. Committed to main branch: base layout, sidebar navigation, design token system, Dashboard page, and Recharts integration.',
      'Phase 2 is now starting: building 10 additional pages including Logs, B2B, Inbox, Content, Social, Vault, Memory, Discovery, CRDO, and Factory.',
      'Estimated completion: 2-3 hours. All pages will follow the glass-card design system established in Phase 1.',
    ],
  },
  {
    id: '5', sender: 'System Alert', subject: 'Agent cost threshold: 80% of monthly budget reached',
    preview: 'Current month AI spend: 160 SAR of 200 SAR budget. Projected to exceed limit in 4 days.',
    category: 'System Alerts', timestamp: '4h ago', unread: false,
    body: [
      'ALMO OS has reached 80% of the monthly AI agent budget. Current spend: 160 SAR of 200 SAR allocated.',
      'At the current burn rate, the budget will be exhausted in approximately 4 days. Consider increasing the budget or pausing non-critical agent tasks.',
      'Top consumers this month: CTO (68 SAR), Scout (45 SAR), DCEO (32 SAR), CFO (15 SAR).',
    ],
  },
  {
    id: '6', sender: 'فيصل الشهري', subject: 'Product inquiry: Cocoon Pro bulk order',
    preview: 'Interested in 50 units for our office. Can you provide a bulk pricing quote?',
    category: 'Action Required', timestamp: '5h ago', unread: true,
    body: [
      'مرحباً، أنا فيصل الشهري من شركة الشهري للاستشارات. نحن مهتمون بشراء 50 وحدة من كوكون برو لمكاتبنا في الرياض.',
      'Hello, I am Faisal Al-Shahri from Al-Shahri Consulting. We are interested in purchasing 50 units of the Cocoon Pro for our Riyadh offices.',
      'Could you provide a bulk pricing quote and availability timeline? We have a budget cycle closing at end of Q1.',
    ],
  },
  {
    id: '7', sender: 'CFO', subject: 'Financial Report: March MTD Revenue 18,400 SAR',
    preview: 'MTD breakdown: Salla 14,200 SAR, B2B 4,200 SAR. Expense burn 9,800 SAR. Net +8,600 SAR.',
    category: 'Agent Updates', timestamp: '6h ago', unread: false,
    body: [
      'March MTD financial summary as of March 26, 2026. Total revenue: 18,400 SAR. Breakdown: Salla e-commerce 14,200 SAR (77%), B2B direct 4,200 SAR (23%).',
      'Total expenses: 9,800 SAR. Major costs: AI agent budget 160 SAR, Salla platform fees 840 SAR, shipping & logistics 3,200 SAR, misc 5,600 SAR.',
      'Net operating income: 8,600 SAR. Cash position: 4,783 SAR liquid. Monthly target gap: 6,600 SAR to close by March 31.',
    ],
  },
  {
    id: '8', sender: 'Aramco Procurement', subject: 'RFQ Response Needed: ALMO ergonomic solutions',
    preview: 'URGENT: Our procurement deadline is March 30. Need quote for 200 units Cocoon Pro + accessories.',
    category: 'Action Required', timestamp: '8h ago', unread: true,
    body: [
      'Dear ALMO Team, Aramco Procurement Department is requesting a formal quote for ergonomic workspace solutions. Reference: ARQ-2026-0892.',
      'Requirements: 200 units Cocoon Pro, 50 units keyboard trays (if available), 5-year maintenance contract option. Delivery required by May 15, 2026.',
      'URGENT: Our procurement cycle closes March 30. Please provide your RFQ response by March 29 to Khalid Al-Rashid at k.alrashid@aramco.com.',
    ],
  },
  {
    id: '9', sender: 'System Alert', subject: 'Airtable sync failed - check API key',
    preview: 'The Airtable sync cron job failed with 401 Unauthorized. CFO data may be stale.',
    category: 'System Alerts', timestamp: '10h ago', unread: false,
    body: [
      'The automated Airtable sync job (cron: airtable-sync) failed at 06:00 with error: 401 Unauthorized.',
      'This means financial data in Mission Control may be stale. Last successful sync: 25h ago.',
      'Action required: navigate to Settings → Integrations → Airtable and refresh the API key.',
    ],
  },
  {
    id: '10', sender: 'نورة الفرج', subject: 'Follow up: SABIC order quote',
    preview: 'Following up on the quote I requested last week for SABIC Riyadh ergonomic solutions.',
    category: 'Action Required', timestamp: '1d ago', unread: false,
    body: [
      'مرحباً، أنا نورة الفرج من شركة سابك الرياض. أتابع معكم بخصوص عرض الأسعار الذي طلبته الأسبوع الماضي.',
      'Hello, I\'m Nora Al-Faraj from SABIC Riyadh. I\'m following up on the pricing quote I requested last week for ergonomic workspace solutions for our team of 120.',
      'Please advise on the status and expected delivery timeline for a potential order of 120 Cocoon Pro units.',
    ],
  },
  {
    id: '11', sender: 'CRDO', subject: 'Discovery Report: Weighted blanket opportunity analysis',
    preview: 'Market size: 42M SAR annually in KSA. Margin potential 44%. Recommend advancing to full pipeline.',
    category: 'Agent Updates', timestamp: '1d ago', unread: false,
    body: [
      'Discovery report for weighted blanket opportunity in KSA market. Market sizing: 42M SAR addressable annually based on population demographics and wellness trend data.',
      'Competitor analysis: 3 brands currently on Noon.com, all imported. No local Saudi brand in premium segment. ALMO price opportunity: 299-449 SAR.',
      'Projected margin: 44% at target price with Chinese manufacturing. MOQ: 200 units. Recommend advancing to full 8-stage discovery pipeline.',
    ],
  },
  {
    id: '12', sender: 'CMO (Not Deployed)', subject: 'Content pipeline paused - CMO not deployed',
    preview: 'Content creation and social scheduling are paused until CMO agent is deployed.',
    category: 'Action Required', timestamp: '2d ago', unread: false,
    body: [
      'This is an automated notification from ALMO OS. The CMO (Chief Marketing Officer) agent has not been deployed.',
      'The following capabilities are currently unavailable: content creation, Instagram/LinkedIn scheduling, marketing campaign management, and brand voice synthesis.',
      'To unlock the content engine, deploy the CMO agent from the Org page. Estimated setup time: 5 minutes.',
    ],
  },
  {
    id: '13', sender: 'خالد الراشد', subject: 'Aramco HQ bulk purchase discussion',
    preview: 'Following our meeting, I\'d like to discuss the 480,000 SAR proposal in more detail.',
    category: 'Action Required', timestamp: '2d ago', unread: false,
    body: [
      'بعد اجتماعنا الأخير، أود مناقشة عرض 480,000 ريال بشكل أكثر تفصيلاً مع فريقكم.',
      'Following our meeting, I would like to discuss the 480,000 SAR proposal in more detail. Specifically, the payment terms and phased delivery schedule.',
      'Can we arrange a call this week? My availability: Sunday 2-4 PM, Monday 10 AM-12 PM (Riyadh time).',
    ],
  },
  {
    id: '14', sender: 'Scout Agent', subject: 'Competitor Analysis: New ergonomic brands entering KSA',
    preview: '3 new international brands entering KSA in Q2. ALMO\'s local advantage is key differentiator.',
    category: 'Agent Updates', timestamp: '3d ago', unread: false,
    body: [
      'Competitive intelligence update: 3 international ergonomic brands have announced KSA market entry for Q2 2026.',
      'Brands: ErgoFlow (German, premium tier), ComfortBase (Chinese, budget tier), WorkNest (US, mid-tier). None have local manufacturing or Saudi brand identity.',
      'ALMO advantage: local brand, Saudi-first positioning, faster delivery, and cultural fit. Recommend using "Crafted for Saudi" messaging as primary differentiator.',
    ],
  },
  {
    id: '15', sender: 'DCEO', subject: 'Council Meeting Summary: Keyboard Tray advance to Stage 4',
    preview: 'Council decision: keyboard tray advances to Stage 4 (Competitor Mapping). Scout assigned.',
    category: 'Agent Updates', timestamp: '4d ago', unread: false,
    body: [
      'Council meeting summary from March 22, 2026. Primary agenda: keyboard tray product discovery status review.',
      'Decision: keyboard tray product advances to Stage 4 (Competitor Mapping). Scout has been assigned and will complete analysis within 48 hours.',
      'Secondary decisions: Q2 priorities confirmed (MC V2 launch, B2B expansion, CMO deployment). Next council meeting: March 29.',
    ],
  },
]

const CATEGORIES: { name: EmailCategory; count: number }[] = [
  { name: 'All Mail',          count: EMAILS.length },
  { name: 'Action Required',   count: EMAILS.filter((e) => e.category === 'Action Required').length },
  { name: 'Agent Updates',     count: EMAILS.filter((e) => e.category === 'Agent Updates').length },
  { name: 'Customer Messages', count: EMAILS.filter((e) => e.category === 'Customer Messages').length },
  { name: 'System Alerts',     count: EMAILS.filter((e) => e.category === 'System Alerts').length },
]

const CATEGORY_BADGE: Record<EmailCategory, string> = {
  'All Mail':          'bg-[#acaaae]/10 text-[#acaaae] border-[#acaaae]/20',
  'Action Required':   'bg-[#ff9fe3]/10 text-[#ff9fe3] border-[#ff9fe3]/20',
  'Agent Updates':     'bg-[#cacafe]/10 text-[#cacafe] border-[#cacafe]/20',
  'Customer Messages': 'bg-secondary/10 text-secondary border-secondary/20',
  'System Alerts':     'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Inbox Page ───────────────────────────────────────────────────────────────

export default function Inbox() {
  const [activeCategory, setActiveCategory] = useState<EmailCategory>('All Mail')
  const [selectedEmail, setSelectedEmail]   = useState<Email | null>(null)
  const [emails, setEmails]                 = useState<Email[]>(EMAILS)

  const filtered = activeCategory === 'All Mail'
    ? emails
    : emails.filter((e) => e.category === activeCategory)

  function markAsRead(id: string) {
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, unread: false } : e))
  }

  function handleSelect(email: Email) {
    setSelectedEmail(email)
    markAsRead(email.id)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-1">
          Communications
        </div>
        <h1 className="text-4xl font-black text-primary">Inbox</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {emails.filter((e) => e.unread).length} unread · {emails.length} total
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-5">
        {/* Sidebar */}
        <div className="w-52 shrink-0">
          <div className="glass-card p-3 space-y-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => { setActiveCategory(cat.name); setSelectedEmail(null) }}
                className={[
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all',
                  activeCategory === cat.name
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/[0.04]',
                ].join(' ')}
              >
                <span>{cat.name}</span>
                <span className={[
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                  activeCategory === cat.name ? 'bg-primary/10 text-primary' : 'text-on-surface-variant/60',
                ].join(' ')}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Email list */}
        <div className={`flex-1 min-w-0 ${selectedEmail ? 'max-w-xs' : ''}`}>
          <div className="space-y-2">
            {filtered.map((email) => (
              <div
                key={email.id}
                onClick={() => handleSelect(email)}
                className={[
                  'glass-card p-4 cursor-pointer flex gap-3 hover:border-primary/20 transition-all',
                  selectedEmail?.id === email.id ? 'border-primary/20 bg-primary/[0.03]' : '',
                ].join(' ')}
              >
                {/* Unread dot */}
                <div className="flex flex-col items-center pt-1 shrink-0">
                  {email.unread
                    ? <div className="w-2 h-2 rounded-full bg-[#cacafe]" />
                    : <div className="w-2 h-2" />
                  }
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-[11px] font-black text-primary">
                  {getInitials(email.sender)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm ${email.unread ? 'font-bold text-primary' : 'font-medium text-on-surface-variant'}`}>
                      {email.sender}
                    </span>
                    <span className="text-[10px] text-on-surface-variant/60 shrink-0">{email.timestamp}</span>
                  </div>
                  <div className={`text-[13px] mt-0.5 truncate ${email.unread ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>
                    {email.subject}
                  </div>
                  {!selectedEmail && (
                    <div className="text-[11px] text-on-surface-variant/60 mt-0.5 truncate">
                      {email.preview}
                    </div>
                  )}
                  <div className="mt-1.5">
                    <span className={`text-[10px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full border ${CATEGORY_BADGE[email.category]}`}>
                      {email.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email detail */}
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-primary leading-snug">{selectedEmail.subject}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                    {getInitials(selectedEmail.sender)}
                  </div>
                  <span className="text-sm text-on-surface-variant">{selectedEmail.sender}</span>
                  <span className="text-[11px] text-on-surface-variant/50">· {selectedEmail.timestamp}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-on-surface-variant hover:text-primary transition-colors ml-4 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {selectedEmail.body.map((para, i) => (
                <p key={i} className="text-sm text-on-surface-variant leading-relaxed">{para}</p>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-primary/[0.08]">
              {[
                { label: 'Reply',         icon: 'reply' },
                { label: 'Archive',       icon: 'archive' },
                { label: 'Mark as Done',  icon: 'check_circle' },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-surface-container-high/60 border border-primary/[0.08] text-on-surface-variant hover:text-primary hover:border-primary/20 transition-all"
                  onClick={async () => {
                    try {
                      await fetch('/api/inbox/' + action.label.toLowerCase().replace(/ /g, '-'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emailId: selectedEmail.id }),
                      })
                    } catch { /* dev: no backend */ }
                  }}
                >
                  <span className="material-symbols-outlined text-[15px]">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

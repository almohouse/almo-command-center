import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'

const USERS = [
  {
    id: 'moe',
    name: 'Moe',
    fullName: 'Mohannad',
    role: 'Co-Founder',
    initial: 'M',
    color: '#e6e6fa',
  },
  {
    id: 'alaa',
    name: 'Alaa',
    fullName: 'Alaa',
    role: 'Co-Founder',
    initial: 'A',
    color: '#cacafe',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

export default function Login() {
  const navigate = useNavigate()

  function handleSelect(userId: string) {
    localStorage.setItem('almo_user', userId)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute rounded-full opacity-[0.06] blur-3xl"
          style={{ width: 700, height: 700, top: -250, left: -150, background: '#e6e6fa' }}
        />
        <div
          className="absolute rounded-full opacity-[0.04] blur-3xl"
          style={{ width: 500, height: 500, bottom: -100, right: -100, background: '#ff9fe3' }}
        />
        <div
          className="absolute rounded-full opacity-[0.03] blur-3xl"
          style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#cacafe' }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center gap-12 px-6"
      >
        {/* Logo + Brand */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-4">
          <img
            src="/almo-logo.png"
            alt="ALMO"
            className="h-14 object-contain"
            style={{ filter: 'invert(1)' }}
          />
          <div className="text-center">
            <div className="text-2xl font-black tracking-[0.2em] text-primary uppercase">
              Mission Control
            </div>
            <div className="text-[11px] font-bold tracking-[0.3em] text-on-surface-variant/60 uppercase mt-1">
              The Digital Obsidian
            </div>
          </div>
        </motion.div>

        {/* User picker */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <div className="text-[11px] font-bold tracking-[0.2em] text-on-surface-variant/60 uppercase mb-2">
            Select your account
          </div>
          <div className="flex gap-5">
            {USERS.map((user) => (
              <motion.button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-8 flex flex-col items-center gap-4 w-44 cursor-pointer hover:border-primary/20 transition-all group"
              >
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black border-2 transition-all group-hover:shadow-lg"
                  style={{
                    background: `${user.color}18`,
                    borderColor: `${user.color}40`,
                    color: user.color,
                    boxShadow: `0 0 20px ${user.color}15`,
                  }}
                >
                  {user.initial}
                </div>

                {/* Info */}
                <div className="text-center">
                  <div className="text-base font-black text-primary">{user.fullName}</div>
                  <div className="text-[11px] font-bold tracking-[0.1em] text-on-surface-variant uppercase mt-0.5">
                    {user.role}
                  </div>
                </div>

                {/* Arrow */}
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40 group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant/30 uppercase"
        >
          ALMO OS V2 · Mission Control
        </motion.div>
      </motion.div>
    </div>
  )
}

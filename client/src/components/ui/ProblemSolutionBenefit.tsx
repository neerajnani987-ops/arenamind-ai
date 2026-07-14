import React from 'react';
import { AlertCircle, Cpu, ShieldCheck } from 'lucide-react';

interface PSBItem {
  problem: string;
  solution: string;
  benefit: string;
}

const PAGES_METADATA: Record<string, PSBItem> = {
  landing: {
    problem: "Spectators at major events experience chaotic stadium check-ins, long concession lines, and wayfinding confusion.",
    solution: "ArenaMind AI integrates crowd intelligence models, Dijkstra graph navigation, and multilingual audio assistants.",
    benefit: "Spectators save up to 19 minutes at gates, find restrooms with 80% shorter wait times, and get voice directions in 5 regional languages."
  },
  login: {
    problem: "Operational control centers are vulnerable to unauthorized access, potentially disrupting critical stadium safety protocols.",
    solution: "Secure, role-based gateways enforce token validations and request restrictions for different stadium user groups.",
    benefit: "Staff access custom terminals instantly (Spectator, Security, Medical) matching their roles without risk of privilege escalation."
  },
  signup: {
    problem: "Spectators and crew need frictionless, rapid profile onboarding while maintaining ticket validation integrity.",
    solution: "Frictionless registration bridges digital ticket QR codes with localized profile setups and role mapping.",
    benefit: "Immediately activate customized dashboards, offline wayfinding maps, and speech-activated AI helpers."
  },
  'forgot-password': {
    problem: "Accidental account lockout during tournament peaks can block critical wayfinding routes or staff operations.",
    solution: "Encrypted password reset workflows dynamically issue security links without exposing raw credentials.",
    benefit: "Operators regain account control in seconds, minimizing event navigation downtime or coordination delays."
  },
  dashboard: {
    problem: "Managing stadium operations (medical emergencies, weather alerts, crowd flows) requires sorting through complex telemetry.",
    solution: "ArenaMind AI processes real-time sensor logs to forecast hourly wait times and generate operational actions.",
    benefit: "Stadium managers, security, and medics receive data-driven instructions instantly to respond to incidents in under 5 seconds."
  }
};

interface ProblemSolutionBenefitProps {
  page: 'landing' | 'login' | 'signup' | 'forgot-password' | 'dashboard';
}

/**
 * ProblemSolutionBenefit component displays the hackathon alignment mapping:
 * Problem -> AI Solution -> User Benefit.
 */
export const ProblemSolutionBenefit: React.FC<ProblemSolutionBenefitProps> = React.memo(({ page }) => {
  const item = PAGES_METADATA[page];
  if (!item) return null;

  return (
    <section 
      className="p-5 rounded-2xl glass-panel border border-white/10 dark:border-white/10 light:border-black/10 shadow-glass max-w-5xl mx-auto my-6 text-white" 
      aria-label="Stadium Operational Impact"
    >
      <div className="text-center mb-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">Operational Value Path</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Card 1: Problem */}
        <div className="flex flex-col p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 shadow-neon-rose hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center space-x-2 text-rose-400 mb-2">
            <AlertCircle size={16} aria-hidden="true" />
            <span className="font-extrabold text-xs uppercase tracking-wider">The Problem</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-sans flex-1">
            {item.problem}
          </p>
        </div>

        {/* Card 2: AI Solution */}
        <div className="flex flex-col p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 shadow-neon hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <Cpu size={16} aria-hidden="true" />
            <span className="font-extrabold text-xs uppercase tracking-wider">AI Solution</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-sans flex-1">
            {item.solution}
          </p>
        </div>

        {/* Card 3: User Benefit */}
        <div className="flex flex-col p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 shadow-neon-emerald hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <ShieldCheck size={16} aria-hidden="true" />
            <span className="font-extrabold text-xs uppercase tracking-wider">User Benefit</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-sans flex-1">
            {item.benefit}
          </p>
        </div>
      </div>
    </section>
  );
});

ProblemSolutionBenefit.displayName = 'ProblemSolutionBenefit';
export default ProblemSolutionBenefit;

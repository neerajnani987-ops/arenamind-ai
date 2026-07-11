import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ShieldCheck, 
  Languages, 
  LineChart, 
  Compass, 
  Zap, 
  Users, 
  AlertTriangle 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRoleQuickLogin = async (role: string) => {
    try {
      await login(`${role}@arenamind.ai`);
      navigate(`/dashboard?role=${role}`);
    } catch (e) {
      console.error(e);
    }
  };

  const features = [
    { name: 'AI Crowd Intelligence', desc: 'Predict flow, prevent choke points, and optimize gates in real-time.', icon: <Users className="text-indigo-400" size={24} /> },
    { name: 'Smart Indoor Navigation', desc: 'Find fastest, least crowded, or wheelchair-accessible routes to seats.', icon: <Compass className="text-indigo-400" size={24} /> },
    { name: 'Multilingual Assistant', desc: 'Converse naturally in English, Hindi, Telugu, Tamil, or Kannada.', icon: <Languages className="text-indigo-400" size={24} /> },
    { name: 'Emergency Evacuation AI', desc: 'Automate safest exits routing and broadcast voice announcements.', icon: <AlertTriangle className="text-indigo-400" size={24} /> },
    { name: 'Queue & Parking Optimizers', desc: 'Predict restrooms, food court lines, and direct parking spots.', icon: <LineChart className="text-indigo-400" size={24} /> },
    { name: 'Role-Based Action Dashboards', desc: 'Custom command views for spectators, organizers, security, and medics.', icon: <ShieldCheck className="text-indigo-400" size={24} /> },
  ];

  const quickRoles = [
    { role: 'spectator', title: 'Spectator', color: 'from-blue-600 to-indigo-600', desc: 'Find seats, concessions, scanner.' },
    { role: 'organizer', title: 'Organizer', color: 'from-violet-600 to-fuchsia-600', desc: 'Manage operations, translator, emergency.' },
    { role: 'volunteer', title: 'Volunteer', color: 'from-emerald-600 to-teal-600', desc: 'Get active gate assistance alerts.' },
    { role: 'security', title: 'Security', color: 'from-rose-600 to-orange-600', desc: 'Monitor flows, risks, write logs.' },
    { role: 'medical', title: 'Medical', color: 'from-amber-600 to-yellow-600', desc: 'Dispatch routes to active incident sites.' },
    { role: 'admin', title: 'Admin', color: 'from-pink-600 to-rose-600', desc: 'User logs, match scores, system toggles.' }
  ];

  return (
    <div className="space-y-16 py-6 text-white max-w-6xl mx-auto">
      
      {/* Hero Section */}
      <section className="text-center relative py-12 md:py-20 px-4 rounded-3xl overflow-hidden glass-panel border border-white/5 shadow-glass">
        
        {/* Neon Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <Zap size={14} className="animate-bounce-slow" />
            <span>Generative AI-Powered Smart Stadium Operations</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight font-sans">
            ArenaMind AI
            <span className="block mt-2 text-2xl md:text-3xl font-medium text-white/70">
              Making Stadiums Intelligent with Generative AI
            </span>
          </h1>

          <p className="text-sm md:text-base text-white/60 leading-relaxed font-sans max-w-2xl mx-auto">
            Optimizing tournament logistics, spectator routing, and safety parameters at scale. Used in FIFA World Cup, IPL, Olympics, and ICC Cricket venues.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleRoleQuickLogin('spectator')}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-neon hover:scale-102 transition-all text-sm"
              id="btn-get-started"
            >
              Enter Spectator Portal
            </button>
            <a
              href="#portal-section"
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-all text-sm block"
            >
              Explore Staff Dashboards
            </a>
          </div>
        </div>
      </section>

      {/* SVG Animated Stadium Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* Visual Arena Representation */}
        <div className="flex justify-center">
          <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border border-indigo-500/20 flex items-center justify-center p-4 bg-indigo-950/10 shadow-glass">
            
            {/* Spinning Arena Grid */}
            <div className="absolute inset-4 rounded-full border border-dashed border-indigo-500/10 animate-spin-slow"></div>
            
            {/* Stadium tiers */}
            <div className="w-64 h-64 rounded-full border-4 border-indigo-500/20 flex items-center justify-center shadow-inner">
              <div className="w-48 h-48 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-[#0a0f1d] border border-indigo-500/40 flex flex-col items-center justify-center shadow-2xl relative">
                  <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">PITCH</div>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping absolute"></div>
                </div>
              </div>
            </div>

            {/* Stand/Gate Dots */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-500 shadow-neon flex items-center justify-center text-[8px] font-bold">A</div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 shadow-neon-emerald flex items-center justify-center text-[8px] font-bold">B</div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 shadow-neon-rose flex items-center justify-center text-[8px] font-bold">C</div>
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500 shadow-neon flex items-center justify-center text-[8px] font-bold">D</div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Arena Mind Platform Status</h2>
          <p className="text-sm text-white/60 leading-relaxed font-sans">
            Operations logs are updated dynamically by IoT sensors installed at structural gate arches, restroom pressure pads, food cash points, and parking exits.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-extrabold text-indigo-400">92%</div>
              <span className="text-[10px] uppercase font-bold text-white/50 block mt-1">Live Occupancy (Gate B)</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-400">2.5 min</div>
              <span className="text-[10px] uppercase font-bold text-white/50 block mt-1">Average Restroom Queue</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-extrabold text-amber-400">4,200/hr</div>
              <span className="text-[10px] uppercase font-bold text-white/50 block mt-1">Gate Entry Flow</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-2xl md:text-3xl font-extrabold text-indigo-400">98.5%</div>
              <span className="text-[10px] uppercase font-bold text-white/50 block mt-1">AI Recommendation Match</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of AI Features */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Core Generative AI Workflows</h2>
          <p className="text-xs md:text-sm text-white/60">
            Translating predictions into concrete, localized operational guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all text-left space-y-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="font-bold text-sm text-white">{feat.name}</h3>
              <p className="text-xs text-white/70 leading-relaxed font-sans">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Portal Section */}
      <section id="portal-section" className="space-y-8 border-t border-white/5 pt-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Terminal Login Portals</h2>
          <p className="text-xs md:text-sm text-white/60">
            Click on any dashboard role to log in immediately with simulated environment parameters.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {quickRoles.map((qr) => (
            <button
              key={qr.role}
              onClick={() => handleRoleQuickLogin(qr.role)}
              className="flex flex-col text-left justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all h-40 group text-white"
              id={`quick-login-${qr.role}`}
            >
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-tr ${qr.color} flex items-center justify-center font-bold text-white shadow group-hover:scale-105 transition-all text-xs`}>
                {qr.title.slice(0,2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-xs tracking-wide">{qr.title}</div>
                <p className="text-[10px] text-white/60 leading-tight">{qr.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
export default LandingPage;

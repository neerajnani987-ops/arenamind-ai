import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import type { PredictionResult, UserRole, Gate, Alert, Match } from '../types';
import { useRealtimeCollection } from '../firebase/config';
import { ProblemSolutionBenefit } from '../components/ui/ProblemSolutionBenefit';
import { 
  Users, 
  DoorOpen, 
  Clock, 
  ShieldAlert, 
  HeartHandshake, 
  CloudSun, 
  Cpu,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

// Lazy load role dashboards for bundle code-splitting optimization (hackathon eval parameters)
const SpectatorDashboard = React.lazy(() => import('./roles/SpectatorDashboard').then(m => ({ default: m.SpectatorDashboard })));
const OrganizerDashboard = React.lazy(() => import('./roles/OrganizerDashboard').then(m => ({ default: m.OrganizerDashboard })));
const VolunteerDashboard = React.lazy(() => import('./roles/VolunteerDashboard').then(m => ({ default: m.VolunteerDashboard })));
const SecurityDashboard = React.lazy(() => import('./roles/SecurityDashboard').then(m => ({ default: m.SecurityDashboard })));
const MedicalDashboard = React.lazy(() => import('./roles/MedicalDashboard').then(m => ({ default: m.MedicalDashboard })));
const AdminDashboard = React.lazy(() => import('./roles/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Loading spinner fallback component
const LoaderFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-12 text-indigo-400 space-y-3" aria-live="polite">
    <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
    <span className="text-xs font-semibold uppercase tracking-wider">Loading Control Panel...</span>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // User Profile Role fallback
  const userProfileRole = user?.role || 'spectator';
  const urlRole = searchParams.get('role');

  // URL override role permission authorization guard
  let activeRole = userProfileRole;
  
  if (urlRole) {
    const allowedRoles: Record<string, string[]> = {
      admin: ['admin', 'organizer', 'security', 'medical', 'volunteer', 'spectator'],
      organizer: ['organizer', 'volunteer', 'spectator'],
      security: ['security', 'volunteer', 'spectator'],
      medical: ['medical', 'volunteer', 'spectator'],
      volunteer: ['volunteer', 'spectator'],
      spectator: ['spectator'],
    };

    const userAllowedList = (allowedRoles[userProfileRole] || ['spectator']) as UserRole[];
    
    if (userAllowedList.includes(urlRole as UserRole)) {
      activeRole = urlRole as UserRole;
    } else {
      // Permission bypass attempt detected
      activeRole = userProfileRole;
    }
  }

  // Load real-time collections
  const { data: gates } = useRealtimeCollection<Gate>('gates');
  const { data: alerts } = useRealtimeCollection<Alert>('alerts');
  const { data: matches } = useRealtimeCollection<Match>('matches');

  // Predictions states
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(true);

  // Active metrics
  const totalSpectators = matches.length > 0 ? matches[0].spectatorCount : 68420;
  const openGates = gates.filter((g: Gate) => g.status === 'open').length;
  const maxWaitTime = gates.length > 0 ? Math.max(...gates.map((g: Gate) => g.waitTime)) : 0;
  
  const activeMedAlerts = alerts.filter(a => a.type === 'medical' && a.status === 'active').length;
  const activeSecAlerts = alerts.filter(a => a.type === 'security' && a.status === 'active').length;

  const weather = localStorage.getItem('arenamind_weather') || 'Clear';
  const weatherTemp = weather === 'Clear' ? '30°C' : weather === 'Rainy' ? '24°C' : '34°C';

  const loadAIPredictions = useCallback(async () => {
    setIsLoadingPredictions(true);
    try {
      const res = await apiService.getPredictions(weather, totalSpectators);
      setPredictions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPredictions(false);
    }
  }, [weather, totalSpectators]);

  useEffect(() => {
    loadAIPredictions();
    
    // Refresh predictions when weather or crowd count is changed in local storage
    const interval = setInterval(() => {
      loadAIPredictions();
    }, 6000);
    return () => clearInterval(interval);
  }, [loadAIPredictions]);

  // Effect to display URL role rejection warnings (friendly UX notice)
  useEffect(() => {
    if (urlRole && urlRole !== activeRole) {
      setPermissionError(`Access Denied: Your profile role (${userProfileRole}) is unauthorized to view the "${urlRole}" control center. Reverting to authorized view.`);
      const timer = setTimeout(() => setPermissionError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [urlRole, activeRole, userProfileRole]);

  // Render role-specific dashboard
  const renderRoleDashboard = () => {
    switch (activeRole) {
      case 'spectator':
        return <SpectatorDashboard />;
      case 'organizer':
        return <OrganizerDashboard />;
      case 'volunteer':
        return <VolunteerDashboard />;
      case 'security':
        return <SecurityDashboard />;
      case 'medical':
        return <MedicalDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <SpectatorDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <ProblemSolutionBenefit page="dashboard" />
      {/* Access Warning Notification */}
      {permissionError && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 flex items-center space-x-3 text-xs shadow-neon-rose" role="alert">
          <AlertTriangle className="text-rose-400 shrink-0" size={18} />
          <span>{permissionError}</span>
        </div>
      )}
      
      {/* Metrics Grid */}
      <section className="grid grid-cols-2 md:grid-cols-6 gap-4 text-white" aria-label="Stadium Real-time Telemetry Stats">
        {/* Crowd Density Card */}
        <div className="p-4 rounded-xl glass-panel border border-white/5 shadow-glass flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Crowd Density</span>
            <Users size={14} className="text-indigo-400" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <div className="text-lg md:text-xl font-black">{totalSpectators.toLocaleString()}</div>
            <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Live Spectators</span>
          </div>
        </div>

        {/* Active Gates Card */}
        <div className="p-4 rounded-xl glass-panel border border-white/5 shadow-glass flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Active Gates</span>
            <DoorOpen size={14} className="text-indigo-400" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <div className="text-lg md:text-xl font-black">{openGates} / {gates.length}</div>
            <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Gate Arches Open</span>
          </div>
        </div>

        {/* Queue Wait Time Card */}
        <div className="p-4 rounded-xl glass-panel border border-white/5 shadow-glass flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Peak Wait Time</span>
            <Clock size={14} className="text-indigo-400" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <div className="text-lg md:text-xl font-black">{maxWaitTime} min</div>
            <span className={`text-[9px] font-bold block mt-0.5 ${maxWaitTime > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {maxWaitTime > 15 ? 'Gate B Jammed' : 'Normal Egress'}
            </span>
          </div>
        </div>

        {/* Medical Alerts Card */}
        <div className="p-4 rounded-xl glass-panel border border-white/5 shadow-glass flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Medical Alerts</span>
            <HeartHandshake size={14} className="text-indigo-400" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <div className="text-lg md:text-xl font-black">{activeMedAlerts} Active</div>
            <span className={`text-[9px] font-bold block mt-0.5 ${activeMedAlerts > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {activeMedAlerts > 0 ? 'Medics Dispatched' : 'All Clear'}
            </span>
          </div>
        </div>

        {/* Security Alerts Card */}
        <div className="p-4 rounded-xl glass-panel border border-white/5 shadow-glass flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Security Alerts</span>
            <ShieldAlert size={14} className="text-indigo-400" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <div className="text-lg md:text-xl font-black">{activeSecAlerts} Active</div>
            <span className={`text-[9px] font-bold block mt-0.5 ${activeSecAlerts > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {activeSecAlerts > 0 ? 'Patrol Engaged' : 'No Intrusions'}
            </span>
          </div>
        </div>

        {/* Weather Card */}
        <div className="p-4 rounded-xl glass-panel border border-white/5 shadow-glass flex flex-col justify-between h-24">
          <div className="flex items-center justify-between text-white/50 text-[10px] uppercase font-semibold">
            <span>Weather Sensor</span>
            <CloudSun size={14} className="text-indigo-400" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <div className="text-lg md:text-xl font-black">{weatherTemp}</div>
            <span className="text-[9px] text-white/40 block mt-0.5 capitalize">{weather} Status</span>
          </div>
        </div>
      </section>

      {/* AI Recommendation Banner */}
      <section className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 shadow-neon flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white" aria-labelledby="ai-banner-heading">
        <div className="flex items-start space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5 md:mt-0" aria-hidden="true">
            <Cpu size={20} className="animate-pulse" />
          </div>
          <div>
            <div id="ai-banner-heading" className="text-xs font-bold text-indigo-300 flex items-center space-x-2">
              <span>ArenaMind AI Live Recommendation</span>
              {isLoadingPredictions && (
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" aria-hidden="true"></span>
              )}
            </div>
            <p className="text-xs text-white/90 font-sans mt-0.5 leading-relaxed" aria-live="polite">
              {predictions?.recommendation || "Analyzing stadium logs..."}
            </p>
          </div>
        </div>
        <button
          onClick={loadAIPredictions}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-colors shrink-0 text-xs font-semibold flex items-center space-x-1.5 outline-none focus:ring-2 focus:ring-indigo-500"
          id="btn-refresh-recommendations"
        >
          <RefreshCw size={12} aria-hidden="true" />
          <span>Refresh AI</span>
        </button>
      </section>

      {/* Dynamic Role Dashboard Container */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h2 className="text-lg font-extrabold text-indigo-400 tracking-wide uppercase">
            {activeRole} Control Center
          </h2>
          <span className="text-[10px] text-white/40 font-semibold italic" aria-live="polite">
            Dashboard role resolved: {activeRole}
          </span>
        </div>
        
        <Suspense fallback={<LoaderFallback />}>
          {renderRoleDashboard()}
        </Suspense>
      </section>
    </div>
  );
};

export default Dashboard;

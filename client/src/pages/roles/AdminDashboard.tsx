import React, { useState, useEffect, useCallback } from 'react';
import { useRealtimeCollection } from '../../firebase/config';
import type { Match, Gate, Alert } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Database, 
  RotateCcw, 
  Cpu, 
  RefreshCw, 
  CloudSun, 
  UserPlus 
} from 'lucide-react';

export const AdminDashboard: React.FC = React.memo(() => {
  const { data: matches, updateItem: updateMatch } = useRealtimeCollection<Match>('matches');
  const { data: gates, updateItem: updateGate } = useRealtimeCollection<Gate>('gates');
  const { addItem: addAlert } = useRealtimeCollection<Alert>('alerts');
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  // Load weather and spectator variables from local settings
  const [weather, setWeather] = useState('Clear');
  const [specsCount, setSpecsCount] = useState(68000);

  useEffect(() => {
    // Read local settings
    const savedWeather = localStorage.getItem('arenamind_weather') || 'Clear';
    const savedSpecs = parseInt(localStorage.getItem('arenamind_spectators') || '68000');
    setWeather(savedWeather);
    setSpecsCount(savedSpecs);

    // Seed some initial AI audit logs
    setAiLogs([
      { timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), role: 'Spectator', prompt: 'Take me to Seat A-120', provider: 'gemini', status: 'Success' },
      { timestamp: new Date(Date.now() - 2500000).toLocaleTimeString(), role: 'Organizer', prompt: 'Translate Gate A closed announcement', provider: 'gemini', status: 'Success' },
      { timestamp: new Date(Date.now() - 1200000).toLocaleTimeString(), role: 'Volunteer', prompt: 'Which gate has high crowds?', provider: 'mock_local', status: 'Success' },
      { timestamp: new Date().toLocaleTimeString(), role: 'Admin', prompt: 'Compute queue time predictions', provider: 'gemini', status: 'Success' },
    ]);
  }, []);

  const changeWeather = useCallback((newWeather: string) => {
    setWeather(newWeather);
    localStorage.setItem('arenamind_weather', newWeather);
    
    // Add advisory alert
    addAlert({
      type: 'weather',
      severity: 'medium',
      location: 'Stadium-wide',
      description: `Weather advisory updated to ${newWeather}. Operational AI recommended measures are active.`,
      status: 'active'
    });
  }, [addAlert]);

  const adjustSpectators = useCallback((diff: number) => {
    const newVal = Math.max(0, specsCount + diff);
    setSpecsCount(newVal);
    localStorage.setItem('arenamind_spectators', newVal.toString());

    // Update active match spectator counts in database
    if (matches.length > 0) {
      updateMatch(matches[0].id, { spectatorCount: newVal });
    }

    // Trigger gate queue adjustments based on spectator changes!
    gates.forEach((gate: Gate) => {
      const scale = diff > 0 ? 1.15 : 0.85;
      const currentQueue = Math.max(2, Math.round(gate.queueLength * scale));
      const newWait = Math.round(currentQueue / 15);
      updateGate(gate.id, {
        queueLength: currentQueue,
        waitTime: newWait
      });
    });
  }, [specsCount, matches, gates, updateMatch, updateGate]);

  const resetOperations = useCallback(() => {
    localStorage.removeItem('arenamind_db_alerts');
    localStorage.removeItem('arenamind_db_gates');
    localStorage.removeItem('arenamind_db_facilities');
    localStorage.removeItem('arenamind_db_parking');
    // Reload page to re-seed default data
    window.location.reload();
  }, []);

  const handleRefreshAudit = useCallback(() => {
    setAiLogs(prev => [{ timestamp: new Date().toLocaleTimeString(), role: 'Admin', prompt: 'Audit logs refreshed', provider: 'gemini', status: 'Success' }, ...prev]);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-white">
      
      {/* Column 1: System Settings & Database Simulator */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Database className="text-fuchsia-400" size={18} aria-hidden="true" />
            <h3 className="font-bold text-sm">System Database Simulator</h3>
          </div>

          <p className="text-[11px] text-white/60 leading-relaxed font-sans">
            Simulate operational variables like gate congestions, high-capacity match loads, and weather changes.
          </p>

          <div className="space-y-4 text-xs">
            {/* Weather controller */}
            <div>
              <span className="text-[10px] text-white/50 uppercase font-bold block mb-1.5 flex items-center space-x-1">
                <CloudSun size={12} aria-hidden="true" />
                <span>Simulate Weather Setting</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => changeWeather('Clear')}
                  variant={weather === 'Clear' ? 'primary' : 'secondary'}
                  className={`py-1.5 rounded font-semibold text-[10px] bg-fuchsia-600 hover:bg-fuchsia-700 text-white`}
                >
                  Clear Sunny
                </Button>
                <Button
                  onClick={() => changeWeather('Rainy')}
                  variant={weather === 'Rainy' ? 'primary' : 'secondary'}
                  className={`py-1.5 rounded font-semibold text-[10px] bg-fuchsia-600 hover:bg-fuchsia-700 text-white`}
                >
                  Heavy Rain
                </Button>
                <Button
                  onClick={() => changeWeather('Hot')}
                  variant={weather === 'Hot' ? 'primary' : 'secondary'}
                  className={`py-1.5 rounded font-semibold text-[10px] bg-fuchsia-600 hover:bg-fuchsia-700 text-white`}
                >
                  Extreme Heat
                </Button>
              </div>
            </div>

            {/* Spectators count controller */}
            <div>
              <span className="text-[10px] text-white/50 uppercase font-bold block mb-1.5 flex items-center space-x-1">
                <UserPlus size={12} aria-hidden="true" />
                <span>Live Crowd Capacity: {specsCount.toLocaleString()}</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => adjustSpectators(5000)}
                  variant="secondary"
                  className="py-1.5 rounded text-[10px] text-indigo-300"
                >
                  Add +5,000 Spectators
                </Button>
                <Button
                  onClick={() => adjustSpectators(-5000)}
                  variant="secondary"
                  className="py-1.5 rounded text-[10px] text-rose-300"
                >
                  Reduce -5,000 Spectators
                </Button>
              </div>
            </div>

            {/* Reset Database */}
            <div className="pt-2 border-t border-white/5">
              <Button
                onClick={resetOperations}
                variant="danger"
                className="w-full py-2 text-[10px] transition-all"
                id="btn-reset-db"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reset Simulation Database</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Column 2: AI Execution Log audit */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="text-fuchsia-400" size={18} aria-hidden="true" />
              <h3 className="font-bold text-sm">Gemini AI API & Execution Logs</h3>
            </div>
            <button 
              onClick={handleRefreshAudit}
              className="p-1 rounded text-white/40 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-fuchsia-500"
              aria-label="Refresh AI execution logs list"
            >
              <RefreshCw size={14} aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto text-[10px]" role="region" aria-label="AI API Logs Audit Table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase tracking-widest text-[9px]">
                  <th className="py-2 pb-3 font-semibold">Timestamp</th>
                  <th className="py-2 pb-3 font-semibold">Role</th>
                  <th className="py-2 pb-3 font-semibold">Request Query / Prompt</th>
                  <th className="py-2 pb-3 font-semibold">Provider</th>
                  <th className="py-2 pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {aiLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 font-mono">{log.timestamp}</td>
                    <td className="py-2.5">{log.role}</td>
                    <td className="py-2.5 italic truncate max-w-xs">{log.prompt}</td>
                    <td className="py-2.5 uppercase font-bold text-indigo-400">{log.provider}</td>
                    <td className="py-2.5">
                      <span className="px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';
export default AdminDashboard;

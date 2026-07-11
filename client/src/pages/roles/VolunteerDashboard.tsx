import React, { useState, useCallback } from 'react';
import { useRealtimeCollection } from '../../firebase/config';
import type { Gate } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Users, 
  MapPin, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

export const VolunteerDashboard: React.FC = React.memo(() => {
  const { data: gates, updateItem: updateGate } = useRealtimeCollection<Gate>('gates');
  const [volunteersCount, setVolunteersCount] = useState<Record<string, number>>({
    'gate-a': 5,
    'gate-b': 2,
    'gate-c': 4,
    'gate-d': 6,
    'gate-e': 2,
  });

  const highCongestionGates = gates.filter((g: Gate) => g.queueLength > 100);

  const deployVolunteer = useCallback((gateId: string) => {
    // Increase local count
    setVolunteersCount(prev => ({
      ...prev,
      [gateId]: (prev[gateId] || 0) + 1
    }));

    // Simulate crowd flow reduction in database due to better coordination!
    const gate = gates.find((g: Gate) => g.id === gateId);
    if (gate) {
      const currentQueue = Math.max(0, gate.queueLength - 30);
      const newWait = Math.round(currentQueue / 15);
      updateGate(gateId, {
        queueLength: currentQueue,
        waitTime: newWait
      });
    }
  }, [gates, updateGate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-white">
      
      {/* Active Help Desk Alerts */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <AlertCircle className="text-emerald-400" size={18} aria-hidden="true" />
            <h3 className="font-bold text-sm">Priority Volunteer Tickets</h3>
          </div>

          <div className="space-y-3" role="region" aria-live="polite">
            {highCongestionGates.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40">
                <CheckCircle className="text-emerald-500 mx-auto mb-2" size={24} aria-hidden="true" />
                <span>All gates flow normal. No high priority tickets.</span>
              </div>
            ) : (
              highCongestionGates.map((gate: Gate) => (
                <div key={gate.id} className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-rose-300">
                    <span>Congestion Alert: {gate.name}</span>
                    <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-rose-500/20 text-rose-400">Critical Help</span>
                  </div>
                  <p className="opacity-90 text-[11px] leading-tight">
                    {gate.name} is experiencing crowd size spikes ({gate.queueLength} in line, {gate.waitTime}m wait). Action required: Deploy helpers to distribute brochures, direct flow, and support ticket validation.
                  </p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-white/50 flex items-center space-x-1">
                      <Users size={12} aria-hidden="true" />
                      <span>{volunteersCount[gate.id] || 0} helpers deployed</span>
                    </span>
                    <Button
                      onClick={() => deployVolunteer(gate.id)}
                      variant="primary"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px]"
                      id={`btn-deploy-vol-${gate.id}`}
                    >
                      Assign Myself Here
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Volunteer Duty Guide */}
        <Card className="text-xs space-y-3">
          <div className="font-bold text-sm border-b border-white/10 pb-2 flex items-center space-x-1.5">
            <HelpCircle size={16} className="text-emerald-400" aria-hidden="true" />
            <span>Volunteer Guidelines</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-white/70 leading-relaxed pl-1">
            <li>Ensure clear egress zones near main entry turnstiles.</li>
            <li>Direct wheelchair spectators to Elevator Lobby 3 near Gate A.</li>
            <li>Report blockages or medical incidents immediately to security.</li>
            <li>Translate emergency advisories to Kannada/Telugu when requested.</li>
          </ul>
        </Card>
      </div>

      {/* Gate flow status monitor */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-emerald-400" size={18} aria-hidden="true" />
              <h3 className="font-bold text-sm">Gate Capacity & Deployment Tracker</h3>
            </div>
            <span className="text-[9px] uppercase font-bold text-white/40">Real-time IoT Feeds</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gates.map((gate: Gate) => (
              <div key={gate.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="text-indigo-400" size={14} aria-hidden="true" />
                    <span className="font-bold text-xs">{gate.name}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                    gate.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>{gate.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/5 p-1.5 rounded">
                    <span className="text-white/40 block text-[8px] uppercase">Flow</span>
                    <span className="font-bold">{gate.currentFlow} /m</span>
                  </div>
                  <div className="bg-white/5 p-1.5 rounded">
                    <span className="text-white/40 block text-[8px] uppercase">Queue</span>
                    <span className={`font-bold ${gate.queueLength > 100 ? 'text-rose-400 font-extrabold' : ''}`}>{gate.queueLength}</span>
                  </div>
                  <div className="bg-white/5 p-1.5 rounded">
                    <span className="text-white/40 block text-[8px] uppercase">Wait</span>
                    <span className="font-bold flex items-center justify-center space-x-0.5">
                      <Clock size={10} className="text-white/40" aria-hidden="true" />
                      <span>{gate.waitTime}m</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-white/55">Helpers: {volunteersCount[gate.id] || 0}</span>
                  {gate.queueLength > 50 && (
                    <Button
                      onClick={() => deployVolunteer(gate.id)}
                      variant="primary"
                      className="px-2.5 py-1 text-[10px]"
                      id={`btn-deploy-helper-${gate.id}`}
                    >
                      Deploy Helper (+1)
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});

VolunteerDashboard.displayName = 'VolunteerDashboard';
export default VolunteerDashboard;

import React, { useState, useCallback } from 'react';
import { StadiumMap } from '../../components/StadiumMap';
import { useRealtimeCollection } from '../../firebase/config';
import { apiService } from '../../services/api';
import type { RouteResult, Alert } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Compass, 
  CheckCircle,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

export const MedicalDashboard: React.FC = React.memo(() => {
  const { data: alerts, updateItem: updateAlert } = useRealtimeCollection<Alert>('alerts');
  const medicalAlerts = alerts.filter(a => a.type === 'medical' && a.status === 'active');

  const [activeDispatchRoute, setActiveDispatchRoute] = useState<RouteResult | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Alert | null>(null);

  const calculateDispatchRoute = useCallback(async (incident: Alert) => {
    setSelectedIncident(incident);
    let endNode = 'seat-a120'; // Target node based on incident location

    // Simulate location mappings
    if (incident.location.toLowerCase().includes('gate b')) {
      endNode = 'gate-b';
    } else if (incident.location.toLowerCase().includes('seat 42') || incident.location.toLowerCase().includes('seat a-120')) {
      endNode = 'seat-a120';
    }

    try {
      // Find the fastest route from Medical Alpha node to target node
      const route = await apiService.routing('gate-e', endNode, 'fastest'); // Gate E represents VIP area near medics
      setActiveDispatchRoute(route);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const resolveIncident = useCallback((alertId: string) => {
    updateAlert(alertId, { status: 'resolved' });
    setActiveDispatchRoute(null);
    setSelectedIncident(null);
  }, [updateAlert]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-white">
      
      {/* Column 1: Medical Incidents List */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Heart className="text-rose-500 animate-pulse" size={18} aria-hidden="true" />
            <h3 className="font-bold text-sm">Medical Dispatch Queue</h3>
          </div>

          <div className="space-y-3" role="region" aria-live="polite">
            {medicalAlerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40">
                <CheckCircle className="text-emerald-500 mx-auto mb-2" size={24} aria-hidden="true" />
                <span>No active medical issues. Ground status: Normal.</span>
              </div>
            ) : (
              medicalAlerts.map((alert: Alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border text-xs space-y-2 cursor-pointer transition-all outline-none focus:ring-2 focus:ring-rose-500 ${
                    selectedIncident?.id === alert.id 
                      ? 'bg-rose-600/10 border-rose-500 text-rose-300' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                  }`}
                  onClick={() => calculateDispatchRoute(alert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      calculateDispatchRoute(alert);
                    }
                  }}
                  aria-label={`Medical incident at ${alert.location}. Click to calculate dispatch path.`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-rose-400 uppercase tracking-wide">Emergency Alert</span>
                    <span className="text-[10px] opacity-60 flex items-center space-x-1">
                      <MapPin size={10} aria-hidden="true" />
                      <span>{alert.location}</span>
                    </span>
                  </div>
                  <p className="opacity-95 leading-tight text-[11px]">{alert.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[9px] text-white/40">{new Date(alert.timestamp || Date.now()).toLocaleTimeString()}</span>
                    <span className="text-[10px] text-indigo-400 font-semibold flex items-center">
                      <span>Dispatch Route</span>
                      <ChevronRight size={12} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Medical Staff Checklist */}
        <Card className="text-xs space-y-3">
          <div className="font-bold text-sm border-b border-white/10 pb-2 flex items-center space-x-1.5">
            <Stethoscope size={16} className="text-rose-400" aria-hidden="true" />
            <span>Medics Instructions</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-white/70 leading-relaxed pl-1">
            <li>Ensure AED kits are checked and active before shifts.</li>
            <li>Maintain clear path access for response stretchers.</li>
            <li>In high heat zones, distribute water pouches and salt tablets.</li>
            <li>Coordinate with gate volunteers for spectator guides.</li>
          </ul>
        </Card>
      </div>

      {/* Column 2: Dispatch Routing Map */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Navigation Info */}
        {selectedIncident && activeDispatchRoute && (
          <Card className="border-rose-500/20 text-white text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <Compass className="text-rose-400 animate-pulse" size={16} aria-hidden="true" />
                <span className="font-bold text-rose-300">Medics Dispatch Route - {selectedIncident.location}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Clock size={12} aria-hidden="true" />
                  <span>{activeDispatchRoute.estimatedTimeMin} min walking</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-mono">
                  AI Routing Confidence: 98%
                </span>
                <Button
                  onClick={() => resolveIncident(selectedIncident.id)}
                  variant="ghost"
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[9px] shadow-neon-emerald"
                  id={`btn-resolve-med-${selectedIncident.id}`}
                >
                  Mark Resolved / Cleared
                </Button>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-white/80 leading-relaxed pl-1 text-[11px]" aria-live="assertive">
              {activeDispatchRoute.directions.map((dir, idx) => (
                <li key={idx}>{dir}</li>
              ))}
            </ol>
          </Card>
        )}

        {/* Stadium Map */}
        <div className="h-[350px] md:h-[450px]">
          <StadiumMap
            heatmapMode={false}
            selectedCategory="medical"
            routeCoordinates={activeDispatchRoute?.coordinates || []}
          />
        </div>
      </div>
    </div>
  );
});

MedicalDashboard.displayName = 'MedicalDashboard';
export default MedicalDashboard;

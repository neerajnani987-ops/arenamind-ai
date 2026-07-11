import React, { useState, useCallback } from 'react';
import { StadiumMap } from '../../components/StadiumMap';
import { apiService } from '../../services/api';
import type { RouteResult, Alert, Gate } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { sanitizeInput } from '../../utils/security';
import { useRealtimeCollection } from '../../firebase/config';
import { 
  Megaphone, 
  Languages, 
  Flame, 
  Compass, 
  AlertTriangle
} from 'lucide-react';

export const OrganizerDashboard: React.FC = React.memo(() => {
  // Announcement states
  const [announcementText, setAnnouncementText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedCards, setTranslatedCards] = useState<any | null>(null);

  // Evacuation states
  const [evacMode, setEvacMode] = useState(false);
  const [evacRoute, setEvacRoute] = useState<RouteResult | null>(null);

  // Load collections
  const { data: gates, updateItem: updateGate } = useRealtimeCollection<Gate>('gates');
  const { data: alerts, addItem: addAlert, updateItem: updateAlert } = useRealtimeCollection<Alert>('alerts');
  const activeAlerts = alerts.filter(a => a.status === 'active');

  const handleGenerateTranslations = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    const sanitizedAnnouncement = sanitizeInput(announcementText);
    setIsTranslating(true);
    try {
      const res = await apiService.translate(sanitizedAnnouncement);
      setTranslatedCards(res.translations);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  }, [announcementText]);

  const triggerEvacuation = useCallback(async () => {
    const isConfirm = window.confirm("WARNING: You are about to activate STADIUM EVACUATION MODE. This will broadcast alerts, flag all displays red, and recalculate all exit pathways. Do you want to proceed?");
    if (!isConfirm) return;

    setEvacMode(true);
    
    // 1. Add emergency alert to db
    addAlert({
      type: 'security',
      severity: 'critical',
      location: 'Stadium-wide',
      description: 'Emergency Evacuation Active. Proceed to the nearest exit immediately.',
      status: 'active'
    });

    // 2. Set all gates status to open for egress
    gates.forEach((gate: any) => {
      updateGate(gate.id, { status: 'open', currentFlow: 999, queueLength: 0 });
    });

    // 3. Request evacuation route path from upper seats to safest exit Gate D
    try {
      const route = await apiService.routing('seat-a120', 'gate-d', 'fastest');
      setEvacRoute(route);
    } catch (e) {
      console.error(e);
    }
  }, [gates, addAlert, updateGate]);

  const cancelEvacuation = useCallback(() => {
    setEvacMode(false);
    setEvacRoute(null);
    alerts.forEach((alert: any) => {
      if (alert.severity === 'critical') {
        updateAlert(alert.id, { status: 'resolved' });
      }
    });
  }, [alerts, updateAlert]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnnouncementText(e.target.value);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Announcement Generator & Incident Logs */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Multilingual Announcement Translation Generator */}
        <Card className="text-white space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <Megaphone className="text-violet-400 animate-pulse-slow" size={18} aria-hidden="true" />
            <h3 className="font-bold text-sm">AI Announcement Generator</h3>
          </div>

          <p className="text-[11px] text-white/60 leading-relaxed font-sans">
            Input an operational update or safety notice to generate instantaneous announcements translated into 5 target regional languages.
          </p>

          <form onSubmit={handleGenerateTranslations} className="space-y-3">
            <label htmlFor="txt-announcement" className="text-[10px] text-white/50 uppercase font-bold block">Announcement Message</label>
            <textarea
              id="txt-announcement"
              value={announcementText}
              onChange={handleTextareaChange}
              placeholder="e.g. Gate A Closed due to density. Proceed to Gate B."
              className="w-full glass-input rounded-lg p-3 text-xs min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              aria-label="Text announcement input field"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isTranslating}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 font-semibold"
              id="btn-generate-announcement"
            >
              <Languages size={14} aria-hidden="true" />
              <span>{isTranslating ? 'Generating...' : 'Translate Announcement'}</span>
            </Button>
          </form>

          {translatedCards && (
            <div className="space-y-2 mt-4 pt-3 border-t border-white/10 max-h-[220px] overflow-y-auto pr-1" aria-live="polite">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Multilingual Output</span>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.5 rounded">Completed</span>
              </div>
              <div className="p-2 bg-white/5 rounded border border-white/5 space-y-2 text-[10px]">
                <div><span className="text-white/40 block text-[8px] font-bold uppercase">English</span>{translatedCards.english}</div>
                <div><span className="text-white/40 block text-[8px] font-bold uppercase">Telugu (తెలుగు)</span>{translatedCards.telugu}</div>
                <div><span className="text-white/40 block text-[8px] font-bold uppercase">Hindi (हिन्दी)</span>{translatedCards.hindi}</div>
                <div><span className="text-white/40 block text-[8px] font-bold uppercase">Tamil (தமிழ்)</span>{translatedCards.tamil}</div>
                <div><span className="text-white/40 block text-[8px] font-bold uppercase">Kannada (ಕನ್ನಡ)</span>{translatedCards.kannada}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Live Incident Logs */}
        <Card className="text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <span className="font-bold text-xs">Active Incidents</span>
            <AlertTriangle className="text-white/40" size={14} aria-hidden="true" />
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1" role="log" aria-live="polite">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-4 text-xs text-white/30">All systems green. No active alarms.</div>
            ) : (
              activeAlerts.map((alert: any) => (
                <div key={alert.id} className="p-2 rounded bg-white/5 border border-white/5 text-[10px] space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-rose-400 capitalize">{alert.type} Incident</span>
                    <span className="opacity-55 text-[8px]">{alert.location}</span>
                  </div>
                  <p className="opacity-80 text-[9px] leading-tight">{alert.description}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Stadium Map & Emergency controls */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Emergency Panel triggers */}
        <div 
          className={`p-5 rounded-xl border transition-all duration-300 ${
            evacMode 
              ? 'bg-rose-950/40 border-rose-500/40 text-white animate-pulse-slow' 
              : 'glass-panel border-white/10 text-white'
          }`}
          role="region"
          aria-label="Emergency Evacuation Command"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Flame className={evacMode ? 'text-rose-500 animate-bounce' : 'text-rose-400'} size={20} aria-hidden="true" />
              <h3 className="font-bold text-sm">Emergency Response System</h3>
            </div>
            
            {evacMode ? (
              <Button
                onClick={cancelEvacuation}
                variant="ghost"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow-neon-emerald"
                id="btn-cancel-evac"
              >
                Clear Evacuation Mode
              </Button>
            ) : (
              <Button
                onClick={triggerEvacuation}
                variant="danger"
                className="px-5 py-2 font-bold uppercase tracking-wider text-xs"
                id="btn-trigger-evac"
              >
                Trigger Evacuation
              </Button>
            )}
          </div>

          <p className="text-xs text-white/70 leading-relaxed mb-4">
            {evacMode 
              ? "CRITICAL: Evacuation Mode ACTIVE. Map outlines safest evacuation exits from seat levels to Gate D (North-West clear zone). Voluntarily broadcasting voice sirens in 5 languages."
              : "Generate automated evacuation plans. Pressing 'Trigger Evacuation' flags displays red, opens all gate arches, and plots path navigation lines on map screens."
            }
          </p>

          {evacMode && evacRoute && (
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-3 text-[11px] space-y-1 text-rose-300" aria-live="assertive">
              <div className="font-bold flex items-center space-x-1.5 mb-1 text-xs">
                <Compass size={14} aria-hidden="true" />
                <span>Safest Evacuation Route Details (Seat to Gate D)</span>
              </div>
              <p>Estimated escape walking time: <strong>{evacRoute.estimatedTimeMin} minutes</strong>.</p>
              <ol className="list-decimal list-inside space-y-1 text-[10px] pl-1 leading-tight opacity-90">
                {evacRoute.directions.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Live Heatmap Map container */}
        <div className="h-[350px] md:h-[450px]">
          <StadiumMap
            heatmapMode={true}
            selectedCategory="all"
            routeCoordinates={evacRoute?.coordinates || []}
          />
        </div>
      </div>
    </div>
  );
});

OrganizerDashboard.displayName = 'OrganizerDashboard';
export default OrganizerDashboard;

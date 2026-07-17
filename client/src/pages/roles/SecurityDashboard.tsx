import React, { useState, useCallback, useMemo } from 'react';
import { useRealtimeCollection } from '../../firebase/config';
import type { Alert } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { sanitizeInput } from '../../utils/security';
import { 
  PlusCircle, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  UserCheck,
  Send
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SecurityDashboard: React.FC = React.memo(() => {
  // Database access
  const { data: alerts, addItem: addAlert, updateItem: updateAlert } = useRealtimeCollection<Alert>('alerts');
  const activeSecurityAlerts = useMemo(() => alerts.filter(a => a.status === 'active'), [alerts]);

  // Form states
  const [incidentType, setIncidentType] = useState<Alert['type']>('security');
  const [severity, setSeverity] = useState<Alert['severity']>('medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock charts timeline data
  const chartData = [
    { name: '14:00', entryRate: 120, riskIndex: 10 },
    { name: '15:00', entryRate: 280, riskIndex: 15 },
    { name: '16:00', entryRate: 490, riskIndex: 20 },
    { name: '17:00', entryRate: 850, riskIndex: 35 },
    { name: '18:00', entryRate: 1450, riskIndex: 65 },
    { name: '19:00', entryRate: 350, riskIndex: 40 },
    { name: '20:00', entryRate: 120, riskIndex: 20 },
    { name: '21:00', entryRate: 200, riskIndex: 30 },
    { name: '22:00', entryRate: 950, riskIndex: 75 }, // egress dispersal
  ];

  const handleSubmitIncident = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) return;

    const sanitizedLocation = sanitizeInput(location);
    const sanitizedDescription = sanitizeInput(description);

    setIsSubmitting(true);
    try {
      addAlert({
        type: incidentType,
        severity,
        location: sanitizedLocation,
        description: sanitizedDescription,
        status: 'active'
      });
      // Clear form
      setLocation('');
      setDescription('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [location, description, incidentType, severity, addAlert]);

  const handleResolveAlert = useCallback((alertId: string) => {
    updateAlert(alertId, { status: 'resolved' });
  }, [updateAlert]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setIncidentType(e.target.value as Alert['type']);
  }, []);

  const handleSeverityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSeverity(e.target.value as Alert['severity']);
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-white">
      
      {/* Column 1: Log Security Incident Form */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/10 pb-3">
            <PlusCircle className="text-rose-400" size={18} aria-hidden="true" />
            <h3 className="font-bold text-sm">Log Security Incident</h3>
          </div>

          <form onSubmit={handleSubmitIncident} className="space-y-4">
            <div>
              <label htmlFor="select-inc-type" className="text-[10px] text-white/50 uppercase font-bold block mb-1">Incident Type</label>
              <select
                id="select-inc-type"
                value={incidentType}
                onChange={handleTypeChange}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              >
                <option className="bg-[#0f172a]" value="security">Security / Breach</option>
                <option className="bg-[#0f172a]" value="medical">Medical Help</option>
                <option className="bg-[#0f172a]" value="crowd">Crowd / Congestion</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-inc-severity" className="text-[10px] text-white/50 uppercase font-bold block mb-1">Severity Level</label>
              <select
                id="select-inc-severity"
                value={severity}
                onChange={handleSeverityChange}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-all"
              >
                <option className="bg-[#0f172a]" value="low">Low (Notice)</option>
                <option className="bg-[#0f172a]" value="medium">Medium (Patrol Needed)</option>
                <option className="bg-[#0f172a]" value="high">High (Deploy Units)</option>
                <option className="bg-[#0f172a]" value="critical">Critical (Evacuation Alert)</option>
              </select>
            </div>

            <Input
              label="Incident Location"
              id="txt-inc-location"
              type="text"
              value={location}
              onChange={handleLocationChange}
              placeholder="e.g. Sector B Gate, Row F Seat 12"
              required
            />

            <div>
              <label htmlFor="txt-inc-desc" className="text-[10px] text-white/50 uppercase font-bold block mb-1">Detailed Description</label>
              <textarea
                id="txt-inc-desc"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe the incident, number of people involved, etc."
                className="w-full glass-input rounded-lg p-3 text-xs min-h-[80px] focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              variant="danger"
              disabled={isSubmitting}
              className="w-full py-2"
              id="btn-submit-incident"
            >
              <Send size={14} aria-hidden="true" />
              <span>{isSubmitting ? 'Logging...' : 'Submit Incident Report'}</span>
            </Button>
          </form>
        </Card>
      </div>

      {/* Column 2: Incident logs and Recharts Flow trends */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Real-time entrance analytics chart */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-rose-400" size={18} aria-hidden="true" />
              <h3 className="font-bold text-sm">Crowd Flow Velocity & Security Risks</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-mono">
                AI Threat Confidence: 96%
              </span>
              <span className="text-[9px] uppercase font-bold text-white/40">Hourly Rates</span>
            </div>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                <YAxis stroke="rgba(255,255,255,0.3)" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <Area type="monotone" dataKey="entryRate" stroke="#6366f1" fillOpacity={1} fill="url(#colorFlow)" name="Flow (Entry/min)" />
                <Area type="monotone" dataKey="riskIndex" stroke="#f43f5e" fillOpacity={1} fill="url(#colorRisk)" name="Risk Index (%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Security Alerts Grid */}
        <Card className="space-y-4">
          <div className="font-bold text-sm border-b border-white/10 pb-2">Active Security Incidents ({activeSecurityAlerts.length})</div>
          
          <div className="space-y-3 max-h-[250px] overflow-y-auto" role="log" aria-live="polite">
            {activeSecurityAlerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40">
                <CheckCircle className="text-emerald-500 mx-auto mb-2" size={24} aria-hidden="true" />
                <span>No active security alarms. Ground status: Normal.</span>
              </div>
            ) : (
              activeSecurityAlerts.map((alert: Alert) => (
                <div key={alert.id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-3">
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={alert.severity === 'critical' ? 'text-rose-400 animate-ping' : 'text-amber-400'} size={14} aria-hidden="true" />
                      <span className="capitalize text-rose-300">{alert.type} - {alert.severity}</span>
                    </div>
                    <span className="text-[10px] text-white/50 flex items-center space-x-1">
                      <MapPin size={12} aria-hidden="true" />
                      <span>{alert.location}</span>
                    </span>
                  </div>
                  <p className="opacity-95 leading-relaxed text-[11px]">{alert.description}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-white/30">Logged: {new Date(alert.timestamp || Date.now()).toLocaleTimeString()}</span>
                    <Button
                      onClick={() => handleResolveAlert(alert.id)}
                      variant="primary"
                      className="px-3 py-1 text-[10px] flex items-center space-x-1"
                      id={`btn-resolve-alert-${alert.id}`}
                    >
                      <UserCheck size={12} aria-hidden="true" />
                      <span>Mark Resolved</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
});

SecurityDashboard.displayName = 'SecurityDashboard';
export default SecurityDashboard;

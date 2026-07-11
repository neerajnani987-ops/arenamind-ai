import React, { useState, useCallback } from 'react';
import { StadiumMap } from '../../components/StadiumMap';
import { QRScanner } from '../../components/QRScanner';
import { apiService } from '../../services/api';
import type { RouteResult, Facility } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { sanitizeInput } from '../../utils/security';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Utensils, 
  Accessibility, 
  Navigation,
  Clock
} from 'lucide-react';
import { useRealtimeCollection } from '../../firebase/config';

export const SpectatorDashboard: React.FC = React.memo(() => {
  const [chatLanguage, setChatLanguage] = useState('english');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: "Hello! I am your ArenaMind AI Assistant. Scan your ticket or ask me: 'Take me to Seat A-120', 'Where is the nearest food court?', or select a map marker to navigate." }
  ]);
  
  const [mapCategory, setMapCategory] = useState<'all' | 'restroom' | 'food_court' | 'gate'>('all');
  const [searchSeat, setSearchSeat] = useState('');
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [mapHeatmap, setMapHeatmap] = useState(false);

  const { data: facilities } = useRealtimeCollection<Facility>('facilities');
  const foodCourts = facilities.filter(f => f.type === 'food_court');

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const sanitizedMsg = sanitizeInput(chatInput);
    setChatHistory(prev => [...prev, { sender: 'user', text: sanitizedMsg }]);
    setChatInput('');

    try {
      const res = await apiService.chat(sanitizedMsg, chatLanguage, 'spectator');
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.response }]);
    } catch {
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Error contacting assistant.' }]);
    }
  }, [chatInput, chatLanguage]);

  const handleSeatSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSeat.trim()) return;

    const sanitizedSeat = sanitizeInput(searchSeat);
    const targetNode = sanitizedSeat.toLowerCase().replace(' ', '') === 'a120' || sanitizedSeat.toLowerCase() === 'seat-a120' ? 'seat-a120' : sanitizedSeat;
    try {
      // Find route from Gate A to seat
      const route = await apiService.routing('gate-a', targetNode, 'fastest');
      setActiveRoute(route);
    } catch (err) {
      console.error(err);
    }
  }, [searchSeat]);

  const handleScanSuccess = useCallback((decoded: any) => {
    setActiveRoute(decoded.routeDetails);
    setChatHistory(prev => [
      ...prev,
      { sender: 'ai', text: `Welcome ${decoded.holderName}! Your ticket is verified. Seat: ${decoded.seat} (${decoded.tier}). Standard gate entry is ${decoded.gate === 'gate-a' ? 'Gate A' : 'Gate E'}. I have plotted your walking path on the map.` }
    ]);
  }, []);

  const setTargetFromMap = useCallback(async (markerName: string) => {
    let start = 'gate-a';
    let end = 'restroom-n';

    if (markerName.includes('Bazaar')) {
      end = 'food-bazaar';
    } else if (markerName.includes('Cafe')) {
      end = 'cafe-express';
    } else if (markerName.includes('Restroom East')) {
      end = 'restroom-e';
    } else if (markerName.includes('Gate B')) {
      start = 'gate-b';
      end = 'seat-a120';
    }

    try {
      const route = await apiService.routing(start, end, 'fastest');
      setActiveRoute(route);
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: `Plotted route from ${start === 'gate-a' ? 'Gate A' : 'Gate B'} to ${markerName}. Estimated walking time: ${route.estimatedTimeMin} min.` }
      ]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLangChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setChatLanguage(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchSeat(e.target.value);
  }, []);

  const handleChatChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1: AI Chatbot Assistant & Concessions logs */}
      <div className="lg:col-span-1 space-y-6 flex flex-col justify-between">
        
        {/* Multilingual AI Chat */}
        <Card className="flex flex-col h-[400px] text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="text-indigo-400" size={18} aria-hidden="true" />
              <h3 className="font-bold text-sm">Multilingual Assistant</h3>
            </div>
            
            {/* Language Selector */}
            <select
              value={chatLanguage}
              onChange={handleLangChange}
              className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-indigo-300 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="chat-lang-selector"
              aria-label="Select Chat Language"
            >
              <option className="bg-[#0f172a]" value="english">English</option>
              <option className="bg-[#0f172a]" value="hindi">Hindi</option>
              <option className="bg-[#0f172a]" value="telugu">Telugu</option>
              <option className="bg-[#0f172a]" value="tamil">Tamil</option>
              <option className="bg-[#0f172a]" value="kannada">Kannada</option>
            </select>
          </div>

          {/* Messages Scrollbox */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs" role="log" aria-live="polite">
            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                  chat.sender === 'user'
                    ? 'ml-auto bg-indigo-600 text-white'
                    : 'bg-white/5 border border-white/5 text-white/90'
                }`}
              >
                {chat.text}
              </div>
            ))}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={handleChatChange}
              placeholder={`Ask in ${chatLanguage}...`}
              className="flex-1 glass-input rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              id="txt-chat-input"
              aria-label="Voice or text message input"
            />
            <Button
              type="submit"
              variant="primary"
              className="p-2 rounded-lg"
              id="btn-send-chat"
              aria-label="Send message"
            >
              <Send size={14} aria-hidden="true" />
            </Button>
          </form>
        </Card>

        {/* Local facilities table */}
        <Card className="text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <span className="font-bold text-xs">Food Court Queues</span>
            <Utensils size={14} className="text-white/40" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            {foodCourts.map((court: any) => (
              <div key={court.id} className="flex items-center justify-between text-[11px] p-2 bg-white/5 rounded-lg border border-white/5">
                <div>
                  <span className="font-semibold block">{court.name}</span>
                  <span className="text-[9px] text-white/40">{court.location}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${court.waitTime > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {court.waitTime} min wait
                  </span>
                  <span className="text-[8px] text-white/30 capitalize">{court.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Column 2: Indoor Map Routing & Directions */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Map Header Controls */}
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 text-white text-xs">
          
          {/* Seat Search */}
          <form onSubmit={handleSeatSearch} className="flex items-center space-x-2 w-full sm:w-auto">
            <Search size={14} className="text-white/40" aria-hidden="true" />
            <input
              type="text"
              value={searchSeat}
              onChange={handleSearchChange}
              placeholder="Enter seat (e.g. A-120)"
              className="bg-transparent border-none focus:outline-none text-xs w-40 placeholder:text-white/30 outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
              id="txt-seat-search"
              aria-label="Search seat coordinate path"
            />
            <Button type="submit" variant="primary" className="px-2.5 py-1 rounded" id="btn-seat-search">
              Find Seat
            </Button>
          </form>

          {/* Map Filters */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setMapCategory('all')}
              variant={mapCategory === 'all' ? 'primary' : 'secondary'}
              className="px-2.5 py-1 rounded"
            >
              All Pins
            </Button>
            <Button
              onClick={() => setMapCategory('restroom')}
              variant={mapCategory === 'restroom' ? 'primary' : 'secondary'}
              className="px-2.5 py-1 rounded"
            >
              Restrooms
            </Button>
            <Button
              onClick={() => setMapCategory('food_court')}
              variant={mapCategory === 'food_court' ? 'primary' : 'secondary'}
              className="px-2.5 py-1 rounded"
            >
              Food
            </Button>
            <Button
              onClick={() => setMapHeatmap(!mapHeatmap)}
              variant={mapHeatmap ? 'danger' : 'secondary'}
              className="px-2.5 py-1 rounded"
              id="btn-heatmap-toggle"
            >
              Heatmap
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[350px] md:h-[450px]">
          <StadiumMap
            heatmapMode={mapHeatmap}
            selectedCategory={mapCategory}
            routeCoordinates={activeRoute?.coordinates || []}
            onMarkerClick={setTargetFromMap}
          />
        </div>

        {/* Dynamic Route Directions Panel */}
        {activeRoute && (
          <Card className="border-indigo-500/20 text-white text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <Navigation className="text-indigo-400 animate-pulse" size={16} aria-hidden="true" />
                <span className="font-bold text-indigo-300">Route Directions</span>
              </div>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Clock size={12} aria-hidden="true" />
                  <span>{activeRoute.estimatedTimeMin} mins</span>
                </span>
                {activeRoute.wheelchair && (
                  <span className="flex items-center space-x-1 text-indigo-400">
                    <Accessibility size={12} aria-hidden="true" />
                    <span>Wheelchair Accessible</span>
                  </span>
                )}
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-white/80 leading-relaxed pl-1 text-[11px]">
              {activeRoute.directions.map((dir, idx) => (
                <li key={idx}>{dir}</li>
              ))}
            </ol>
          </Card>
        )}

        {/* QR scan simulator overlay */}
        <QRScanner onScanSuccess={handleScanSuccess} />
      </div>
    </div>
  );
});

SpectatorDashboard.displayName = 'SpectatorDashboard';
export default SpectatorDashboard;

import React, { useState, useCallback } from 'react';
import { QrCode, CheckCircle, Navigation } from 'lucide-react';
import type { Ticket } from '../types';
import { mockTickets } from '../utils/constants';

interface QRScannerProps {
  onScanSuccess: (data: Ticket) => void;
}

export const QRScanner: React.FC<QRScannerProps> = React.memo(({ onScanSuccess }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const triggerScan = useCallback((ticketIndex: number) => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate scanning delay
    setTimeout(() => {
      setIsScanning(false);
      const ticket = mockTickets[ticketIndex];
      setScanResult(ticket);
      onScanSuccess({
        ticketId: ticket.ticketId,
        holderName: ticket.holderName,
        seat: ticket.seat,
        tier: ticket.tier,
        gate: ticket.gate,
        parkingZone: ticket.parkingZone,
        routeDetails: ticket.routeDetails
      });
    }, 1500);
  }, [onScanSuccess]);

  return (
    <div className="glass-panel p-6 rounded-xl border border-white/10 text-white flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center space-x-2 mb-4 border-b border-white/10 pb-3">
          <QrCode className="text-indigo-400" size={22} aria-hidden="true" />
          <h3 className="font-bold text-base">QR Ticket Scanner Simulator</h3>
        </div>

        <p className="text-xs text-white/70 mb-5 leading-relaxed">
          Simulate standard stadium entry gates scanning digital tickets. Scan to decode seat location, match nearest gate/parking zones, and automatically route.
        </p>

        {/* Viewfinder Emulator */}
        <div 
          className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/20 flex items-center justify-center mb-5 shadow-inner"
          role="region" 
          aria-label="Scanner Viewfinder Screen"
        >
          {isScanning && (
            <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-neon-emerald animate-bounce top-0" style={{ animationDuration: '2.5s' }}></div>
          )}

          {isScanning ? (
            <div className="text-center text-xs space-y-2">
              <div className="w-10 h-10 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin mx-auto mb-2"></div>
              <span className="text-indigo-300 font-semibold uppercase tracking-wider animate-pulse text-[10px]" aria-live="polite">Decoding Ticket QR...</span>
            </div>
          ) : scanResult ? (
            <div className="text-center p-4" aria-live="polite">
              <CheckCircle className="text-emerald-500 mx-auto mb-2" size={40} />
              <div className="text-sm font-semibold text-white">{scanResult.seat}</div>
              <div className="text-[10px] text-white/50">{scanResult.ticketId}</div>
            </div>
          ) : (
            <div className="text-center text-white/40 p-4 space-y-2">
              <QrCode size={48} className="mx-auto text-white/20 animate-pulse-slow" aria-hidden="true" />
              <span className="text-[10px] uppercase font-bold tracking-wider block">Scanner Camera Standby</span>
            </div>
          )}

          {/* Border Viewfinder Corners */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></div>
        </div>

        {/* Action triggers */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => triggerScan(0)}
            disabled={isScanning}
            className="py-2 px-3 rounded-lg text-[10px] sm:text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-transparent transition-all disabled:opacity-50 outline-none focus:ring-2 focus:ring-indigo-500"
            id="btn-scan-tkt1"
            aria-label="Scan Mock Spectator Ticket A-120"
          >
            Scan Spectator Ticket
          </button>
          <button
            onClick={() => triggerScan(1)}
            disabled={isScanning}
            className="py-2 px-3 rounded-lg text-[10px] sm:text-xs font-semibold bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/20 hover:border-transparent transition-all disabled:opacity-50 outline-none focus:ring-2 focus:ring-violet-500"
            id="btn-scan-tkt2"
            aria-label="Scan Mock Organizer VIP Ticket"
          >
            Scan Organizer Ticket
          </button>
        </div>
      </div>

      {/* Result Cards */}
      {scanResult && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs space-y-2" aria-live="polite">
          <div className="flex items-center justify-between font-bold text-indigo-300 border-b border-white/5 pb-1">
            <span>Ticket Details Decoded</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Scan Match OK</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-white/90">
            <div><span className="text-white/40 block text-[9px] uppercase">Spectator Name</span>{scanResult.holderName}</div>
            <div><span className="text-white/40 block text-[9px] uppercase">Assigned Seat</span>{scanResult.seat}</div>
            <div><span className="text-white/40 block text-[9px] uppercase">Suggested Entry</span>{scanResult.gateName}</div>
            <div><span className="text-white/40 block text-[9px] uppercase">Recommended Parking</span>{scanResult.parkingZone}</div>
          </div>
          
          <div className="bg-indigo-950/40 p-2 rounded border border-indigo-500/20 text-[10px] leading-relaxed flex items-start space-x-2 mt-2">
            <Navigation className="text-indigo-400 shrink-0 mt-0.5" size={12} aria-hidden="true" />
            <div>
              <span className="font-semibold text-indigo-300 block mb-0.5">Route mapping updated!</span>
              The map has loaded your navigation coordinates from {scanResult.gateName} to {scanResult.seat}.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

QRScanner.displayName = 'QRScanner';
export default QRScanner;

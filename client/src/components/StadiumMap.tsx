import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StadiumMapProps {
  heatmapMode?: boolean;
  selectedCategory?: 'all' | 'restroom' | 'food_court' | 'gate' | 'medical' | 'security';
  routeCoordinates?: [number, number][];
  onMarkerClick?: (name: string) => void;
}

// Stadium Center
const center: [number, number] = [12.9778, 77.5912];

// Map markers database
const mapPoints = [
  { name: 'Gate A (North)', type: 'gate', coords: [12.9780, 77.5910], details: 'Wait time: 4m. Status: Active.', crowdLevel: 'low' },
  { name: 'Gate B (East)', type: 'gate', coords: [12.9785, 77.5925], details: 'Wait time: 22m. Status: Heavy Congestion.', crowdLevel: 'high' },
  { name: 'Gate C (South)', type: 'gate', coords: [12.9770, 77.5920], details: 'Wait time: 2m. Status: Restricted.', crowdLevel: 'low' },
  { name: 'Gate D (West)', type: 'gate', coords: [12.9775, 77.5900], details: 'Wait time: 3m. Status: Active.', crowdLevel: 'medium' },
  { name: 'Parking Zone A', type: 'security', coords: [12.9800, 77.5905], details: 'Capacity: 86%. Security patrolling.', crowdLevel: 'high' },
  { name: 'Parking Zone B', type: 'security', coords: [12.9795, 77.5935], details: 'Capacity: 50%. Clean flow.', crowdLevel: 'medium' },
  { name: 'Restroom North (Tier 1)', type: 'restroom', coords: [12.9781, 77.5908], details: 'Cleaning status: Clean. Wait time: 2m.', crowdLevel: 'low' },
  { name: 'Restroom East (Tier 2)', type: 'restroom', coords: [12.9783, 77.5922], details: 'Cleaning status: Cleaning in progress.', crowdLevel: 'high' },
  { name: 'Grand Food Bazaar (West)', type: 'food_court', coords: [12.9774, 77.5902], details: 'Wait time: 18m. 4 stalls open.', crowdLevel: 'high' },
  { name: 'Arena Express Cafe (East)', type: 'food_court', coords: [12.9780, 77.5926], details: 'Wait time: 4m. Snack items.', crowdLevel: 'low' },
  { name: 'Medical Station Alpha', type: 'medical', coords: [12.9777, 77.5916], details: 'Staffed by Medical Team A. Fully stocked.', crowdLevel: 'low' },
  { name: 'Security Post Echo', type: 'security', coords: [12.9773, 77.5909], details: 'Crowd management surveillance active.', crowdLevel: 'medium' },
];

export const StadiumMap: React.FC<StadiumMapProps> = ({
  heatmapMode = false,
  selectedCategory = 'all',
  routeCoordinates = [],
  onMarkerClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const routePolyline = useRef<L.Polyline | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const heatmapLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Fix default marker icon issues in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize Map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    // Add Dark Mode/Light Mode Tile Layer
    const isDark = document.body.classList.contains('dark') || !document.body.classList.contains('light');
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 20,
    }).addTo(map);

    // Add stadium visual boundary outline
    L.circle(center, {
      color: '#4f46e5',
      fillColor: '#818cf8',
      fillOpacity: 0.1,
      radius: 180
    }).addTo(map);

    // Initialize Layer Groups
    markersLayer.current = L.layerGroup().addTo(map);
    heatmapLayer.current = L.layerGroup().addTo(map);
    leafletMap.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update theme of map tiles when DOM class changes
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    const observer = new MutationObserver(() => {
      const isDark = document.body.classList.contains('dark') || !document.body.classList.contains('light');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      // Find and replace tile layers
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl(tileUrl);
        }
      });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Redraw markers and heatmaps
  useEffect(() => {
    const map = leafletMap.current;
    const mLayer = markersLayer.current;
    const hLayer = heatmapLayer.current;
    if (!map || !mLayer || !hLayer) return;

    mLayer.clearLayers();
    hLayer.clearLayers();

    // 1. Draw Heatmaps if enabled
    if (heatmapMode) {
      mapPoints.forEach((point) => {
        let color = '#10b981'; // Green
        let opacity = 0.2;
        if (point.crowdLevel === 'high') {
          color = '#f43f5e'; // Red
          opacity = 0.55;
        } else if (point.crowdLevel === 'medium') {
          color = '#f59e0b'; // Amber
          opacity = 0.4;
        }

        L.circle(point.coords as [number, number], {
          color: 'transparent',
          fillColor: color,
          fillOpacity: opacity,
          radius: 28
        }).addTo(hLayer);
      });
    }

    // 2. Draw Pins / Custom Markers
    mapPoints.forEach((point) => {
      if (selectedCategory !== 'all' && point.type !== selectedCategory) {
        return; // Filtered out
      }

      // Choose appropriate icon color/style
      let iconColorClass = 'marker-pulse-emerald';
      if (point.crowdLevel === 'high') iconColorClass = 'marker-pulse-rose';
      else if (point.crowdLevel === 'medium') iconColorClass = 'bg-amber-500 border border-white';

      const customIcon = L.divIcon({
        className: `w-4 h-4 rounded-full shadow-lg ${iconColorClass}`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker(point.coords as [number, number], { icon: customIcon });
      
      const popupHtml = `
        <div class="p-2 max-w-xs text-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-indigo-400 text-base">${point.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
              point.type === 'gate' ? 'bg-indigo-500/20 text-indigo-300' :
              point.type === 'food_court' ? 'bg-amber-500/20 text-amber-300' :
              point.type === 'restroom' ? 'bg-emerald-500/20 text-emerald-300' :
              'bg-rose-500/20 text-rose-300'
            }">${point.type}</span>
          </div>
          <p class="text-xs opacity-90 leading-relaxed mb-2">${point.details}</p>
          <button id="btn-popup-${point.name.replace(/\s+/g, '-')}" class="w-full text-center py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-all">
            Set as Navigation Target
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(mLayer);

      marker.on('popupopen', () => {
        const button = document.getElementById(`btn-popup-${point.name.replace(/\s+/g, '-')}`);
        if (button && onMarkerClick) {
          button.addEventListener('click', () => {
            onMarkerClick(point.name);
            marker.closePopup();
          });
        }
      });
    });
  }, [heatmapMode, selectedCategory, onMarkerClick]);

  // Handle Route Polylines
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    if (routePolyline.current) {
      map.removeLayer(routePolyline.current);
      routePolyline.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      const poly = L.polyline(routeCoordinates, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.9,
        dashArray: '8, 12',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Fit map bounds to show route
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [40, 40] });
      
      routePolyline.current = poly;
    }
  }, [routeCoordinates]);

  return (
    <div 
      className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl bg-[#0f172a] border border-white/5 dark:border-white/5 light:border-black/5"
      role="application"
      aria-label="Interactive Stadium Map"
    >
      <div ref={mapRef} className="w-full h-full min-h-[350px] md:min-h-[450px]" />
      
      {/* Controls Overlay Legend */}
      <div 
        className="absolute bottom-3 left-3 z-[1000] p-3 rounded-lg glass-panel text-xs space-y-1.5"
        role="region"
        aria-label="Stadium Map Legend"
      >
        <div className="font-semibold text-indigo-400 mb-1 border-b border-white/10 pb-1">Stadium Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full marker-pulse-emerald inline-block" aria-hidden="true"></span>
          <span><span className="sr-only">Green marker indicates </span>Normal / Low Crowds</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full marker-pulse-rose inline-block" aria-hidden="true"></span>
          <span><span className="sr-only">Red marker indicates </span>High Congestion / Alert</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" aria-hidden="true"></span>
          <span><span className="sr-only">Amber marker indicates </span>Medium Density</span>
        </div>
        {routeCoordinates.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="w-4 h-0 border-t-2 border-dashed border-[#6366f1] inline-block" aria-hidden="true"></span>
            <span><span className="sr-only">Dashed blue line indicates </span>Active Navigation Route</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default StadiumMap;

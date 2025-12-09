// src/components/map/StopMarker.jsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Info } from 'lucide-react';
import { isValidCoordinate } from '../../utils/mapUtils';

// Helper to define marker icons based on stop type
const createIcon = (stop) => {
  const type = stop.type?.toLowerCase();
  const vehicles = stop.allowed_vehicles || [];
  let color = "#3b82f6";
  let innerHTML = "📍";

  // Logic copied from MapCanvas
  if (type === "terminal") {
    if (vehicles.includes("tricycle")) { color = "#16a34a"; innerHTML = "🛺"; }
    else if (vehicles.includes("jeep")) { color = "#7c3aed"; innerHTML = "🚙"; }
    else if (vehicles.includes("bus")) { color = "#1e40af"; innerHTML = "🚌"; }
    else { color = "#eab308"; innerHTML = "🏁"; }
  }

  return L.divIcon({
    className: "custom-terminal-marker",
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">${innerHTML}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const StopMarker = ({ stop, onViewDetails, onMarkerClick }) => {
    if (!isValidCoordinate(stop.lat, stop.lng)) {
        return null;
    }

    return (
        <Marker 
            position={[stop.lat, stop.lng]} 
            icon={createIcon(stop)} 
            eventHandlers={{ click: () => onMarkerClick(stop.id) }}
        >
            <Popup className="custom-popup">
                <div className="p-1 min-w-[160px]">
                    <h3 className="font-bold text-gray-800 m-0 text-sm">{stop.name}</h3>
                    <button 
                        className="w-full bg-white border border-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-semibold shadow-sm mt-2" 
                        onClick={() => onViewDetails(stop)}
                    >
                        <Info size={14} className="text-blue-600" /> View Details
                    </button>
                </div>
            </Popup>
        </Marker>
    );
};

export default StopMarker;
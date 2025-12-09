import React, { useState } from "react";
import { Search, MapPin, X, Map as MapIcon, Bus, Navigation, ArrowRight } from "lucide-react";
import { useRouteContext } from "../../contexts/RouteContext";

const TopSearchBar = ({ onRouteCalculated, onChooseOnMapMode, onLocationSelect }) => {
  const { graphRef } = useRouteContext();
  
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  
  const [originObj, setOriginObj] = useState(null);
  const [destObj, setDestObj] = useState(null);
  
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  // --- INTERNAL SEARCH LOGIC ---
  const handleInput = (value, field) => {
    if (field === "origin") setOrigin(value);
    else setDestination(value);
    
    setActiveField(field);

    if (value.length > 0 && graphRef.current && graphRef.current.stops) {
      const termLower = value.toLowerCase();
      const results = [];
      
      graphRef.current.stops.forEach((stop) => {
        if (stop.name.toLowerCase().includes(termLower) || stop.type?.toLowerCase().includes(termLower)) {
          results.push({
            id: stop.id,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            type: stop.type,
            details: stop.type ? stop.type.replace('_', ' ') : "Transport Terminal"
          });
        }
      });
      setSuggestions(results.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const selectLocation = (item) => {
    const locationObj = {
      lat: item.lat,
      lng: item.lng,
      name: item.name,
      id: item.id
    };

    if (activeField === "origin") {
      setOrigin(item.name);
      setOriginObj(locationObj);
    } else {
      setDestination(item.name);
      setDestObj(locationObj);
    }

    if (onLocationSelect) {
      onLocationSelect(activeField, locationObj);
    }
    
    setSuggestions([]);
    setActiveField(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!originObj || !destObj) {
      alert("Please select a valid Origin and Destination from the list.");
      return;
    }
    // Triggers Home.jsx's handleRouteCalculation with selected objects
    onRouteCalculated({ origin: originObj, destination: destObj });
  };

  const handleChooseOnMap = () => {
    onChooseOnMapMode(activeField || "destination");
    setActiveField(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden pointer-events-auto w-full max-w-md mx-auto transition-all">
      
      {/* 1. INPUT AREA (Always Visible) */}
      <div className="p-3">
        <form onSubmit={handleSubmit} className="flex gap-3 relative">
          
          {/* Connector Line */}
          <div className="flex flex-col items-center pt-3 gap-1 absolute left-3 top-0 h-full pointer-events-none">
             <div className="w-3 h-3 rounded-full border-[3px] border-blue-500 bg-white shadow-sm"></div>
             <div className="w-0.5 h-10 bg-gray-200 border-l border-dotted border-gray-400"></div>
             <MapPin size={16} className="text-red-500 fill-red-50" />
          </div>

          <div className="flex-1 flex flex-col gap-2 pl-8">
            {/* Origin */}
            <div className="relative group">
              <input
                className={`w-full bg-gray-50 text-sm font-medium py-2.5 px-3 rounded-lg outline-none border border-transparent focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400`}
                placeholder="Current Location"
                value={origin}
                onChange={(e) => handleInput(e.target.value, "origin")}
                onFocus={() => {
                   setActiveField("origin");
                   if(origin) handleInput(origin, "origin"); 
                }}
              />
              {origin && (
                <button
                  type="button"
                  onClick={() => { setOrigin(""); setOriginObj(null); if(onLocationSelect) onLocationSelect('origin', null); }}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Destination */}
            <div className="relative group">
              <input
                className={`w-full bg-gray-50 text-sm font-medium py-2.5 px-3 rounded-lg outline-none border border-transparent focus:bg-white focus:border-red-500 transition-all placeholder:text-gray-400`}
                placeholder="Destination"
                value={destination}
                onChange={(e) => handleInput(e.target.value, "destination")}
                onFocus={() => {
                    setActiveField("destination");
                    if(destination) handleInput(destination, "destination");
                }}
              />
              {destination && (
                <button
                  type="button"
                  onClick={() => { setDestination(""); setDestObj(null); if(onLocationSelect) onLocationSelect('destination', null); }}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* Search Button (Only enabled when both are valid) */}
          {originObj && destObj && (
             <button 
                type="submit"
                className="self-center p-3 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
             >
                <Search size={20} />
             </button>
          )}
        </form>
      </div>

      {/* 2. DROPDOWN SUGGESTIONS (Only when focused) */}
      {activeField && (
        <div className="border-t border-gray-100 max-h-[60vh] overflow-y-auto animate-in slide-in-from-top-2">
            {/* Map Option (Choose on Map) */}
            <div
                onClick={handleChooseOnMap}
                className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer active:bg-blue-100 border-b border-gray-50"
            >
                <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                    <MapIcon size={18} />
                </div>
                <div>
                    <div className="text-sm font-semibold text-blue-700">Choose on Map</div>
                    <div className="text-xs text-blue-500">Tap location manually</div>
                </div>
            </div>

            {/* List Results */}
            {suggestions.map((item) => (
                <div
                key={item.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50"
                onClick={() => selectLocation(item)}
                >
                <div className="bg-emerald-50 p-2.5 rounded-full text-emerald-600">
                    <Bus size={18} />
                </div>
                <div>
                    <div className="text-sm font-semibold text-gray-800">{item.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{item.details}</div>
                </div>
                </div>
            ))}

            {/* Empty State */}
            {suggestions.length === 0 && (origin || destination) && (
                <div className="p-4 text-center text-gray-400 text-xs">
                    No matching terminals found.
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default TopSearchBar;
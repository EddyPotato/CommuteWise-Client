import React, { useState } from "react";
import {
  Search,
  MapPin,
  ArrowLeftRight,
  X,
  ChevronLeft,
  Loader2,
  Star,
  Clock,
  Map as MapIcon,
} from "lucide-react";

const TopSearchBar = ({ onRouteCalculated, onChooseOnMapMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- SEARCH API ---
  const handleInput = async (value, field) => {
    if (field === "origin") setOrigin(value);
    else setDestination(value);
    setActiveField(field);

    if (value.length > 2) {
      setLoading(true);
      try {
        // Updated URL with specific params to avoid blocks
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          value
        )}&format=json&addressdetails=1&limit=5&countrycodes=ph`;

        const res = await fetch(url);

        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.warn("Geocoding API unavailable, using fallback mode.");
        // Fallback for demo purposes if API is blocked
        setSuggestions(
          [
            {
              lat: 14.6515,
              lon: 121.0493,
              display_name: "Quezon City Circle (Demo)",
              type: "park",
            },
            {
              lat: 14.676,
              lon: 121.0437,
              display_name: "SM North EDSA (Demo)",
              type: "mall",
            },
            {
              lat: 14.7011,
              lon: 121.0328,
              display_name: "Sauyo Market (Demo)",
              type: "market",
            },
          ].filter((i) =>
            i.display_name.toLowerCase().includes(value.toLowerCase())
          )
        );
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectLocation = (item) => {
    const coords = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name.split(",")[0],
      fullAddress: item.display_name,
    };

    if (activeField === "origin") {
      setOrigin(coords.name);
      setOriginCoords(coords);
    } else {
      setDestination(coords.name);
      setDestCoords(coords);
    }
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!originCoords || !destCoords) {
      alert("Please select locations from the suggestions list.");
      return;
    }
    setIsExpanded(false);
    onRouteCalculated({ origin: originCoords, destination: destCoords });
  };

  const handleChooseOnMap = () => {
    setIsExpanded(false);
    onChooseOnMapMode(activeField || "destination");
  };

  // --- RENDER ---
  if (!isExpanded) {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-4 w-full max-w-md mx-auto pointer-events-auto flex items-center gap-3 border border-gray-100 cursor-text"
        onClick={() => {
          setIsExpanded(true);
          setActiveField("origin");
        }}
      >
        <div className="bg-gray-100 p-2 rounded-full">
          <Search size={20} className="text-gray-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">Where to?</div>
          <div className="text-xs text-gray-400 truncate">
            {destination || "Search destinations, terminals..."}
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-2 rounded-full shadow-sm">
          <ArrowLeftRight size={16} className="text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in fade-in duration-200">
      <div className="p-4 border-b border-gray-100 shadow-sm bg-white">
        <div className="flex gap-3 mb-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold text-gray-800 pt-1">
            Plan your route
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <div className="flex flex-col items-center gap-1 mt-2.5">
            <div className="w-4 h-4 rounded-full border-[3px] border-blue-500"></div>
            <div className="w-0.5 h-8 bg-gray-300 border-l border-dotted border-gray-400"></div>
            <MapPin size={20} className="text-red-500 fill-red-50" />
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="relative">
              <input
                className={`w-full bg-gray-50 p-3 rounded-lg text-sm font-medium outline-none border ${
                  activeField === "origin"
                    ? "border-blue-500 bg-white"
                    : "border-transparent"
                }`}
                placeholder="Your Location"
                value={origin}
                onChange={(e) => handleInput(e.target.value, "origin")}
                onFocus={() => setActiveField("origin")}
                autoFocus
              />
              {origin && (
                <button
                  type="button"
                  onClick={() => {
                    setOrigin("");
                    setOriginCoords(null);
                  }}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="relative">
              <input
                className={`w-full bg-gray-50 p-3 rounded-lg text-sm font-medium outline-none border ${
                  activeField === "destination"
                    ? "border-red-500 bg-white"
                    : "border-transparent"
                }`}
                placeholder="Choose destination"
                value={destination}
                onChange={(e) => handleInput(e.target.value, "destination")}
                onFocus={() => setActiveField("destination")}
              />
              {destination && (
                <button
                  type="button"
                  onClick={() => {
                    setDestination("");
                    setDestCoords(null);
                  }}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {suggestions.length > 0 ? (
          <div className="py-2">
            {loading && (
              <div className="p-4 text-center text-gray-400 flex justify-center gap-2">
                <Loader2 className="animate-spin" /> Searching map...
              </div>
            )}
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                onClick={() => selectLocation(item)}
              >
                <div className="bg-gray-100 p-2 rounded-full">
                  <MapPin size={20} className="text-gray-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {item.display_name.split(",")[0]}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-[250px]">
                    {item.display_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2">
            <div
              onClick={handleChooseOnMap}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer rounded-lg"
            >
              <div className="bg-blue-50 p-2 rounded-full">
                <MapIcon size={20} className="text-blue-600" />
              </div>
              <div className="font-medium text-gray-700">Choose on map</div>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2 mt-2 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Home
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                  <Star size={16} className="text-gray-400" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  Work
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {origin && destination && !loading && (
        <div className="p-4 border-t border-gray-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg"
          >
            Search Routes
          </button>
        </div>
      )}
    </div>
  );
};

export default TopSearchBar;

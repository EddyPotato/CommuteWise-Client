import React, { useState } from "react";
import { Search, MapPin, MoreVertical, ArrowLeftRight } from "lucide-react";

const TopSearchBar = ({ onRouteCalculated }) => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  // Placeholder function for when user submits a search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!origin || !destination) return;

    // In a real app, this would query the graph/DB
    console.log(`Searching route from ${origin} to ${destination}...`);

    // Simulating a found route object to trigger the "Routing" state in Home.jsx
    onRouteCalculated({
      name: `Route to ${destination}`,
      eta: 18,
      fare: 25,
      distance: 3.2,
      polyline: null, // This would be the GeoJSON path
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 w-full max-w-md mx-auto pointer-events-auto">
      <form onSubmit={handleSearch} className="flex gap-3 items-center">
        {/* Left Icons (Decorators) */}
        <div className="flex flex-col items-center gap-1 mt-1">
          <div className="w-4 h-4 rounded-full border-4 border-blue-500"></div>
          <div className="w-1 h-8 bg-gray-200 border-l border-dashed border-gray-400"></div>
          <MapPin size={20} className="text-red-500" />
        </div>

        {/* Inputs */}
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Your Location"
            className="w-full text-sm font-medium text-gray-700 placeholder-gray-400 outline-none bg-transparent border-b border-gray-100 pb-1"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <input
            type="text"
            placeholder="Choose destination..."
            className="w-full text-sm font-medium text-gray-900 placeholder-gray-500 outline-none bg-transparent"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        {/* Action Button (Switch) */}
        <button
          type="button"
          className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500"
          onClick={() => {
            const temp = origin;
            setOrigin(destination);
            setDestination(temp);
          }}
        >
          <ArrowLeftRight size={18} className="rotate-90" />
        </button>
      </form>
    </div>
  );
};

export default TopSearchBar;

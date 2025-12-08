import { useState } from "react";
import { Clock, Ticket, Navigation } from "lucide-react";

const RouteSheet = ({ route }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine height class based on state
  const heightClass = isExpanded ? "h-[80vh]" : "h-[35vh]";

  return (
    <div
      className={`bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] w-full transition-all duration-300 ease-in-out flex flex-col ${heightClass}`}
    >
      {/* Drag Handle / Header */}
      <div
        className="w-full p-2 flex justify-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      {/* Route Summary (Always Visible) */}
      <div className="px-5 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-gray-800">
            {route?.name || "Recommended Route"}
          </h2>
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
            FASTEST
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-red-500" />
            <span className="font-semibold text-gray-900">
              {route?.eta || 15} min
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Ticket size={16} className="text-blue-500" />
            <span className="font-semibold text-gray-900">
              ₱{route?.fare || 20}
            </span>
          </div>
          <div className="text-gray-400">({route?.distance || 1.2} km)</div>
        </div>
      </div>

      {/* Detailed Steps (Visible on Scroll/Expand) */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {/* Step 1: Walk */}
        <div className="flex gap-4 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Navigation size={16} className="text-gray-600" />
            </div>
            <div className="w-0.5 h-full bg-gray-200 my-1"></div>
          </div>
          <div>
            <p className="font-medium text-gray-800">Walk to Terminal</p>
            <p className="text-xs text-gray-500">200m • 3 mins</p>
          </div>
        </div>

        {/* Step 2: Ride */}
        <div className="flex gap-4 mb-6">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            </div>
            <div className="w-0.5 h-full bg-blue-600 my-1"></div>
          </div>
          <div>
            <p className="font-medium text-gray-800">
              Ride Jeep (Quezon Ave Route)
            </p>
            <p className="text-xs text-gray-500">Get off at Philcoa</p>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="p-4 border-t border-gray-100">
        <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2">
          <Navigation size={20} /> Start Navigation
        </button>
      </div>
    </div>
  );
};

export default RouteSheet;

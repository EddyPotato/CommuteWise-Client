import { useState } from "react";
import {
  Clock,
  Ticket,
  Navigation,
  Footprints,
  Bus,
  MapPin,
} from "lucide-react";

const RouteSheet = ({ route }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle between 30% height (minimized) and 85% height (maximized)
  const heightClass = isExpanded ? "h-[85vh]" : "h-[30vh]";

  if (!route) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] w-full transition-all duration-500 ease-in-out flex flex-col z-50 ${heightClass}`}
    >
      {/* 1. Drag Handle / Header (Always Visible) */}
      <div
        className="w-full p-3 flex flex-col items-center cursor-pointer bg-white rounded-t-3xl border-b border-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2"></div>

        {/* Minimized Summary View */}
        <div className="w-full px-4 flex justify-between items-center">
          <div>
            <div className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              {route.eta || 15} min
              <span className="text-sm font-normal text-gray-500">
                ({route.distance || 1.2} km)
              </span>
            </div>
            <div className="text-sm text-green-600 font-semibold flex items-center gap-1">
              Fastest route based on traffic
            </div>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              ₱{route.fare || 25}
            </div>
            <div className="text-xs text-gray-400 line-through">
              ₱{(route.fare || 25) + 5}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Content (Visible fully when expanded) */}
      <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
        {/* Start Button (Visible immediately in minimized too) */}
        <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <button className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Navigation size={22} /> Start Navigation
          </button>
        </div>

        {/* Detailed Steps */}
        <div className="p-5 pb-24">
          <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-4">
            Route Steps
          </h3>

          {/* Steps Map */}
          {route.steps && route.steps.length > 0 ? (
            route.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 mb-6 relative group">
                {/* Timeline Line */}
                {idx !== route.steps.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-300 group-last:hidden"></div>
                )}

                {/* Icon Column */}
                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                      step.mode === "walking"
                        ? "bg-gray-200 text-gray-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {step.mode === "walking" ? (
                      <Footprints size={16} />
                    ) : (
                      <Bus size={16} />
                    )}
                  </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <p className="font-bold text-gray-800 text-sm mb-1">
                    {step.from} → {step.to}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium capitalize">
                      {step.mode}
                    </span>
                    • {step.route || "Direct"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            /* Fallback Steps if none provided (Visual Demo) */
            <>
              <StepIcon
                icon={Footprints}
                title="Walk to Sampaguita Terminal"
                sub="400m • 5 min"
                color="gray"
              />
              <StepIcon
                icon={Bus}
                title="Ride Tricycle (Green)"
                sub="Get off at Sauyo Market"
                color="blue"
              />
              <StepIcon
                icon={MapPin}
                title="Arrive at Destination"
                sub="Sauyo Market"
                color="red"
                last
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Component for Fallback Steps
const StepIcon = ({ icon: Icon, title, sub, color, last }) => (
  <div className="flex gap-4 mb-6 relative">
    {!last && (
      <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-300"></div>
    )}
    <div className="flex flex-col items-center z-10">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-${color}-100 text-${color}-600`}
      >
        <Icon size={16} />
      </div>
    </div>
    <div>
      <p className="font-bold text-gray-800 text-sm">{title}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  </div>
);

export default RouteSheet;

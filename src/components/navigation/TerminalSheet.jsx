import React, { useEffect, useState } from "react";
import { X, MapPin, Star, Navigation, Bus, Clock, Ticket } from "lucide-react";
import { supabase } from "../../lib/supabase";

const TerminalSheet = ({ terminal, onClose }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({ average: 0, count: 0 });

  useEffect(() => {
    if (terminal) fetchTerminalDetails();
  }, [terminal]);

  const fetchTerminalDetails = async () => {
    setLoading(true);
    try {
      // FIXED: Only show routes DEPARTING (source) from this terminal
      const { data: routeData } = await supabase
        .from("routes")
        .select(
          `id, route_name, mode, fare, eta_minutes, target_stop:stops!routes_target_fkey(name), source_stop:stops!routes_source_fkey(name)`
        )
        .eq("source", terminal.id); // Changed from .or()

      if (routeData) setRoutes(routeData);
      setReviews({ average: 0, count: 0 });
    } catch (err) {
      console.error("Error details:", err);
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case "bus":
        return <Bus size={18} className="text-blue-600" />;
      case "jeep":
        return <Bus size={18} className="text-purple-600" />;
      default:
        return <Navigation size={18} className="text-green-600" />;
    }
  };

  if (!terminal) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-[30] flex flex-col justify-end pointer-events-none h-full">
      <div
        className="absolute inset-0 bg-black/10 pointer-events-auto transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white w-full rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.1)] pointer-events-auto flex flex-col max-h-[85%] animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-white rounded-t-3xl sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">
              {terminal.name}
            </h2>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <MapPin size={14} />
              <span>{terminal.barangay || "Quezon City"}, Metro Manila</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={`${
                      star <= Math.round(reviews.average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {reviews.average.toFixed(1)} ({reviews.count} reviews)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Departing Routes ({routes.length})
          </h3>
          {loading ? (
            <div className="text-center py-10 text-gray-400">
              Loading routes...
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic">
              No departing routes available.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                        {getModeIcon(route.mode)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">
                          {route.route_name ||
                            `${route.source_stop?.name} → ${route.target_stop?.name}`}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {route.mode} • via {terminal.barangay}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 pl-11">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      <Clock size={12} /> {route.eta_minutes} mins
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      <Ticket size={12} /> ₱{route.fare}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
          <button className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-transform">
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminalSheet;

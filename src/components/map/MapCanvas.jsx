import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { Star, ArrowRight, Crosshair } from "lucide-react";

// --- STYLES (MATCHING ADMIN & GOOGLE MAPS FEEL) ---
const mapStyles = `
  /* TERMINAL PIN (Large) */
  .custom-terminal-marker {
    background: white;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    transition: transform 0.2s;
    z-index: 500 !important;
  }
  .custom-terminal-marker:hover {
    transform: scale(1.1);
    z-index: 600 !important;
  }

  /* USER LOCATION (Pulsing Blue Dot) */
  @keyframes pulse-ring {
    0% { transform: scale(0.33); opacity: 1; }
    80%, 100% { opacity: 0; }
  }
  @keyframes pulse-dot {
    0% { transform: scale(0.9); }
    50% { transform: scale(1); }
    100% { transform: scale(0.9); }
  }
  
  .user-location-marker {
    position: relative;
    z-index: 9999 !important; /* FORCE ON TOP OF EVERYTHING */
  }
  .user-location-marker::before {
    content: '';
    position: absolute;
    left: -20px; top: -20px;
    width: 64px; height: 64px;
    background-color: rgba(37, 99, 235, 0.3);
    border-radius: 50%;
    animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  .user-location-marker::after {
    content: '';
    position: absolute;
    left: 0; top: 0;
    width: 24px; height: 24px;
    background-color: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    animation: pulse-dot 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite;
    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
  }
`;

// Helper: Get Color based on Mode
const getModeColor = (mode) => {
  switch (mode?.toLowerCase()) {
    case "bus":
      return "#2563eb";
    case "jeep":
      return "#7c3aed";
    case "tricycle":
      return "#16a34a";
    default:
      return "#6b7280";
  }
};

// Helper: Create Icon (Only for Terminals)
const createIcon = (stop) => {
  const type = stop.type?.toLowerCase();
  const vehicles = stop.allowed_vehicles || [];

  let color = "#3b82f6";
  let innerHTML = "📍";

  if (vehicles.includes("tricycle")) {
    color = "#16a34a";
    innerHTML = "🛺";
  } else if (vehicles.includes("jeep")) {
    color = "#7c3aed";
    innerHTML = "🚙";
  } else if (vehicles.includes("bus")) {
    color = "#1e40af";
    innerHTML = "🚌";
  } else {
    color = "#10b981";
    innerHTML = "📍";
  } // Default Terminal

  return L.divIcon({
    className: "custom-terminal-marker",
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">${innerHTML}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const userIcon = L.divIcon({
  className: "user-location-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// --- SUB-COMPONENT: Map Controller ---
const MapController = ({ selectedRoute, userLocation, shouldFlyToUser }) => {
  const map = useMap();

  // Handle Route Zoom
  useEffect(() => {
    if (selectedRoute && selectedRoute.polyline) {
      const geoJsonLayer = L.geoJSON(selectedRoute.polyline);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRoute, map]);

  // Handle "Locate Me" Zoom - Moves map to user when location is found
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [shouldFlyToUser, userLocation, map]); // Added userLocation to deps to auto-fly on first load

  return null;
};

// --- SUB-COMPONENT: Map Events ---
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
};

// --- MAIN COMPONENT ---
const MapCanvas = ({ selectedRoute, onMapClick, isPicking, tempLocation }) => {
  const [stops, setStops] = useState([]);
  const [terminalRoutes, setTerminalRoutes] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [flyTrigger, setFlyTrigger] = useState(0);

  // 1. Fetch ONLY Terminals (Filtered)
  useEffect(() => {
    const fetchStops = async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("*, lat, lng")
        .eq("type", "terminal"); // Strict filter for Terminals only

      if (error) {
        console.error("Error fetching stops:", error);
      } else if (data) {
        const validData = data
          .map((s) => ({
            ...s,
            lat: parseFloat(s.lat),
            lng: parseFloat(s.lng),
          }))
          .filter((s) => !isNaN(s.lat) && !isNaN(s.lng));
        setStops(validData);
      }
    };
    fetchStops();
  }, []);

  // 2. Manual Geolocation (Locate Me)
  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setFlyTrigger((prev) => prev + 1); // Trigger zoom
      },
      (error) => {
        console.warn("Location error:", error.message);
        alert("Please enable location services to see your position.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 3. Auto-Locate on Load (Silent, no alert on fail)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          // We don't trigger flyTrigger here to avoid annoying jumps on load,
          // but user location dot will appear.
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // 4. Handle Terminal Click
  const handleMarkerClick = async (terminalId) => {
    setTerminalRoutes([]);
    const { data } = await supabase
      .from("routes")
      .select("*")
      .or(`source.eq.${terminalId},target.eq.${terminalId}`);

    if (data) {
      setTerminalRoutes(
        data.map((r) => ({
          ...r,
          geo: r.polyline ? JSON.parse(r.polyline) : null,
        }))
      );
    }
  };

  return (
    <>
      <style>{mapStyles}</style>

      {/* FLOATING LOCATE BUTTON */}
      <button
        onClick={handleLocateMe}
        className="absolute bottom-24 right-4 z-[400] bg-white p-3 rounded-full shadow-md text-gray-600 hover:text-blue-600 border border-gray-200 transition-transform active:scale-95 flex items-center justify-center"
        title="Find My Location"
      >
        <Crosshair size={24} />
      </button>

      <MapContainer
        center={[14.6515, 121.0493]}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* TILE LAYER: CartoDB Voyager (Clean, Minimalist, Admin-Style) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController
          selectedRoute={selectedRoute}
          userLocation={userLocation}
          shouldFlyToUser={flyTrigger}
        />

        <MapEvents onMapClick={onMapClick} />

        {/* 1. Terminal Routes */}
        {terminalRoutes.map(
          (route) =>
            route.geo && (
              <GeoJSON
                key={`term-route-${route.id}`}
                data={route.geo}
                style={{
                  color: getModeColor(route.mode),
                  weight: 4,
                  opacity: 0.6,
                  dashArray: "5, 10",
                }}
              />
            )
        )}

        {/* 2. Navigation Route */}
        {selectedRoute && selectedRoute.polyline && (
          <GeoJSON
            data={selectedRoute.polyline}
            style={{ color: "#2563eb", weight: 6, opacity: 1 }}
          />
        )}

        {/* 3. Picker Marker */}
        {isPicking && tempLocation && (
          <Marker
            position={[tempLocation.lat, tempLocation.lng]}
            icon={createIcon({ type: "terminal", allowed_vehicles: [] })}
          >
            <Popup>Selected Location</Popup>
          </Marker>
        )}

        {/* 4. TERMINAL MARKERS ONLY (Loop through stops) */}
        {!isPicking &&
          stops.map((stop) => (
            <Marker
              key={stop.id}
              position={[stop.lat, stop.lng]}
              icon={createIcon(stop)}
              eventHandlers={{
                click: () => handleMarkerClick(stop.id),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-gray-800 m-0 text-sm">
                    {stop.name}
                  </h3>
                  <div className="text-xs text-gray-500 capitalize mb-2">
                    {stop.type.replace("_", " ")}
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <Star
                      size={12}
                      className="text-yellow-500 fill-yellow-500"
                    />
                    <span className="text-xs font-bold">4.2</span>
                    <span className="text-xs text-gray-400">(12 reviews)</span>
                  </div>

                  <button
                    className="w-full bg-primary text-white text-xs py-1.5 px-3 rounded-md flex items-center justify-center gap-1 hover:bg-emerald-600 transition-colors"
                    onClick={() =>
                      alert(`Redirect to Terminal Page: ${stop.id}`)
                    }
                  >
                    View Routes <ArrowRight size={12} />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 5. USER LOCATION (Visible & On Top) */}
        {userLocation && userLocation.lat && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            zIndexOffset={9999}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  );
};

export default MapCanvas;

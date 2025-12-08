import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";

// --- STYLES (Adapted from Admin RouteManager) ---
const mapStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(209, 213, 219, 0.4); border-radius: 10px; }
  
  /* User Location Pulse Animation */
  @keyframes pulse-ring {
    0% { transform: scale(0.33); opacity: 1; }
    80%, 100% { opacity: 0; }
  }
  @keyframes pulse-dot {
    0% { transform: scale(0.8); }
    50% { transform: scale(1); }
    100% { transform: scale(0.8); }
  }
  
  .user-location-marker {
    position: relative;
  }
  .user-location-marker::before {
    content: '';
    position: absolute;
    left: -10px; top: -10px;
    width: 30px; height: 30px;
    background-color: rgba(59, 130, 246, 0.4); /* Blue pulse */
    border-radius: 50%;
    animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  .user-location-marker::after {
    content: '';
    position: absolute;
    left: 0; top: 0;
    width: 10px; height: 10px;
    background-color: #2563eb;
    border: 2px solid white;
    border-radius: 50%;
    animation: pulse-dot 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
`;

// --- HELPER: ICON GENERATOR (Shared Logic with Admin) ---
const getIcon = (stop) => {
  const type = stop.type?.toLowerCase();
  const vehicles = stop.allowed_vehicles || [];

  let color = "#3b82f6";
  let innerHTML = "";

  // Terminal Logic
  if (type === "terminal") {
    if (vehicles.length > 1) color = "#eab308"; // Mixed
    else if (vehicles.includes("tricycle")) color = "#16a34a";
    else if (vehicles.includes("jeep")) color = "#7c3aed";
    else if (vehicles.includes("bus")) color = "#1e40af";
    else color = "#10b981";
  } else {
    // Establishment Logic
    switch (type) {
      case "school":
        color = "#f97316";
        innerHTML = "🎓";
        break;
      case "hospital":
        color = "#ef4444";
        innerHTML = "🏥";
        break;
      case "mall":
        color = "#8b5cf6";
        innerHTML = "🛍️";
        break;
      case "restaurant":
        color = "#eab308";
        innerHTML = "🍴";
        break;
      default:
        color = "#3b82f6";
    }
  }

  // Small Dot for Standard Stops
  if (type === "stop_point") {
    return L.divIcon({
      className: "custom-stop-point",
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  }

  // Larger Marker for Terminals/Landmarks
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; color: white; font-size: 14px;">${innerHTML}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const userIcon = L.divIcon({
  className: "user-location-marker",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// --- SUB-COMPONENT: MAP CONTROLLER ---
// Handles flying to user location or fitting route bounds
const MapController = ({ userLocation, selectedRoute }) => {
  const map = useMap();

  useEffect(() => {
    // 1. If a route is selected, fit bounds to the route
    if (selectedRoute && selectedRoute.polyline) {
      const geoJsonLayer = L.geoJSON(selectedRoute.polyline);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    // 2. Otherwise, if we just got user location and haven't moved yet, fly to user
    else if (userLocation && !selectedRoute) {
      // Only fly if we are far away? For now, simple flyTo on first load
      // We can add a "followUser" state later if needed
      // map.flyTo([userLocation.lat, userLocation.lng], 16);
    }
  }, [userLocation, selectedRoute, map]);

  return null;
};

// --- MAIN COMPONENT ---
const MapCanvas = ({ selectedRoute }) => {
  const [stops, setStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // 1. Fetch Stops from Supabase
  useEffect(() => {
    const fetchStops = async () => {
      const { data, error } = await supabase
        .from("stops")
        .select("id, name, type, lat, lng, allowed_vehicles");

      if (error) console.error("Error fetching stops:", error);
      else setStops(data || []);
    };
    fetchStops();
  }, []);

  // 2. Track User Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Default Center (Quezon City Circle approx)
  const defaultCenter = [14.6515, 121.0493];

  return (
    <>
      <style>{mapStyles}</style>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false} // We can add custom controls later if needed
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController
          userLocation={userLocation}
          selectedRoute={selectedRoute}
        />

        {/* Render Stops */}
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            position={[stop.lat, stop.lng]}
            icon={getIcon(stop)}
          >
            {/* Simple Popup for now, can be replaced with a drawer trigger later */}
            <Popup offset={[0, -10]}>
              <div className="font-sans">
                <h3 className="font-bold text-gray-800 m-0">{stop.name}</h3>
                <p className="text-xs text-gray-500 m-0 capitalize">
                  {stop.type.replace("_", " ")}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render User Location */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Render Selected Route Polyline */}
        {selectedRoute && selectedRoute.polyline && (
          <GeoJSON
            data={selectedRoute.polyline}
            style={{
              color: "#10b981", // Emerald-500
              weight: 6,
              opacity: 0.8,
              lineCap: "round",
            }}
          />
        )}
      </MapContainer>
    </>
  );
};

export default MapCanvas;

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
import { Star, Crosshair, Info } from "lucide-react";
import { useRouteContext } from "../../contexts/RouteContext";

// --- STYLES ---
const mapStyles = `
  .custom-terminal-marker {
    background: white;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    display: flex; justify-content: center; align-items: center;
    font-size: 16px; transition: transform 0.2s; z-index: 500 !important;
  }
  .custom-terminal-marker:hover { transform: scale(1.1); z-index: 600 !important; }

  /* SEARCH MARKERS */
  .origin-marker { background-color: #10b981; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); }
  .dest-marker { background-color: #ef4444; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); }

  .user-location-marker { position: relative; z-index: 9999 !important; }
  .user-location-marker::before { content: ''; position: absolute; left: -20px; top: -20px; width: 64px; height: 64px; background-color: rgba(16, 185, 129, 0.3); border-radius: 50%; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
  .user-location-marker::after { content: ''; position: absolute; left: 0; top: 0; width: 24px; height: 24px; background-color: #10b981; border: 3px solid white; border-radius: 50%; animation: pulse-dot 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite; box-shadow: 0 3px 8px rgba(0,0,0,0.4); }
`;

const getModeColor = (mode) => {
  switch (mode?.toLowerCase()) {
    case "bus": return "#2563eb";
    case "jeep": return "#7c3aed";
    case "tricycle": return "#16a34a";
    default: return "#6b7280";
  }
};

const createIcon = (stop) => {
  const type = stop.type?.toLowerCase();
  const vehicles = stop.allowed_vehicles || [];
  let color = "#3b82f6";
  let innerHTML = "📍";

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

const userIcon = L.divIcon({ className: "user-location-marker", iconSize: [24, 24], iconAnchor: [12, 12] });

const originIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="origin-marker" style="width: 20px; height: 20px;"></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10]
});
const destIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="dest-marker" style="width: 20px; height: 20px;"></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10]
});

// NEW HELPER: Ensures data passed to Leaflet is safe
const isValidCoordinate = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
};

const MapController = ({ selectedRoute, userLocation, shouldFlyToUser, searchMarkers }) => {
  const map = useMap();
  const { setMapCenter, setMapZoom } = useRouteContext();

  useMapEvents({
    moveend: () => {
      setMapCenter([map.getCenter().lat, map.getCenter().lng]);
      setMapZoom(map.getZoom());
    },
  });

  useEffect(() => {
    // Only attempt to fit bounds if polyline data exists
    if (selectedRoute && selectedRoute.fullPolyline) {
      const geoJsonLayer = L.geoJSON(selectedRoute.fullPolyline);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedRoute, map]);

  useEffect(() => {
    if (userLocation && shouldFlyToUser > 0 && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.5 });
    }
  }, [shouldFlyToUser, userLocation, map]);

  useEffect(() => {
      if (searchMarkers?.destination && isValidCoordinate(searchMarkers.destination.lat, searchMarkers.destination.lng)) {
          map.flyTo([searchMarkers.destination.lat, searchMarkers.destination.lng], 15, { duration: 1 });
      } else if (searchMarkers?.origin && isValidCoordinate(searchMarkers.origin.lat, searchMarkers.origin.lng)) {
          map.flyTo([searchMarkers.origin.lat, searchMarkers.origin.lng], 15, { duration: 1 });
      }
  }, [searchMarkers, map]);

  return null;
};

const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) { if (onMapClick) onMapClick(e.latlng); },
  });
  return null;
};

const MapCanvas = ({ onMapClick, onViewDetails, isPicking, tempLocation, searchMarkers, routePolyline }) => {
  const { selectedRoute, mapCenter, mapZoom } = useRouteContext();
  const [stops, setStops] = useState([]);
  const [terminalRoutes, setTerminalRoutes] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [flyTrigger, setFlyTrigger] = useState(0);

  useEffect(() => {
    const fetchStops = async () => {
      const { data } = await supabase.from("stops").select("*, lat, lng").eq("type", "terminal");
      if (data) {
        const validData = data.map((s) => ({ ...s, lat: parseFloat(s.lat), lng: parseFloat(s.lng) }))
                              .filter((s) => isValidCoordinate(s.lat, s.lng)); // Filter bad terminals
        setStops(validData);
      }
    };
    fetchStops();
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setFlyTrigger((prev) => prev + 1);
      },
      () => alert("Please enable location services."),
      { enableHighAccuracy: true }
    );
  };

  const handleMarkerClick = async (terminalId) => {
    setTerminalRoutes([]);
    const { data } = await supabase.from("routes").select("*").eq("source", terminalId);
    if (data) {
      setTerminalRoutes(data.map((r) => ({ ...r, geo: r.polyline ? JSON.parse(r.polyline) : null })));
    }
  };

  return (
    <>
      <style>{mapStyles}</style>
      <button onClick={handleLocateMe} className="absolute bottom-24 right-4 z-[400] bg-white p-3 rounded-full shadow-md text-gray-600 hover:text-emerald-600 border border-gray-200 transition-transform active:scale-95 flex items-center justify-center">
        <Crosshair size={24} />
      </button>

      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer attribution="&copy; CARTO" url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <MapController selectedRoute={selectedRoute} userLocation={userLocation} shouldFlyToUser={flyTrigger} searchMarkers={searchMarkers} />
        <MapEvents onMapClick={onMapClick} />

        {/* Terminals */}
        {!isPicking && stops.map((stop) => (
            <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={createIcon(stop)} eventHandlers={{ click: () => handleMarkerClick(stop.id) }}>
              <Popup className="custom-popup">
                <div className="p-1 min-w-[160px]">
                  <h3 className="font-bold text-gray-800 m-0 text-sm">{stop.name}</h3>
                  <button className="w-full bg-white border border-gray-200 text-gray-700 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-semibold shadow-sm mt-2" onClick={() => onViewDetails(stop)}>
                    <Info size={14} className="text-blue-600" /> View Details
                  </button>
                </div>
              </Popup>
            </Marker>
        ))}

        {/* Search Markers - SAFEGUARDED */}
        {searchMarkers?.origin && isValidCoordinate(searchMarkers.origin.lat, searchMarkers.origin.lng) && (
            <Marker position={[searchMarkers.origin.lat, searchMarkers.origin.lng]} icon={originIcon}>
                <Popup>Origin: {searchMarkers.origin.name}</Popup>
            </Marker>
        )}
        {searchMarkers?.destination && isValidCoordinate(searchMarkers.destination.lat, searchMarkers.destination.lng) && (
            <Marker position={[searchMarkers.destination.lat, searchMarkers.destination.lng]} icon={destIcon}>
                <Popup>Destination: {searchMarkers.destination.name}</Popup>
            </Marker>
        )}

        {/* Routes */}
        {terminalRoutes.map((route) => route.geo && <GeoJSON key={`term-route-${route.id}`} data={route.geo} style={{ color: getModeColor(route.mode), weight: 4, opacity: 0.6, dashArray: "5, 10" }} />)}
        {selectedRoute && routePolyline && <GeoJSON data={routePolyline} style={{ color: "#2563eb", weight: 6, opacity: 1 }} />}

        {isPicking && tempLocation && isValidCoordinate(tempLocation.lat, tempLocation.lng) && (
             <Marker position={[tempLocation.lat, tempLocation.lng]} icon={createIcon({ type: "terminal", allowed_vehicles: [] })}><Popup>Selected Location</Popup></Marker>
        )}
        {userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) && (
             <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={9999}><Popup>You are here</Popup></Marker>
        )}
      </MapContainer>
    </>
  );
};

export default MapCanvas;
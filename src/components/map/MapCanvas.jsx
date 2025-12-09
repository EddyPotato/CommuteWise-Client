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
import { Crosshair } from "lucide-react";
import { useRouteContext } from "../../contexts/RouteContext";
import StopMarker from "./StopMarker"; // New Component
import UserLocationMarker from "./UserLocationMarker"; // New Component
// Assume mapUtils is created based on step 1
import { isValidCoordinate } from "../../utils/mapUtils"; 

// --- STYLES ---
const mapStyles = `
  .custom-terminal-marker { background: white; border-radius: 50%; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; font-size: 16px; transition: transform 0.2s; z-index: 500 !important; }
  .custom-terminal-marker:hover { transform: scale(1.1); z-index: 600 !important; }
  .origin-marker { background-color: #10b981; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); }
  .dest-marker { background-color: #ef4444; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); }
  @keyframes pulse-ring { 0% { transform: scale(0.33); opacity: 1; } 80%, 100% { opacity: 0; } }
  @keyframes pulse-dot { 0% { transform: scale(0.9); } 50% { transform: scale(1); } 100% { transform: scale(0.9); } }
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


const MapController = ({ selectedRoute, userLocation, shouldFlyToUser, searchMarkers }) => {
  const map = useMap();
  const { setMapCenter, setMapZoom } = useRouteContext();

  useMapEvents({ moveend: () => { setMapCenter([map.getCenter().lat, map.getCenter().lng]); setMapZoom(map.getZoom()); }, });

  useEffect(() => {
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
                              .filter((s) => isValidCoordinate(s.lat, s.lng)); 
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

  const handleTerminalRouteClick = async (terminalId) => {
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

        {/* Terminals (Using StopMarker) */}
        {!isPicking && stops.map((stop) => (
            <StopMarker 
                key={stop.id} 
                stop={stop} 
                onViewDetails={onViewDetails}
                onMarkerClick={handleTerminalRouteClick}
            />
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

        {/* Temporary Picker Location */}
        {isPicking && tempLocation && isValidCoordinate(tempLocation.lat, tempLocation.lng) && (
             <Marker position={[tempLocation.lat, tempLocation.lng]} icon={originIcon}><Popup>Selected Location</Popup></Marker>
        )}
        
        {/* User Location Marker (Using UserLocationMarker) */}
        <UserLocationMarker userLocation={userLocation} />

      </MapContainer>
    </>
  );
};

export default MapCanvas;
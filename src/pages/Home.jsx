import React, { useState } from "react";
import MapCanvas from "../components/map/MapCanvas";
import TopSearchBar from "../components/navigation/TopSearchBar";
import RouteSheet from "../components/navigation/RouteSheet";

const Home = () => {
  // View States: 'idle' (just map) | 'routing' (showing path)
  const [viewState, setViewState] = useState("idle");
  const [selectedRoute, setSelectedRoute] = useState(null);

  const handleRouteFound = (routeData) => {
    setSelectedRoute(routeData);
    setViewState("routing");
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-gray-50">
      {/* 1. LAYER: MAP (Full Background) */}
      <div className="absolute inset-0 z-0">
        <MapCanvas selectedRoute={selectedRoute} />
      </div>

      {/* 2. LAYER: TOP UI (Search Bar) */}
      {/* We use pointer-events-none on the container so clicks pass through to the map, 
          but pointer-events-auto on the actual SearchBar so it's interactive. */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
        <TopSearchBar onRouteCalculated={handleRouteFound} />
      </div>

      {/* 3. LAYER: BOTTOM SHEET (Only visible when routing) */}
      {viewState === "routing" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
          <RouteSheet route={selectedRoute} />
        </div>
      )}
    </div>
  );
};

export default Home;

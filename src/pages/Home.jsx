import React, { useEffect, useState } from "react";
import MapCanvas from "../components/map/MapCanvas";
import TopSearchBar from "../components/navigation/TopSearchBar";
import RouteSheet from "../components/navigation/RouteSheet";
import TerminalSheet from "../components/navigation/TerminalSheet";
import { supabase } from "../lib/supabase";
import { useRouteContext } from "../contexts/RouteContext";
import { Check } from "lucide-react";

const Home = () => {
  const {
    viewState,
    setViewState,
    selectedRoute,
    setSelectedRoute,
    selectedTerminal,
    setSelectedTerminal,
    graphRef,
    isGraphReady,
    setIsGraphReady,
  } = useRouteContext();

  const [pickingField, setPickingField] = useState(null);
  const [tempPickedLocation, setTempPickedLocation] = useState(null);
  
  // NEW: State to hold markers for search results before a route is calculated
  const [searchMarkers, setSearchMarkers] = useState({ origin: null, destination: null });

  // Initialize Graph on Load
  useEffect(() => {
    if (!isGraphReady) {
      const initGraph = async () => {
        const { data: stops } = await supabase.from("stops").select("*");
        const { data: routes } = await supabase.from("routes").select("*");
        if (stops && routes) {
          graphRef.current.buildGraph(stops, routes);
          setIsGraphReady(true);
        }
      };
      initGraph();
    }
  }, [isGraphReady]);

  // Handler for TopSearchBar updates
  const handleSearchMarkerUpdate = (field, location) => {
      setSearchMarkers(prev => ({
          ...prev,
          [field]: location
      }));
  };

  const handleRouteCalculation = ({ origin, destination }) => {
    if (!isGraphReady) return alert("System initializing... please wait.");

    // 1. First Mile: Find Nearest Terminal to Start Point
    const startNode = graphRef.current.findNearestNode(origin.lat, origin.lng);
    
    // 2. Last Mile: Find Nearest Terminal to Destination
    const endNode = graphRef.current.findNearestNode(destination.lat, destination.lng);

    if (!startNode.node || !endNode.node)
      return alert("No nearby transport terminals found. Try a closer location.");

    // 3. Run Weighted Dijkstra (Default: Recommended)
    const transitPath = graphRef.current.findShortestPath(
      startNode.node.id,
      endNode.node.id,
      "recommended" 
    );

    if (!transitPath) return alert("No route found connecting these locations.");

    // 4. Calculate Walking Segments
    const walkSpeed = 5; // km/h
    const startWalkTime = Math.ceil((startNode.distance / walkSpeed) * 60);
    const endWalkTime = Math.ceil((endNode.distance / walkSpeed) * 60);

    const fullSteps = [
      {
        from: "Your Location",
        to: startNode.node.name,
        mode: "walking",
        distance: `${startNode.distance.toFixed(2)} km`,
        route: `Walk (~${startWalkTime} mins)`,
      },
      ...transitPath.segments,
      {
        from: endNode.node.name,
        to: "Destination",
        mode: "walking",
        distance: `${endNode.distance.toFixed(2)} km`,
        route: `Walk (~${endWalkTime} mins)`,
      },
    ];

    setSelectedRoute({
      eta: transitPath.totalEta + startWalkTime + endWalkTime,
      fare: transitPath.totalFare,
      distance: (
        transitPath.totalDistance +
        startNode.distance +
        endNode.distance
      ).toFixed(2),
      steps: fullSteps,
      polyline: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [origin.lng, origin.lat],
                [startNode.node.lng, startNode.node.lat],
              ],
            },
            properties: { type: "walk" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: transitPath.path.map((s) => [s.lng, s.lat]),
            },
            properties: { type: "transit" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [endNode.node.lng, endNode.node.lat],
                [destination.lng, destination.lat],
              ],
            },
            properties: { type: "walk" },
          },
        ],
      },
    });
    setViewState("routing");
    // Clear search markers once route is found to avoid clutter
    setSearchMarkers({ origin: null, destination: null });
  };

  const enterPickerMode = (field) => {
    setPickingField(field);
    setViewState("picking_location");
  };
  
  const handleMapClick = (latlng) => {
    if (viewState === "picking_location") setTempPickedLocation(latlng);
  };

  const handleViewDetails = (terminal) => {
    setSelectedTerminal(terminal);
    setViewState("terminal_details");
  };

  const closeSheets = () => {
    setViewState("idle");
    setSelectedTerminal(null);
    setSelectedRoute(null);
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-gray-50">
      <div className="absolute inset-0 z-0">
        <MapCanvas
          onMapClick={handleMapClick}
          onViewDetails={handleViewDetails}
          isPicking={viewState === "picking_location"}
          tempLocation={tempPickedLocation}
          // Pass the dynamic search markers here
          searchMarkers={searchMarkers} 
        />
      </div>

      {viewState === "idle" && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
          <TopSearchBar
            onRouteCalculated={handleRouteCalculation}
            onChooseOnMapMode={enterPickerMode}
            onLocationSelect={handleSearchMarkerUpdate} // Hook up the callback
          />
        </div>
      )}

      {viewState === "picking_location" && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center px-4">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg mb-4 text-sm font-semibold text-gray-700">
            Tap map to select {pickingField}
          </div>
          {tempPickedLocation && (
            <button
              onClick={() => {
                alert(`Location picked: ${tempPickedLocation.lat}`);
                // In production, update TopSearchBar state here
                setViewState("idle");
              }}
              className="w-full max-w-sm bg-primary text-white py-3 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2"
            >
              <Check size={20} /> Confirm Location
            </button>
          )}
        </div>
      )}

      {viewState === "routing" && (
        <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-auto">
          <RouteSheet route={selectedRoute} onClose={closeSheets} />
        </div>
      )}
      {viewState === "terminal_details" && selectedTerminal && (
        <TerminalSheet terminal={selectedTerminal} onClose={closeSheets} />
      )}
    </div>
  );
};

export default Home;
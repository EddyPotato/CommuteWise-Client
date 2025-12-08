import React, { useState, useEffect, useRef } from "react";
import MapCanvas from "../components/map/MapCanvas";
import TopSearchBar from "../components/navigation/TopSearchBar";
import RouteSheet from "../components/navigation/RouteSheet";
import { supabase } from "../lib/supabase";
import { TransportGraph } from "../lib/graph";
import { MapPin, Check } from "lucide-react"; // Import Icons

const Home = () => {
  const [viewState, setViewState] = useState("idle"); // idle | searching | picking_location | routing
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Picking on Map State
  const [pickingField, setPickingField] = useState(null); // 'origin' or 'destination'
  const [tempPickedLocation, setTempPickedLocation] = useState(null);

  // Graph Logic
  const graphRef = useRef(new TransportGraph());
  const [isGraphReady, setIsGraphReady] = useState(false);

  useEffect(() => {
    const initGraph = async () => {
      const { data: stops } = await supabase.from("stops").select("*");
      const { data: routes } = await supabase.from("routes").select("*");
      if (stops && routes) {
        graphRef.current.buildGraph(stops, routes);
        setIsGraphReady(true);
      }
    };
    initGraph();
  }, []);

  // --- Handlers ---

  const handleRouteCalculation = ({ origin, destination }) => {
    if (!isGraphReady) return alert("System initializing... please wait.");

    // 1. Find Nearest Nodes
    const startNode = graphRef.current.findNearestNode(origin.lat, origin.lng);
    const endNode = graphRef.current.findNearestNode(
      destination.lat,
      destination.lng
    );

    if (!startNode.node || !endNode.node) {
      alert("No nearby transport terminals found for these locations.");
      return;
    }

    // 2. Dijkstra
    const transitPath = graphRef.current.findShortestPath(
      startNode.node.id,
      endNode.node.id
    );

    if (!transitPath) {
      alert("No route found connecting these points.");
      return;
    }

    // 3. Formatter
    const fullSteps = [
      {
        from: "Your Location",
        to: startNode.node.name,
        mode: "walking",
        distance: `${startNode.distance.toFixed(2)} km`,
        route: "Walk to terminal",
      },
      ...transitPath.segments,
      {
        from: endNode.node.name,
        to: "Destination",
        mode: "walking",
        distance: `${endNode.distance.toFixed(2)} km`,
        route: "Walk to destination",
      },
    ];

    const finalRoute = {
      eta: Math.ceil(
        transitPath.estimatedTime +
          startNode.distance * 15 +
          endNode.distance * 15
      ),
      fare: transitPath.estimatedFare,
      distance: (
        parseFloat(transitPath.rideDistance) +
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
    };

    setSelectedRoute(finalRoute);
    setViewState("routing");
  };

  // Called when "Choose on Map" is clicked in Search Bar
  const enterPickerMode = (field) => {
    setPickingField(field);
    setViewState("picking_location");
  };

  // Called when map is clicked (passed from MapCanvas)
  const handleMapClick = (latlng) => {
    if (viewState === "picking_location") {
      setTempPickedLocation(latlng);
    }
  };

  const confirmPickedLocation = () => {
    // In a real app, you would Reverse Geocode here (Coords -> Address Name)
    alert(
      `Location picked: ${tempPickedLocation.lat}, ${tempPickedLocation.lng}. (Reverse Geocoding to be implemented)`
    );

    // Reset view to search (Logic to pass this back to SearchBar needed in full app context)
    // For MVP, we just go back to idle
    setViewState("idle");
    setTempPickedLocation(null);
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-gray-50">
      {/* 1. MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          selectedRoute={selectedRoute}
          onMapClick={handleMapClick}
          isPicking={viewState === "picking_location"}
          tempLocation={tempPickedLocation}
        />
      </div>

      {/* 2. UI LAYER: SEARCH (Hidden if picking location) */}
      {viewState !== "picking_location" && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
          <TopSearchBar
            onRouteCalculated={handleRouteCalculation}
            onChooseOnMapMode={enterPickerMode}
          />
        </div>
      )}

      {/* 3. UI LAYER: LOCATION PICKER OVERLAY */}
      {viewState === "picking_location" && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center px-4">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg mb-4 text-sm font-semibold text-gray-700">
            Tap map to select {pickingField}
          </div>
          {tempPickedLocation && (
            <button
              onClick={confirmPickedLocation}
              className="w-full max-w-sm bg-primary text-white py-3 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-4"
            >
              <Check size={20} /> Confirm Location
            </button>
          )}
        </div>
      )}

      {/* 4. UI LAYER: ROUTE SHEET */}
      {viewState === "routing" && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
          <RouteSheet route={selectedRoute} />
        </div>
      )}
    </div>
  );
};

export default Home;

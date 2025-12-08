import React, { useEffect } from "react";
import MapCanvas from "../components/map/MapCanvas";
import TopSearchBar from "../components/navigation/TopSearchBar";
import RouteSheet from "../components/navigation/RouteSheet";
import TerminalSheet from "../components/navigation/TerminalSheet";
import { supabase } from "../lib/supabase";
import { useRouteContext } from "../contexts/RouteContext"; // Use Global State
import { Check } from "lucide-react";

const Home = () => {
  // Use global state instead of local useState
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

  const [pickingField, setPickingField] = React.useState(null);
  const [tempPickedLocation, setTempPickedLocation] = React.useState(null);

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

  const handleRouteCalculation = ({ origin, destination }) => {
    if (!isGraphReady) return alert("System initializing... please wait.");
    // 1. Find Nearest Nodes
    const startNode = graphRef.current.findNearestNode(origin.lat, origin.lng);
    const endNode = graphRef.current.findNearestNode(
      destination.lat,
      destination.lng
    );

    if (!startNode.node || !endNode.node)
      return alert("No nearby transport terminals found.");

    // 2. Dijkstra
    const transitPath = graphRef.current.findShortestPath(
      startNode.node.id,
      endNode.node.id
    );
    if (!transitPath) return alert("No route found.");

    // 3. Format
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

    setSelectedRoute({
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
    });
    setViewState("routing");
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
      {/* 1. MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          onMapClick={handleMapClick}
          onViewDetails={handleViewDetails}
          isPicking={viewState === "picking_location"}
          tempLocation={tempPickedLocation}
        />
      </div>

      {/* 2. UI LAYER: SEARCH */}
      {viewState === "idle" && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
          <TopSearchBar
            onRouteCalculated={handleRouteCalculation}
            onChooseOnMapMode={enterPickerMode}
          />
        </div>
      )}

      {/* 3. PICKER OVERLAY */}
      {viewState === "picking_location" && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center px-4">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg mb-4 text-sm font-semibold text-gray-700">
            Tap map to select {pickingField}
          </div>
          {tempPickedLocation && (
            <button
              onClick={() => {
                alert(`Location picked: ${tempPickedLocation.lat}`);
                setViewState("idle");
              }}
              className="w-full max-w-sm bg-primary text-white py-3 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2"
            >
              <Check size={20} /> Confirm Location
            </button>
          )}
        </div>
      )}

      {/* 4. SHEETS (Absolute positioning puts them inside this relative container, above map, below BottomNav if z-index correct) */}
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

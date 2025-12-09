import React, { useEffect, useState } from "react";
import MapCanvas from "../components/map/MapCanvas";
import TopSearchBar from "../components/navigation/TopSearchBar";
import RouteSheet from "../components/navigation/RouteSheet";
import TerminalSheet from "../components/navigation/TerminalSheet";
import { supabase } from "../lib/supabase";
import { useRouteContext } from "../contexts/RouteContext";
import { Check } from "lucide-react";

// Fallback Threshold
const MAX_WALK_DISTANCE_KM = 3.0; 

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
  const [searchMarkers, setSearchMarkers] = useState({ origin: null, destination: null });
  const [multiRoutes, setMultiRoutes] = useState(null); 
  const [activeMetric, setActiveMetric] = useState('recommended');

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

  // --- OSRM Direct Fallback (Unoptimized) ---
  const fetchDirectRoute = async (origin, destination) => {
    const distKm = graphRef.current.calculateDistance(origin, destination);
    const timeMins = Math.ceil(distKm / 5) * 60; 
    
    return {
        totalEta: timeMins,
        totalFare: 0, 
        totalDistance: distKm,
        isDirectFallback: true,
        key: 'unoptimized',
        polyline: {
            type: "FeatureCollection",
            features: [{ 
                type: "Feature", 
                geometry: { type: "LineString", coordinates: [[origin.lng, origin.lat], [destination.lng, destination.lat]] },
                properties: { type: "walk" }
            }]
        },
        steps: [{from: origin.name, to: destination.name, mode: "car", distance: `${distKm.toFixed(2)} km`, route: "Direct Path"}]
    };
  };

  // --- TRIP HISTORY LOGIC ---
  const handleSaveTrip = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
          alert("Please log in to save trip history.");
          return;
      }
      if (!selectedRoute) return;

      const { error } = await supabase
          .from('trip_history')
          .insert({
              user_id: user.id,
              origin_text: searchMarkers.origin?.name || 'Map Pin',
              destination_text: searchMarkers.destination?.name || 'Map Pin',
              fare: selectedRoute.fare,
              mode: selectedRoute.steps.find(s => s.mode !== 'walking')?.mode || 'car',
              distance_km: selectedRoute.distance,
              duration_mins: selectedRoute.eta,
          });

      if (error) {
          console.error("Failed to save trip history:", error);
          alert("Error saving trip. Check console.");
      } else {
          alert("Trip completed and saved to history!");
      }
      closeSheets();
  };


  // --- PRIMARY ROUTING ENGINE ---
  const handleRouteCalculation = async ({ origin, destination }) => {
    if (!isGraphReady) return alert("System initializing... please wait.");

    let startDistance = 0;
    let endDistance = 0;

    const startNode = graphRef.current.findNearestNode(origin.lat, origin.lng);
    const endNode = graphRef.current.findNearestNode(destination.lat, destination.lng);

    const startNodeId = startNode.node ? startNode.node.id : null;
    const endNodeId = endNode.node ? endNode.node.id : null;
    
    if (!startNodeId || !endNodeId) {
        return alert("No terminals found near one or both locations.");
    }

    startDistance = startNode.distance;
    endDistance = endNode.distance;
    
    if ((origin.id === null && startDistance > MAX_WALK_DISTANCE_KM) || (destination.id === null && endDistance > MAX_WALK_DISTANCE_KM)) {
        return alert("Location is too far (> 3km) from any transport terminal.");
    }

    // RUN DIJKSTRA FOR ALL METRICS
    const preferences = ['recommended', 'fastest', 'cheapest'];
    const calculatedRoutes = {};
    let foundTransitPath = false;

    for (const pref of preferences) {
        const path = graphRef.current.findShortestPath(startNodeId, endNodeId, pref);
        
        if (path) {
            foundTransitPath = true;
            
            const walkSpeed = 5;
            const startWalkTime = Math.ceil((startDistance / walkSpeed) * 60);
            const endWalkTime = Math.ceil((endDistance / walkSpeed) * 60);
            
            path.key = pref;
            path.totalEta += startWalkTime + endWalkTime;
            path.totalDistance += startDistance + endDistance;

            path.fullPolyline = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: [[origin.lng, origin.lat], [startNode.node.lng, startNode.node.lat]] },
                        properties: { type: "walk" },
                    },
                    {
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: path.path.map((s) => [s.lng, s.lat]) },
                        properties: { type: "transit" },
                    },
                    {
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: [[endNode.node.lng, endNode.node.lat], [destination.lng, destination.lat]] },
                        properties: { type: "walk" },
                    },
                ],
            };
            calculatedRoutes[pref] = path;
        }
    }
    
    // FALLBACK
    if (!foundTransitPath) {
        const directRoute = await fetchDirectRoute(origin, destination);
        if (directRoute) {
            calculatedRoutes.unoptimized = directRoute;
        } else {
            return alert("No route found (Internal or Direct).");
        }
    }
    
    const initialRoute = calculatedRoutes.recommended || calculatedRoutes.unoptimized;
    if (!initialRoute) return alert("Could not construct a valid route path.");
    
    setSelectedRoute(initialRoute);
    setMultiRoutes(calculatedRoutes);
    setActiveMetric(initialRoute.key);
    setViewState("routing_selection");
  };

  const selectFinalRoute = (key) => {
    const route = multiRoutes[key];
    if (route) {
        // Set the chosen route as the 'selectedRoute' for map display
        setSelectedRoute(route);
        // Navigate to the final active routing sheet
        setViewState("routing"); 
        setMultiRoutes(null);
    }
  };

  const handleSearchMarkerUpdate = (field, location) => {
    setSearchMarkers(prev => ({ ...prev, [field]: location }));
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

  const handleConfirmLocation = () => {
      if (pickingField && tempPickedLocation) {
          const newLocation = {
              lat: tempPickedLocation.lat,
              lng: tempPickedLocation.lng,
              name: "Pinned Location",
              id: null 
          };
          
          handleSearchMarkerUpdate(pickingField, newLocation);
          setViewState("idle");
          setTempPickedLocation(null);
      }
  };

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-gray-50">
      <div className="absolute inset-0 z-0">
        <MapCanvas
          onMapClick={handleMapClick}
          onViewDetails={handleViewDetails}
          isPicking={viewState === "picking_location"}
          tempLocation={tempPickedLocation}
          searchMarkers={searchMarkers}
          routePolyline={selectedRoute?.fullPolyline || selectedRoute?.polyline}
        />
      </div>

      {/* TOP SEARCH BAR */}
      {viewState !== "routing_selection" && (
        <div className="absolute top-0 left-0 right-0 z-[70] p-4 pointer-events-none">
          <TopSearchBar
            onRouteCalculated={handleRouteCalculation}
            onChooseOnMapMode={enterPickerMode}
            onLocationSelect={handleSearchMarkerUpdate}
          />
        </div>
      )}

      {/* PICKER OVERLAY */}
      {viewState === "picking_location" && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center px-4 pointer-events-auto">
          <div className="bg-white px-4 py-2 rounded-full shadow-lg mb-4 text-sm font-semibold text-gray-700 animate-in slide-in-from-bottom-5">
            Tap map to select {pickingField}
          </div>
          {tempPickedLocation && (
            <button
              onClick={handleConfirmLocation}
              className="w-full max-w-sm bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Check size={20} /> Confirm Location
            </button>
          )}
        </div>
      )}

      {/* ROUTE SELECTION MODAL */}
      {viewState === "routing_selection" && multiRoutes && (
        <div className="absolute inset-x-0 bottom-0 z-[100] flex flex-col items-center pointer-events-auto w-full">
            <h3 className="text-sm font-semibold text-white bg-gray-800 rounded-t-lg px-4 py-2">Select Best Route</h3>
            <div className="w-full max-h-[85vh] overflow-y-auto bg-gray-100 p-4 rounded-b-lg">
                {Object.entries(multiRoutes).map(([key, route]) => (
                    <div 
                        key={key} 
                        className={`bg-white rounded-xl p-4 mb-3 shadow-md border-2 cursor-pointer transition-all ${key === activeMetric ? 'border-emerald-500' : 'border-gray-200 hover:border-gray-400'}`}
                        onClick={() => setActiveMetric(key)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className={`text-lg font-bold ${key === 'unoptimized' ? 'text-red-500' : 'text-gray-800'}`}>{getRouteTitle(key)}</h4>
                                <div className="text-sm text-gray-600 mt-1 flex flex-col gap-1">
                                    <div className="flex items-center gap-1"><Clock size={14} className="text-blue-500"/> {Math.ceil(route.totalEta)} mins</div>
                                    <div className="flex items-center gap-1"><DollarSign size={14} className="text-green-500"/> {route.totalFare > 0 ? `₱${route.totalFare.toFixed(2)}` : 'FREE'}</div>
                                    <div className="text-xs text-gray-400">{route.totalDistance.toFixed(2)} km</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => selectFinalRoute(key)} 
                                className="bg-emerald-500 text-white py-2 px-4 rounded-lg font-bold shadow-md hover:bg-emerald-600 active:scale-95 transition-transform ml-4"
                            >
                                Start
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={closeSheets} className="w-full bg-gray-200 text-gray-700 py-3 font-semibold active:bg-gray-300">Cancel</button>
        </div>
      )}


      {/* ROUTE / TERMINAL SHEETS */}
      {viewState === "routing" && (
        // Pass the new save function
        <RouteSheet route={selectedRoute} onClose={closeSheets} onSaveTrip={handleSaveTrip} />
      )}
      {viewState === "terminal_details" && selectedTerminal && (
        <div className="absolute inset-x-0 bottom-0 z-[60] pointer-events-auto h-full pointer-events-none">
           <TerminalSheet terminal={selectedTerminal} onClose={closeSheets} />
        </div>
      )}
    </div>
  );
};

export default Home;
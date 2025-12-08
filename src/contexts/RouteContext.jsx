import React, { createContext, useContext, useState, useRef } from "react";
import { TransportGraph } from "../lib/graph";

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  // --- STATE THAT NEEDS TO BE REMEMBERED ---
  const [viewState, setViewState] = useState("idle"); // idle | searching | picking_location | routing | terminal_details
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.6515, 121.0493]); // Default QC
  const [mapZoom, setMapZoom] = useState(14);

  // Keep graph in context so we don't rebuild it every time we switch tabs
  const graphRef = useRef(new TransportGraph());
  const [isGraphReady, setIsGraphReady] = useState(false);

  // Helper to reset (optional)
  const resetState = () => {
    setViewState("idle");
    setSelectedRoute(null);
    setSelectedTerminal(null);
  };

  const value = {
    viewState,
    setViewState,
    selectedRoute,
    setSelectedRoute,
    selectedTerminal,
    setSelectedTerminal,
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    graphRef,
    isGraphReady,
    setIsGraphReady,
    resetState,
  };

  return (
    <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
  );
};

export const useRouteContext = () => {
  return useContext(RouteContext);
};

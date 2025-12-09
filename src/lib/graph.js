// src/lib/graph.js

// --- HELPER: Priority Queue ---
class PriorityQueue {
  constructor() {
    this.values = [];
  }
  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }
  dequeue() {
    return this.values.shift();
  }
  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }
  isEmpty() {
    return this.values.length === 0;
  }
}

// --- CONSTANTS ---
const MODE_SPEEDS = {
  tricycle: 20, // km/h
  jeep: 25,
  bus: 30,
  walking: 5, // Fallback
};

const RUSH_HOUR = {
  am: { start: 7, end: 9 },
  pm: { start: 17, end: 19 },
};

const BOARDING_BUFFER = 5; // Minutes

// --- MAIN CLASS ---
export class TransportGraph {
  constructor() {
    this.adjacencyList = new Map();
    this.stops = new Map();
  }

  // Helper to safely parse coordinates from DB
  parseCoord(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  buildGraph(stopsData, routesData) {
    // 1. Initialize Nodes (Stops)
    stopsData.forEach((stop) => {
      const lat = this.parseCoord(stop.lat);
      const lng = this.parseCoord(stop.lng);

      // Validate Coordinates
      if (lat === null || lng === null) {
          // console.warn(`Skipping invalid stop: ${stop.name} (${stop.id})`); // Reduced log noise
          return;
      }

      this.stops.set(stop.id, {
        id: stop.id,
        name: stop.name,
        lat: lat,
        lng: lng,
        type: stop.type,
      });
      this.adjacencyList.set(stop.id, []);
    });

    // 2. Build Edges (Routes)
    routesData.forEach((route) => {
      if (route.waypoints && route.waypoints.length > 1) {
        for (let i = 0; i < route.waypoints.length - 1; i++) {
          const fromId = route.waypoints[i];
          const toId = route.waypoints[i + 1];

          if (this.adjacencyList.has(fromId) && this.adjacencyList.has(toId)) {
            const stopA = this.stops.get(fromId);
            const stopB = this.stops.get(toId);
            
            // Calculate Physical Distance (in km)
            const distanceKm = this.calculateDistance(stopA, stopB);

            // Add Edge
            this.adjacencyList.get(fromId).push({
              node: toId,
              distance: distanceKm,
              details: {
                routeId: route.id,
                routeName: route.route_name,
                mode: route.mode,
                fare: parseFloat(route.fare) || 0,
              },
            });
          }
        }
      }
    });
  }

  // --- DYNAMIC ETA CALCULATION ---
  calculateDynamicETA(distanceKm, mode) {
    const now = new Date();
    const currentHour = now.getHours();

    const isRushHour =
      (currentHour >= RUSH_HOUR.am.start && currentHour < RUSH_HOUR.am.end) ||
      (currentHour >= RUSH_HOUR.pm.start && currentHour < RUSH_HOUR.pm.end);
    
    const trafficMultiplier = isRushHour ? 1.5 : 1.0;
    const speed = MODE_SPEEDS[mode?.toLowerCase()] || MODE_SPEEDS.walking;

    const travelTimeMinutes = (distanceKm / speed) * 60 * trafficMultiplier;

    return Math.ceil(travelTimeMinutes + BOARDING_BUFFER);
  }

  // --- WEIGHT CALCULATION ---
  getEdgeWeight(edge, preference) {
    const eta = this.calculateDynamicETA(edge.distance, edge.details.mode);
    const fare = edge.details.fare;

    switch (preference) {
      case "cheapest": return fare;
      case "fastest": return eta;
      case "recommended":
      default: return (fare * 0.6) + (eta * 0.4);
    }
  }

  // --- NEAREST NODE ---
  findNearestNode(lat, lng) {
    let nearestNode = null;
    let minDist = Infinity;

    this.stops.forEach((stop) => {
      const dist = this.calculateDistance({ lat, lng }, stop);
      if (dist < minDist) {
        minDist = dist;
        nearestNode = stop;
      }
    });

    return { node: nearestNode, distance: minDist };
  }

  // --- DIJKSTRA ALGORITHM ---
  findShortestPath(startNodeId, endNodeId, preference = "recommended") {
    const costs = {};
    const previous = {};
    const pq = new PriorityQueue();

    this.adjacencyList.forEach((_, key) => {
      if (key === startNodeId) {
        costs[key] = 0;
        pq.enqueue(key, 0);
      } else {
        costs[key] = Infinity;
        pq.enqueue(key, Infinity);
      }
      previous[key] = null;
    });

    while (!pq.isEmpty()) {
      const { val: currentId } = pq.dequeue();

      if (currentId === endNodeId) {
        return this.reconstructPath(previous, endNodeId);
      }

      if (currentId || costs[currentId] !== Infinity) {
        const neighbors = this.adjacencyList.get(currentId);
        
        if (neighbors) {
          for (let neighbor of neighbors) {
            const weight = this.getEdgeWeight(neighbor, preference);
            const candidateCost = costs[currentId] + weight;

            if (candidateCost < costs[neighbor.node]) {
              costs[neighbor.node] = candidateCost;
              previous[neighbor.node] = {
                node: currentId,
                details: neighbor.details,
                distance: neighbor.distance,
                calculatedEta: this.calculateDynamicETA(neighbor.distance, neighbor.details.mode)
              };
              pq.enqueue(neighbor.node, candidateCost);
            }
          }
        }
      }
    }
    return null;
  }

  // --- PATH RECONSTRUCTION ---
  reconstructPath(previous, endNodeId) {
    const path = [];
    const segments = [];
    let current = endNodeId;
    
    let totalFare = 0;
    let totalTime = 0;
    let totalDistance = 0;

    while (previous[current]) {
      const prevStep = previous[current];
      const fromNode = this.stops.get(prevStep.node);
      const toNode = this.stops.get(current);

      path.push(toNode);

      segments.push({
        from: fromNode.name,
        to: toNode.name,
        mode: prevStep.details.mode,
        route: prevStep.details.routeName,
        fare: prevStep.details.fare,
        eta: prevStep.calculatedEta,
        distance: prevStep.distance
      });

      totalFare += prevStep.details.fare;
      totalTime += prevStep.calculatedEta;
      totalDistance += prevStep.distance;

      current = prevStep.node;
    }
    
    path.push(this.stops.get(current));

    return {
      path: path.reverse(),
      segments: segments.reverse(),
      totalDistance: totalDistance,
      totalFare: totalFare,
      totalEta: totalTime,
    };
  }

  calculateDistance(stopA, stopB) {
    const R = 6371; 
    const dLat = this.deg2rad(stopB.lat - stopA.lat);
    const dLon = this.deg2rad(stopB.lng - stopA.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(stopA.lat)) * Math.cos(this.deg2rad(stopB.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) { return deg * (Math.PI / 180); }
}
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

// --- MAIN CLASS ---
export class TransportGraph {
  constructor() {
    this.adjacencyList = new Map();
    this.stops = new Map();
  }

  buildGraph(stopsData, routesData) {
    stopsData.forEach((stop) => {
      this.stops.set(stop.id, {
        id: stop.id,
        name: stop.name,
        lat: stop.lat,
        lng: stop.lng,
        type: stop.type,
      });
      this.adjacencyList.set(stop.id, []);
    });

    routesData.forEach((route) => {
      if (route.waypoints && route.waypoints.length > 1) {
        for (let i = 0; i < route.waypoints.length - 1; i++) {
          const fromId = route.waypoints[i];
          const toId = route.waypoints[i + 1];
          if (this.adjacencyList.has(fromId) && this.adjacencyList.has(toId)) {
            const weight = this.calculateDistance(
              this.stops.get(fromId),
              this.stops.get(toId)
            );
            this.adjacencyList.get(fromId).push({
              node: toId,
              weight,
              details: {
                routeId: route.id,
                routeName: route.route_name,
                mode: route.mode,
                fare: route.fare,
                eta: route.eta_minutes,
              },
            });
          }
        }
      }
    });
  }

  // --- NEW: FIND NEAREST STOP ---
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

  // --- DIJKSTRA ---
  findShortestPath(startNodeId, endNodeId) {
    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();

    this.adjacencyList.forEach((_, key) => {
      if (key === startNodeId) {
        distances[key] = 0;
        pq.enqueue(key, 0);
      } else {
        distances[key] = Infinity;
        pq.enqueue(key, Infinity);
      }
      previous[key] = null;
    });

    while (!pq.isEmpty()) {
      const { val: smallest } = pq.dequeue();
      if (smallest === endNodeId)
        return this.reconstructPath(previous, distances[endNodeId], endNodeId);
      if (smallest || distances[smallest] !== Infinity) {
        const neighbors = this.adjacencyList.get(smallest);
        if (neighbors) {
          for (let neighbor of neighbors) {
            let candidate = distances[smallest] + neighbor.weight;
            if (candidate < distances[neighbor.node]) {
              distances[neighbor.node] = candidate;
              previous[neighbor.node] = {
                node: smallest,
                details: neighbor.details,
              };
              pq.enqueue(neighbor.node, candidate);
            }
          }
        }
      }
    }
    return null;
  }

  reconstructPath(previous, totalRideDistance, endNodeId) {
    const path = [];
    const segments = [];
    let current = endNodeId;
    let totalFare = 0; // Simplified

    while (previous[current]) {
      const prevStep = previous[current];
      path.push(this.stops.get(current));

      segments.push({
        from: this.stops.get(prevStep.node).name,
        to: this.stops.get(current).name,
        mode: prevStep.details.mode,
        route: prevStep.details.routeName,
      });

      // Basic logic: Add fare if mode changes or first leg (Refine later)
      totalFare += 15; // Placeholder avg fare per leg

      current = prevStep.node;
    }
    path.push(this.stops.get(current));

    return {
      path: path.reverse(),
      segments: segments.reverse(),
      rideDistance: totalRideDistance,
      estimatedFare: totalFare,
      estimatedTime: (totalRideDistance / 20) * 60, // Rough ETA based on speed
    };
  }

  calculateDistance(stopA, stopB) {
    const R = 6371;
    const dLat = this.deg2rad(stopB.lat - stopA.lat);
    const dLon = this.deg2rad(stopB.lng - stopA.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(stopA.lat)) *
        Math.cos(this.deg2rad(stopB.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

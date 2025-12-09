// src/components/map/UserLocationMarker.jsx

// REMOVED UNNECESSARY DEFAULT IMPORT: In modern React (v19/Vite), the 'import React from 'react'' 
// statement is no longer required for components that only use JSX (no hooks) due to the automatic JSX runtime, 
// and its presence can sometimes prevent the component from rendering correctly.
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { isValidCoordinate } from '../../utils/mapUtils';

// Custom Icon for User Location (Relies on MapCanvas styles)
const userIcon = L.divIcon({ 
    className: "user-location-marker", 
    iconSize: [24, 24], 
    iconAnchor: [12, 12] 
});

const UserLocationMarker = ({ userLocation }) => {
    // CHECK IF LOCATION IS VALID BEFORE RENDERING THE MARKER
    if (!userLocation || !isValidCoordinate(userLocation.lat, userLocation.lng)) {
        return null;
    }
    
    // RENDER THE LEAFLET MARKER COMPONENT
    return (
        <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            zIndexOffset={9999}
        >
            <Popup>You are here</Popup>
        </Marker>
    );
};

export default UserLocationMarker;
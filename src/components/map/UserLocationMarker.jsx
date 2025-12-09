// src/components/map/UserLocationMarker.jsx
import React from 'react';
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
    if (!userLocation || !isValidCoordinate(userLocation.lat, userLocation.lng)) {
        return null;
    }
    
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
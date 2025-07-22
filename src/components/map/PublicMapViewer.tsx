import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Forecast } from '@/types/forecast';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PublicMapViewerProps {
  forecast?: Forecast;
  userLocation?: { lat: number; lng: number } | null; // Added userLocation prop
}

export const PublicMapViewer = ({ forecast, userLocation }: PublicMapViewerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null); // Ref to keep track of the user's marker

  useEffect(() => {
    if (!mapRef.current) return;

    // Dominican Republic bounds
    const dominicanBounds: L.LatLngBoundsExpression = [
      [17.5, -72.0], // Southwest
      [19.9, -68.3]  // Northeast
    ];

    const map = L.map(mapRef.current).fitBounds(dominicanBounds);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // Effect to handle forecast layers and user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !forecast) return;

    const map = mapInstanceRef.current;

    // Clear existing forecast layers (GeoJSON, ImageOverlay)
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON || layer instanceof L.ImageOverlay) {
        map.removeLayer(layer);
      }
    });

    // Add forecast trajectory
    if (forecast.trajectory) {
      L.geoJSON(forecast.trajectory, {
        style: (feature) => {
          return {
            color: '#ff0000',
            weight: 4,
            opacity: 0.8
          };
        }
      }).addTo(map);
    }

    // Add intensity zones
    if (forecast.intensity_map) {
      L.geoJSON(forecast.intensity_map, {
        style: (feature) => {
          return {
            color: '#0000ff',
            fillColor: '#0000ff',
            fillOpacity: 0.3,
            weight: 2
          };
        }
      }).addTo(map);
    }

    // Add user location marker if userLocation is provided
    if (userLocation) {
      // Remove previous marker if it exists
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      const marker = L.marker([userLocation.lat, userLocation.lng]).addTo(map);
      userMarkerRef.current = marker; // Store the new marker
    }

  }, [forecast, userLocation]); // Re-run effect when forecast or userLocation changes

  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

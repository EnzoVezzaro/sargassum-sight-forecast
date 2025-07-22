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
}

export const PublicMapViewer = ({ forecast }: PublicMapViewerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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

  useEffect(() => {
    if (!mapInstanceRef.current || !forecast) return;

    const map = mapInstanceRef.current;

    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON || layer instanceof L.ImageOverlay) {
        map.removeLayer(layer);
      }
    });

    // Add forecast image overlay
    /*
    if (forecast.image_url) {
      const currentBounds = map.getBounds();
      const center = currentBounds.getCenter();
      const originalWidthDegrees = currentBounds.getEast() - currentBounds.getWest();
      const originalHeightDegrees = currentBounds.getNorth() - currentBounds.getSouth();

      const newWidthDegrees = originalWidthDegrees * 0.70; // Reduce width to 70%
      const newHeightDegrees = originalHeightDegrees * 1.50; // Increase height to 150%

      const newBounds = L.latLngBounds([
        [center.lat - newHeightDegrees / 2, center.lng - newWidthDegrees / 2],
        [center.lat + newHeightDegrees / 2, center.lng + newWidthDegrees / 2]
      ]);

      L.imageOverlay(forecast.image_url, newBounds, {
        opacity: 0.7,
        className: 'forecast-overlay-shifted' // Add a class for CSS styling
      }).addTo(map);
    }
      */

    // Add trajectory
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
  }, [forecast]);

  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

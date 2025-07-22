import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapEditorProps {
  imageUrl?: string;
  onTrajectoryChange: (geoJson: any) => void;
  onIntensityMapChange?: (geoJson: any) => void;
}

export const MapEditor = ({ imageUrl, onTrajectoryChange, onIntensityMapChange }: MapEditorProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [imageOverlay, setImageOverlay] = useState<L.ImageOverlay | null>(null);

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

    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    // Add drawing controls
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true
      },
      draw: {
        polyline: {
          shapeOptions: {
            color: '#ff0000',
            weight: 3
          }
        },
        polygon: {
          shapeOptions: {
            color: '#0000ff',
            fillOpacity: 0.3
          }
        },
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false
      }
    });
    map.addControl(drawControl);

    // Handle drawing events
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      const geoJson = drawnItems.toGeoJSON();
      if (e.layerType === 'polyline') {
        onTrajectoryChange(geoJson);
      } else if (e.layerType === 'polygon' && onIntensityMapChange) {
        onIntensityMapChange(geoJson);
      }
    });

    map.on(L.Draw.Event.EDITED, () => {
      const geoJson = drawnItems.toGeoJSON();
      onTrajectoryChange(geoJson);
      if (onIntensityMapChange) {
        onIntensityMapChange(geoJson);
      }
    });

    map.on(L.Draw.Event.DELETED, () => {
      const geoJson = drawnItems.toGeoJSON();
      const featureCollection = geoJson as GeoJSON.FeatureCollection;
      if (featureCollection.features && featureCollection.features.length === 0) {
        onTrajectoryChange(null);
        if (onIntensityMapChange) {
          onIntensityMapChange(null);
        }
      } else {
        onTrajectoryChange(geoJson);
        if (onIntensityMapChange) {
          onIntensityMapChange(geoJson);
        }
      }
    });

    return () => {
      map.remove();
    };
  }, [onTrajectoryChange, onIntensityMapChange]);

  const toggleImageOverlay = () => {
    if (!mapInstanceRef.current || !imageUrl) return;

    if (imageOverlay) {
      mapInstanceRef.current.removeLayer(imageOverlay);
      setImageOverlay(null);
    } else {
      const bounds = mapInstanceRef.current.getBounds();
      const overlay = L.imageOverlay(imageUrl, bounds, {
        opacity: 0.7
      }).addTo(mapInstanceRef.current);
      setImageOverlay(overlay);
    }
  };

  return (
    <div className="space-y-4">
      {imageUrl && (
        <Button
          onClick={toggleImageOverlay}
          variant="outline"
        >
          {imageOverlay ? 'Hide' : 'Show'} Forecast Image
        </Button>
      )}
      <div
        ref={mapRef}
        className="w-full h-96 border rounded-lg"
        style={{ minHeight: '400px' }}
      />
      <p className="text-sm text-muted-foreground">
        Use the drawing tools to mark the sargassum affected zones (blue polygons) and higher intensity (red lines).
      </p>
    </div>
  );
};

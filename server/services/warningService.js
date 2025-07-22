import supabase from '../supabaseClient.js';
import * as turf from '@turf/turf'; // Import all turf functions under the turf namespace

export const checkSargassumImpact = async (lat, lng, forecastId = null) => {
  if (!lat || !lng) {
    throw new Error('Latitude and longitude are required.');
  }

  try {
    const userPoint = turf.point([parseFloat(lng), parseFloat(lat)]); // Turf expects [longitude, latitude]

    let forecast;
    if (forecastId) {
      // Fetch specific forecast by ID
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .eq('id', forecastId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching forecast by ID for warning:', error);
        throw new Error('Failed to fetch forecast data for warning check.');
      }
      forecast = data;
    } else {
      // Fetch the latest forecast if no ID is provided
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Error fetching latest forecast for warning:', error);
        throw new Error('Failed to fetch forecast data for warning check.');
      }
      forecast = data;
    }

    if (!forecast) {
      return { message: 'No forecast data available to check impact.' };
    }

    let isImpacted = false;

    // Check against trajectory (lines)
    if (forecast.trajectory && Array.isArray(forecast.trajectory.features)) {
      for (const feature of forecast.trajectory.features) {
        if (feature.geometry.type === 'LineString') {
          const line = turf.lineString(feature.geometry.coordinates);
          const distanceInKm = turf.pointToLineDistance(userPoint, line, { units: 'kilometers' });
          if (distanceInKm <= 10) {
            isImpacted = true;
            break;
          }
        }
      }
    }

    // Check against intensity map (polygons) if not already impacted by trajectory
    if (!isImpacted && forecast.intensity_map && Array.isArray(forecast.intensity_map.features)) {
      for (const feature of forecast.intensity_map.features) {
        if (feature.geometry.type === 'Polygon') {
          const polygonGeoJSON = turf.polygon(feature.geometry.coordinates);
          if (turf.booleanPointInPolygon(userPoint, polygonGeoJSON)) { // Use turf.booleanPointInPolygon
            isImpacted = true;
            break;
          }
        }
      }
    }

    return {
      message: isImpacted ? 'High Sargassum Impact Detected' : 'Low Sargassum Impact',
      isHighImpact: isImpacted,
      forecastId: forecast.id, // Use forecast.id
      forecastTitle: forecast.title, // Use forecast.title
    };

  } catch (err) {
    console.error('Server error in warning check:', err);
    throw new Error('Internal server error');
  }
};

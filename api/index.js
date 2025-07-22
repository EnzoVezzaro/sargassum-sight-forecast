import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchAllForecasts, getForecastById } from './services/forecastService.js';
import { checkSargassumImpact } from './services/warningService.js';

dotenv.config();

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// --- Express App ---
const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --- Routes ---

// GET /forecasts: Fetch all forecasts
app.get('/forecasts', async (req, res) => {
  try {
    const forecasts = await fetchAllForecasts();
    res.json(forecasts);
  } catch (error) {
    console.error('Error in /forecasts route:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /forecasts/:id: Fetch a single forecast by ID
app.get('/forecasts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const forecast = await getForecastById(id);
    if (!forecast) {
      return res.status(404).json({ error: `Forecast with ID ${id} not found.` });
    }
    res.json(forecast);
  } catch (error) {
    console.error(`Error in /forecasts/:id route for ID ${id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// GET /warning/:latLng/:forecastId (optional): Check for sargassum impact at given coordinates
app.get('/warning/:latLng/:forecastId?', async (req, res) => {
  const { latLng, forecastId } = req.params; // Get forecastId from params

  // Assuming latLng is in the format "(lat,lng)"
  const [lat, lng] = latLng.replace(/[()]/g, '').split(',');

  try {
    const result = await checkSargassumImpact(lat, lng, forecastId);
    res.json(result);
  } catch (error) {
    console.error('Error in /warning route:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /health: API health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// --- Start Server ---
// Check if Supabase credentials are loaded before starting
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is missing. Server will not start.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

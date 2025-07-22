import supabase from '../supabaseClient.js';

export const fetchAllForecasts = async () => {
  try {
    const { data, error } = await supabase
      .from('forecasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching forecasts:', error);
      throw new Error('Failed to fetch forecasts');
    }
    return data;
  } catch (err) {
    console.error('Server error fetching forecasts:', err);
    throw new Error('Internal server error');
  }
};

export const fetchLatestForecast = async () => {
  try {
    const { data, error } = await supabase
      .from('forecasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest forecast:', error);
      throw new Error('Failed to fetch latest forecast');
    }
    return data;
  } catch (err) {
    console.error('Server error fetching latest forecast:', err);
    throw new Error('Internal server error');
  }
};

export const getForecastById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('forecasts')
      .select('*')
      .eq('id', id)
      .single(); // Use single() to get a single row or null

    if (error) {
      console.error(`Error fetching forecast with ID ${id}:`, error);
      // Handle specific Supabase errors if needed, e.g., 'PGRST116' for not found
      if (error.code === 'PGRST116') {
        throw new Error(`Forecast with ID ${id} not found.`);
      }
      throw new Error(`Failed to fetch forecast with ID ${id}`);
    }
    return data;
  } catch (err) {
    console.error('Server error fetching forecast by ID:', err);
    throw err; // Re-throw the error to be caught by the route handler
  }
};

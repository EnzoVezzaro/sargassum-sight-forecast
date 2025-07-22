export interface Forecast {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  image_url: string;
  trajectory: any; // JSON data from Supabase
  intensity_map?: any; // JSON data from Supabase
  author_email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateForecastInput {
  title: string;
  start_date: string;
  end_date: string;
  image_url: string;
  trajectory: any; // Will be JSON stringified
  intensity_map?: any; // Will be JSON stringified
}
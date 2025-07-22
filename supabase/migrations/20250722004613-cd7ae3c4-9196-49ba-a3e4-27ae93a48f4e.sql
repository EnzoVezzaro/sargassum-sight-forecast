-- Create forecasts table
CREATE TABLE public.forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT NOT NULL,
  trajectory JSONB NOT NULL, -- GeoJSON data
  intensity_map JSONB, -- Optional zones data
  author_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies for forecasts
CREATE POLICY "Public can view all forecasts" 
ON public.forecasts 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create forecasts" 
ON public.forecasts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their own forecasts" 
ON public.forecasts 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND author_email = auth.jwt()->>'email');

CREATE POLICY "Authors can delete their own forecasts" 
ON public.forecasts 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND author_email = auth.jwt()->>'email');

-- Create storage bucket for forecast images
INSERT INTO storage.buckets (id, name, public) VALUES ('forecast-images', 'forecast-images', true);

-- Create storage policies for forecast images
CREATE POLICY "Anyone can view forecast images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'forecast-images');

CREATE POLICY "Authenticated users can upload forecast images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'forecast-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authors can update their own forecast images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'forecast-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authors can delete their own forecast images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'forecast-images' AND auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_forecasts_updated_at
BEFORE UPDATE ON public.forecasts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
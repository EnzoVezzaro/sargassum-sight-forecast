import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Forecast } from '@/types/forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublicMapViewer } from '@/components/map/PublicMapViewer';
import { useToast } from '@/hooks/use-toast';
import { Calendar, RefreshCw, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ForecastList } from '@/components/forecast/ForecastList'; // Import ForecastList

export const PublicViewer = () => {
  const { toast } = useToast();
  const [latestForecast, setLatestForecast] = useState<Forecast | null>(null); // Renamed to avoid confusion
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null); // State for selected forecast
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); // State for user's location
  const [isHighImpactArea, setIsHighImpactArea] = useState(false); // State to track if user is in high impact area

  const fetchLatestForecast = async () => {
    try {
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setLatestForecast(data);
      // If no forecast is selected yet, set the latest one as the initially displayed one
      if (!selectedForecast) {
        setSelectedForecast(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching forecast",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle forecast selection from the grid
  const handleForecastSelect = (forecast: Forecast) => {
    setSelectedForecast(forecast);
  };

  // Function to get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          // Placeholder for checking high impact:
          // setIsHighImpactArea(checkIfHighImpact(latitude, longitude, selectedForecast));
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not retrieve your location.",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Your browser does not support geolocation.",
      });
    }
  };

  // Effect to fetch location when component mounts or when a forecast is selected
  useEffect(() => {
    getUserLocation();
  }, [selectedForecast]); // Re-fetch location if selectedForecast changes

  // Effect to check for high impact area once location is available and forecast is loaded
  useEffect(() => {
    if (userLocation && selectedForecast) {
      // Placeholder logic: In a real scenario, you'd check if userLocation falls within
      // the impact zones defined in selectedForecast.
      // For now, let's simulate a high impact scenario if the forecast title contains "High Impact"
      const isHighImpact = selectedForecast.title?.toLowerCase().includes("high impact"); // Example placeholder check
      setIsHighImpactArea(isHighImpact);

      if (isHighImpact) {
        toast({
          title: "High Impact Alert!",
          description: "You are currently in an area with high sargassum impact.",
          duration: 10000, // Show alert for 10 seconds
        });
      }
    }
  }, [userLocation, selectedForecast, toast]);


  useEffect(() => {
    fetchLatestForecast();

    // Set up real-time subscription for new forecasts
    const channel = supabase
      .channel('forecast-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forecasts'
        },
        () => {
          fetchLatestForecast();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading forecast...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Sargassum Watch - Dominican Republic
            </h1>
            <Link to="/auth">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedForecast ? ( // Display selected forecast if available
          <div className="space-y-6">
            {/* New container for location info, placed before the map card */}
            {userLocation && (
              <Card className="w-full shadow-lg"> {/* Similar prominence to map card */}
                <CardHeader>
                  <CardTitle className="text-lg">Your Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">
                    Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
                  </p>
                  {isHighImpactArea ? (
                    <p className="text-sm font-semibold text-red-600">High Sargassum Impact Detected</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Low Sargassum Impact</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* The original Card for the selected forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{selectedForecast.title}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(selectedForecast.start_date), 'MMM dd, yyyy')} - {format(new Date(selectedForecast.end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <PublicMapViewer forecast={selectedForecast} />
                <div className="mt-4 text-sm text-muted-foreground"> {/* Details below map */}
                  <p>🔵 Blue areas show impacted sargassum areas</p>
                  <p>🔴 Red lines indicate zones of higher intensity</p>
                  <p>Last updated: {format(new Date(selectedForecast.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Section for Recent Forecasts Grid */}
            <div className="mt-8"> {/* Added margin-top for spacing */}
              <h2 className="text-2xl font-bold mb-4">Recent Forecasts</h2> {/* Added a heading for the grid */}
              <ForecastList 
                isEditable={false} 
                onSelectForecast={handleForecastSelect} 
                selectedForecastId={selectedForecast.id} // Pass the selected ID for highlighting
              /> {/* Render ForecastList without edit/delete options */}
            </div>
          </div>
        ) : ( // Fallback if no forecast is available at all
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold mb-2">No Forecast Available</h2>
              <p className="text-muted-foreground">
                No sargassum forecast has been published yet. Check back later for updates.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

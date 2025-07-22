import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Forecast } from '@/types/forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar, User, Pencil } from 'lucide-react'; // Import Pencil
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Modified to accept an isEditable prop and onSelectForecast prop
export const ForecastList = ({ 
  onEdit, 
  isEditable = false, 
  onSelectForecast, // New prop for selection
  selectedForecastId // Prop to receive the currently selected forecast ID
}: { 
  onEdit?: (forecastId: string) => void; 
  isEditable?: boolean; 
  onSelectForecast?: (forecast: Forecast) => void; // Function to call on selection
  selectedForecastId?: string; // ID of the currently selected forecast
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  // No need for local selectedForecastId state here, it will be managed by the parent

  const fetchForecasts = async () => {
    try {
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForecasts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching forecasts",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-added deleteForecast function
  const deleteForecast = async (id: string) => {
    try {
      const { error } = await supabase
        .from('forecasts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setForecasts(forecasts.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Forecast deleted successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting forecast",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  if (loading) {
    return <div className="text-center">Loading forecasts...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Recent Forecasts</h2>
      {forecasts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No forecasts uploaded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forecasts.map((forecast) => {
            const isSelected = forecast.id === selectedForecastId;
            return (
              <Card 
                key={forecast.id} 
                className={`w-full cursor-pointer ${isSelected ? 'border-2 border-primary' : ''}`} // Add selection styling
                onClick={() => onSelectForecast?.(forecast)} // Call onSelectForecast on click
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{forecast.title}</CardTitle>
                    {/* Conditionally render edit/delete buttons based on isEditable and user ownership */}
                    {isEditable && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            onEdit?.(forecast.id);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button // Delete button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click event
                            deleteForecast(forecast.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(forecast.start_date), 'MMM dd, yyyy')} - {format(new Date(forecast.end_date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {forecast.author_email}
                  </div>
                  {forecast.image_url && (
                    <img 
                      src={forecast.image_url} 
                      alt={forecast.title}
                      className="w-full max-h-48 object-contain border rounded mt-2"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

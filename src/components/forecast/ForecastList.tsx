import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Forecast } from '@/types/forecast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const ForecastList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid gap-4">
          {forecasts.map((forecast) => (
            <Card key={forecast.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{forecast.title}</CardTitle>
                  {user?.email === forecast.author_email && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteForecast(forecast.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
          ))}
        </div>
      )}
    </div>
  );
};
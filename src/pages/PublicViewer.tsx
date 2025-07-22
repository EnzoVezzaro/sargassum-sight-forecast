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

export const PublicViewer = () => {
  const { toast } = useToast();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestForecast = async () => {
    try {
      const { data, error } = await supabase
        .from('forecasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setForecast(data);
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
        {forecast ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{forecast.title}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(forecast.start_date), 'MMM dd, yyyy')} - {format(new Date(forecast.end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <PublicMapViewer forecast={forecast} />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>🔵 Blue areas show impacted sargassum areas</p>
                  <p>🔴 Red lines indicate zones of higher intensity</p>
                  <p>Last updated: {format(new Date(forecast.created_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
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
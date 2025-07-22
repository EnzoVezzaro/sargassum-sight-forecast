import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MapEditor } from '@/components/map/MapEditor';
import { CreateForecastInput } from '@/types/forecast';
import { Upload, Loader2 } from 'lucide-react';

export const ForecastUploader = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: ''
  });
  const [trajectory, setTrajectory] = useState<any>(null);
  const [intensityMap, setIntensityMap] = useState<any>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setImageFile(file);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('forecast-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('forecast-images')
        .getPublicUrl(data.path);

      setImageUrl(publicUrl.publicUrl);
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading image",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageUrl || !trajectory) {
      toast({
        variant: "destructive",
        title: "Missing data",
        description: "Please fill all required fields and draw a trajectory.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('forecasts')
        .insert({
          title: formData.title,
          start_date: formData.start_date,
          end_date: formData.end_date,
          image_url: imageUrl,
          trajectory: trajectory,
          intensity_map: intensityMap || null,
          author_email: user.email!
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Forecast saved successfully!",
      });

      // Reset form
      setFormData({ title: '', start_date: '', end_date: '' });
      setImageFile(null);
      setImageUrl('');
      setTrajectory(null);
      setIntensityMap(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving forecast",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Forecast Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image">Forecast Image</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img 
                  src={imageUrl} 
                  alt="Uploaded forecast" 
                  className="max-w-full h-32 object-contain border rounded"
                />
              </div>
            )}
          </div>

          <div>
            <Label>Map Editor</Label>
            <MapEditor
              imageUrl={imageUrl}
              onTrajectoryChange={setTrajectory}
              onIntensityMapChange={setIntensityMap}
            />
          </div>

          <Button type="submit" disabled={loading || uploading || !imageUrl || !trajectory}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Save Forecast
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
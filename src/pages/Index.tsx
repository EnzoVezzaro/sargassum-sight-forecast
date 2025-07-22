import { ForecastList } from '@/components/forecast/ForecastList'; // Import ForecastList

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4"> {/* Added p-4 for padding */}
      <div className="text-center mb-8"> {/* Added mb-8 for spacing */}
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
        <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
      </div>
      
      {/* Section for Recent Forecasts */}
      <div className="w-full max-w-4xl"> {/* Added max-width for better readability */}
        <ForecastList isEditable={false} /> {/* Render ForecastList without edit/delete options */}
      </div>
    </div>
  );
};

export default Index;

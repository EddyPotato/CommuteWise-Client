import { useState } from "react";
import {
  Clock,
  Ticket,
  Navigation,
  Footprints,
  Bus,
  MapPin,
  CheckCircle,
  X,
  Award,
  DollarSign,
  ArrowRight
} from "lucide-react";

// Added onSaveTrip prop
const RouteSheet = ({ route, onClose, onSaveTrip }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine height class based on state
  const heightClass = isActive ? "h-full" : isExpanded ? "h-[85%]" : "h-[40%]";

  if (!route) return null;

  const steps = route.steps || [];
  const currentInstruction = steps[currentStep];
  const totalSteps = steps.length;
  const isFinalStep = currentStep >= totalSteps - 1;

  const handleStartNavigation = () => {
      setIsActive(true);
      setCurrentStep(0);
      setIsExpanded(true); // Maximize sheet during active navigation
  };
  
  const handleNextStep = () => {
      if (currentStep < totalSteps - 1) {
          setCurrentStep(currentStep + 1);
      }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] w-full transition-all duration-500 ease-in-out flex flex-col z-50 ${heightClass}`}
    >
      {/* 1. HEADER / SUMMARY AREA */}
      <div
        className="w-full p-4 flex flex-col items-center bg-white rounded-t-3xl border-b border-gray-100"
      >
        {/* Toggle Bar */}
        <div 
            className="w-12 h-1.5 bg-gray-300 rounded-full mb-2 cursor-pointer" 
            onClick={() => {
                if (!isActive) setIsExpanded(!isExpanded);
            }}
        ></div>

        {/* Dynamic Header */}
        <div className="w-full flex justify-between items-center">
            <div className="flex flex-col">
                <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {isActive ? (
                        <span className="text-base text-gray-500">Step {currentStep + 1} of {totalSteps}</span>
                    ) : (
                        <>
                            {Math.ceil(route.eta)} min
                            <span className="text-sm font-normal text-gray-500">({route.distance} km)</span>
                        </>
                    )}
                </div>
                <div className="text-sm font-semibold text-gray-600 capitalize">
                    {isActive ? (
                        <p className="font-bold text-lg text-emerald-600">{isFinalStep ? 'Destination Reached' : `Go to ${currentInstruction?.to}`}</p>
                    ) : (
                        <span className={`text-sm font-semibold ${route.key === 'unoptimized' ? 'text-red-500' : 'text-green-600'}`}>
                            {route.key === 'unoptimized' ? 'Unoptimized Route' : 'Best Transit Route'}
                        </span>
                    )}
                </div>
            </div>

            {/* Total Fare / Close Button */}
            <div className="text-right">
                {isActive ? (
                    <button onClick={onClose} className="text-gray-500 p-1.5 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                ) : (
                    <div className="text-lg font-bold text-blue-600">
                        ₱{route.fare.toFixed(2)}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-gray-50 custom-scrollbar">
        
        {/* A. SUMMARY VIEW (Pre-Start) */}
        {!isActive && (
            <>
                <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
                    <button 
                        onClick={handleStartNavigation} 
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Navigation size={22} /> Start Navigation
                    </button>
                </div>

                <div className="p-5 pb-24">
                  <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-4">
                    Itinerary
                  </h3>

                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 mb-6 relative group">
                      {idx !== totalSteps - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-300 group-last:hidden"></div>
                      )}
                      {/* Icon */}
                      <div className="flex flex-col items-center z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                            step.mode === "walking" ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {step.mode === "walking" ? <Footprints size={16} /> : <Bus size={16} />}
                        </div>
                      </div>
                      {/* Text */}
                      <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <p className="font-bold text-gray-800 text-sm mb-1">
                          {step.from} → {step.to}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium capitalize">
                            {step.mode}
                          </span>
                          • {step.route}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
            </>
        )}

        {/* B. ACTIVE NAVIGATION VIEW (Post-Start) */}
        {isActive && currentInstruction && (
            <div className="p-4 bg-white">
                <div className="p-4 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50 mb-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">CURRENT INSTRUCTION:</p>
                    <p className="text-xl font-extrabold text-emerald-800">
                        {isFinalStep ? 'Destination Reached!' : currentInstruction.route}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                         {currentInstruction.from} to {currentInstruction.to}
                    </p>
                    <div className="flex gap-4 mt-3 text-sm font-medium">
                        <div className="flex items-center text-blue-600"><Clock size={14} className="mr-1"/> {currentInstruction.eta} mins</div>
                        <div className="flex items-center text-green-600"><DollarSign size={14} className="mr-1"/> ₱{currentInstruction.fare.toFixed(2)}</div>
                    </div>
                </div>

                {/* Next/Complete Button */}
                {!isFinalStep ? (
                    <button 
                        onClick={handleNextStep} 
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <ArrowRight size={20} /> Next Step
                    </button>
                ) : (
                    <button 
                        onClick={onSaveTrip} 
                        className="w-full bg-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <Award size={20} /> Complete Trip & Save
                    </button>
                )}

                <div className="pt-4 mt-4 border-t border-gray-200">
                    <h5 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Upcoming Steps:</h5>
                    {steps.slice(currentStep + 1).map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                            <span className="text-xs font-bold text-gray-400">Step {currentStep + 2 + idx}:</span>
                            {step.mode === 'walking' ? 'Walk' : 'Ride'} to {step.to}
                        </div>
                    ))}
                    {currentStep === totalSteps - 1 && <p className="text-center text-sm text-gray-500 italic">End of Route</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default RouteSheet;
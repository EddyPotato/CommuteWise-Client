// src/pages/History.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Route, DollarSign, Loader2, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
      
      if (!userData.user) {
        setLoading(false);
        return; 
      }

      // Fetch user's trip history
      const { data, error } = await supabase
        .from('trip_history')
        .select(`
          id,
          origin_text,
          destination_text,
          fare,
          trip_date,
          mode,
          distance_km,
          duration_mins
        `)
        .eq('user_id', userData.user.id)
        .order('trip_date', { ascending: false });

      if (error) {
        console.error("Error fetching history:", error.message);
      } else {
        setHistory(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (!user && !loading) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600">Please log in to view your trip history.</p>
        <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700">
            Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Trip History</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Route className="mx-auto text-gray-400" size={48} />
          <p className="mt-2 text-lg font-medium text-gray-600">No trips recorded yet.</p>
          <p className="text-sm text-gray-500">Your completed journeys will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((trip) => (
            <div key={trip.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-lg font-semibold text-gray-800">{trip.origin_text || 'Origin'} → {trip.destination_text || 'Destination'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={14} /> 
                    {new Date(trip.trip_date).toLocaleDateString()} at {new Date(trip.trip_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full text-white ${trip.mode === 'bus' ? 'bg-blue-500' : trip.mode === 'jeep' ? 'bg-purple-500' : 'bg-green-500'}`}>
                    {trip.mode}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={16} className="text-blue-500 mr-1.5" />
                  {trip.duration_mins || 0} mins
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign size={16} className="text-green-500 mr-1.5" />
                  ₱{trip.fare || '0.00'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Route size={16} className="text-gray-500 mr-1.5" />
                  {trip.distance_km || 0} km
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
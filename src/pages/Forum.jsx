// src/pages/Forum.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, ThumbsUp, ThumbsDown, MapPin, Loader2, AlertCircle, Plus, X, CornerRightDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReportFormModal = ({ isOpen, onClose, onReportSubmitted }) => {
  const [reportType, setReportType] = useState('Traffic');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationMessage, setLocationMessage] = useState('Click to get current location');

  const getCoordinates = () => {
    setLocationMessage('Fetching location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLng(position.coords.longitude.toFixed(6));
          setLocationMessage('Location captured!');
        },
        () => {
          setLocationMessage('Failed to get location.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationMessage('Geolocation not supported.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to submit a report.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('community_reports')
      .insert({
        user_id: user.id,
        type: reportType,
        description: description,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      });

    if (error) {
      alert(`Error submitting report: ${error.message}`);
    } else {
      onReportSubmitted();
      onClose();
      // Reset form
      setReportType('Traffic');
      setDescription('');
      setLat('');
      setLng('');
      setLocationMessage('Click to get current location');
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle size={24} className="text-red-500" /> New Community Report
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Issue Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500">
              <option>Traffic</option>
              <option>Accident</option>
              <option>Hazard</option>
              <option>Feedback</option>
              <option>Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea placeholder="Describe the situation or location..." value={description} onChange={(e) => setDescription(e.target.value)} required rows="3" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500"></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location (Lat/Lng)</label>
            <div className="flex gap-2 mt-1">
              <input type="text" placeholder="Latitude" value={lat} readOnly required className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
              <input type="text" placeholder="Longitude" value={lng} readOnly required className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
            </div>
            <button type="button" onClick={getCoordinates} className="mt-2 w-full text-sm text-blue-600 flex items-center justify-center gap-1 hover:underline">
              <CornerRightDown size={16} /> {locationMessage}
            </button>
          </div>

          <button type="submit" disabled={isSubmitting || !lat} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <AlertCircle size={20} />}
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};


const Forum = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    const { data, error } = await supabase
      .from('community_reports')
      .select(`
        id,
        type,
        description,
        status,
        upvotes,
        downvotes,
        lat,
        lng,
        created_at,
        profiles!community_reports_user_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error.message);
    } else {
      setReports(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleVote = async (reportId, voteType) => {
      // Logic for voting (requires public.report_votes table and RLS/Triggers)
      if (!user) return alert("Please log in to vote.");
      // This part would ideally be an RPC/Trigger that updates votes and prevents double voting.
      alert(`Simulating vote: ${voteType} on report ${reportId}`);
      fetchReports(); // Refresh list after simulated action
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Community Reports</h1>
        {user && (
            <button onClick={() => setIsModalOpen(true)} className="bg-red-500 text-white p-3 rounded-full shadow-lg flex items-center gap-1 hover:bg-red-600 transition-colors">
                <Plus size={20} /> Report
            </button>
        )}
      </div>
      
      {!user && <p className="text-center text-gray-500 mb-6">Log in to submit reports and vote.</p>}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <MessageSquare className="mx-auto text-gray-400" size={48} />
          <p className="mt-2 text-lg font-medium text-gray-600">No active community reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-500" />
                  <p className="text-lg font-bold text-gray-800 capitalize">{report.type || 'General Issue'}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${report.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {report.status}
                </span>
              </div>

              <p className="text-gray-700 mb-3">{report.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                <div className="flex items-center gap-3">
                    <p className="flex items-center gap-1">
                        <MapPin size={14} /> Lat: {report.lat.toFixed(4)}, Lng: {report.lng.toFixed(4)}
                    </p>
                    <p className="flex items-center gap-1">
                        Posted by {report.profiles?.first_name || 'Anon'} on {new Date(report.created_at).toLocaleDateString()}
                    </p>
                </div>
                
                {/* Voting Section */}
                <div className="flex gap-4">
                  <button onClick={() => handleVote(report.id, 'upvote')} disabled={!user} className={`flex items-center gap-1 font-semibold ${user ? 'text-green-600 hover:text-green-700' : 'text-gray-400 cursor-not-allowed'}`}>
                    <ThumbsUp size={16} /> {report.upvotes}
                  </button>
                  <button onClick={() => handleVote(report.id, 'downvote')} disabled={!user} className={`flex items-center gap-1 font-semibold ${user ? 'text-red-600 hover:text-red-700' : 'text-gray-400 cursor-not-allowed'}`}>
                    <ThumbsDown size={16} /> {report.downvotes}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReportFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onReportSubmitted={fetchReports} />
    </div>
  );
};

export default Forum;
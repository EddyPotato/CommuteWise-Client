// src/pages/Account.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Award, Clock, DollarSign, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Fetch user profile from the public.profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error.message);
          setProfile(null);
        } else {
          setProfile(data);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    } else {
      navigate('/'); // Redirect to login/auth page
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Guest Mode</h2>
        <p className="text-gray-600">You are continuing as a guest. Log in to manage your account details and reputation.</p>
        <button onClick={() => navigate('/')} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700">
            Go to Login/Signup
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-xl space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center space-x-4 border-b pb-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <User size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-gray-800">
              {profile?.first_name || 'Commuter'} {profile?.last_name || profile?.id?.slice(0, 4)}
            </h3>
            <p className="text-sm text-gray-500">{profile?.account_type} User</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <Mail size={20} className="text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-800">{session.user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <Award size={20} className="text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Reputation</p>
              <p className="text-base text-gray-800">{profile?.reputation_score || 100}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <DollarSign size={20} className="text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Discount</p>
              <p className="text-base text-gray-800">{profile?.discount_category || 'None'}</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-xl">
            <Clock size={20} className="text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Member Since</p>
              <p className="text-base text-gray-800">{new Date(profile?.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
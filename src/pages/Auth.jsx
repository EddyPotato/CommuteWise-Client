// src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignUp) {
        // Sign Up: Creates user and adds a default profile entry via RLS/Triggers
        result = await supabase.auth.signUp({ email, password });
      } else {
        // Login
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        // Successful login/signup, navigate to Home
        navigate('/home'); 
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    // Guest mode bypasses auth but lacks user-specific features (History, Account)
    navigate('/home'); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold text-emerald-600 mb-2 flex items-center gap-2">
          <Navigation size={32} /> CommuteWise
        </h1>
        <p className="text-gray-500 mb-8">
          {isSignUp ? 'Create your account for full access.' : 'Sign in to unlock full features.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            disabled={loading}
          />

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isSignUp ? (
              <UserPlus size={20} />
            ) : (
              <LogIn size={20} />
            )}
            {loading ? 'Processing...' : isSignUp ? 'Register' : 'Log In'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-emerald-600 mt-4 py-2 hover:underline"
          disabled={loading}
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
        
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute w-full border-t border-gray-200"></div>
          <span className="relative bg-white px-3 text-sm text-gray-500">OR</span>
        </div>

        <button
          onClick={handleGuest}
          className="w-full text-sm text-gray-600 border border-gray-300 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Continue as Guest <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Auth;
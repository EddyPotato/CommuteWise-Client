// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Auth from './pages/Auth';       // New: Login/Signup Page
import Home from './pages/Home';
import History from './pages/History';
import Account from './pages/Account';
import Forum from './pages/Forum';     // Community Tab
import { RouteContextProvider } from './contexts/RouteContext';

function App() {
  // NOTE: This simple setup uses <Navigate> to handle the / path for now.
  // In a real app, logic would check if user is authenticated here before navigating to /home.
  return (
    <RouteContextProvider>
      <Router>
        <Routes>
          {/* ROOT PATH: Redirects to Auth page */}
          <Route path="/" element={<Auth />} />

          {/* MAIN APPLICATION ROUTES (Require Bottom Nav) */}
          <Route element={<MainLayout />}>
            {/* Redirect /home root path to /home if needed, or set index. */}
            <Route path="/home" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/community" element={<Forum />} />
            <Route path="/account" element={<Account />} />
            
            {/* Add a default redirect for unrecognized paths */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Route>

        </Routes>
      </Router>
    </RouteContextProvider>
  );
}

export default App;
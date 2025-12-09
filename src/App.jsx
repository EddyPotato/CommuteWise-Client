// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Auth from './pages/Auth';       
import Home from './pages/Home';
import History from './pages/History';
import Account from './pages/Account';
import Forum from './pages/Forum';     
import { RouteProvider } from './contexts/RouteContext'; // Corrected Import Name

function App() {
  return (
    <RouteProvider>
      <Router>
        <Routes>
          {/* ROOT PATH: Redirects to Auth page */}
          <Route path="/" element={<Auth />} />

          {/* MAIN APPLICATION ROUTES */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/community" element={<Forum />} />
            <Route path="/account" element={<Account />} />
            
            {/* Add a default redirect for unrecognized paths */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Route>

        </Routes>
      </Router>
    </RouteProvider>
  );
}

export default App;
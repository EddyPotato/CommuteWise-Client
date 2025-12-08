import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Pages
import Home from "./pages/Home";
import Forum from "./pages/Forum";
import History from "./pages/History";
import Account from "./pages/Account";

// Placeholder for Login (we can build the full Auth flow next)
const Login = () => (
  <div className="p-10 text-center">Login Page (Coming Soon)</div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES (No Bottom Nav) */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED APP ROUTES (Wrapped in MainLayout) */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="forum" element={<Forum />} />
          <Route path="history" element={<History />} />
          <Route path="account" element={<Account />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

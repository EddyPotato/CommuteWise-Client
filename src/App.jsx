import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RouteProvider } from "./contexts/RouteContext"; // Import Provider

// Layouts
import MainLayout from "./layouts/MainLayout";

// Pages
import Home from "./pages/Home";
import Forum from "./pages/Forum";
import History from "./pages/History";
import Account from "./pages/Account";

const Login = () => (
  <div className="p-10 text-center">Login Page (Coming Soon)</div>
);

function App() {
  return (
    <RouteProvider>
      {" "}
      {/* Wrap everything here */}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="forum" element={<Forum />} />
            <Route path="history" element={<History />} />
            <Route path="account" element={<Account />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RouteProvider>
  );
}

export default App;

import React from "react";
import { User } from "lucide-react";

export default function Account() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <User size={48} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">My Account</h2>
      <p>Profile settings and preferences.</p>
    </div>
  );
}

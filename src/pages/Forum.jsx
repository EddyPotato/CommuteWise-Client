import React from "react";
import { MessageSquare } from "lucide-react";

export default function Forum() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <MessageSquare size={48} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">Community Forum</h2>
      <p>Connect with other commuters here soon.</p>
    </div>
  );
}

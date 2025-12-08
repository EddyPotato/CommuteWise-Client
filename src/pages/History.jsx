import React from "react";
import { History as HistoryIcon } from "lucide-react";

export default function History() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <HistoryIcon size={48} className="text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-800">Trip History</h2>
      <p>Your past routes will appear here.</p>
    </div>
  );
}

import { useState, useEffect } from "react";
import AIAssistant from "@/components/AIAssistant";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  
  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          AI-powered system management for {user?.displayName || user?.username || user?.email || "Administrator"}
        </p>
      </div>
      
      <AIAssistant />
    </div>
  );
}
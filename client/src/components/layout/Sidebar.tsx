import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Settings, 
  GanttChart, 
  Globe, 
  BarChart, 
  X
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col fixed top-0 bottom-0 bg-white border-r border-slate-200 shadow-sm z-50 transition-transform",
        "w-64 lg:w-80",
        open ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:static md:z-auto"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold mr-2">
              HL
            </div>
            <h1 className="text-lg font-heading font-semibold text-slate-800">HL Directory</h1>
          </div>
          <button 
            className="p-1 rounded-sm text-slate-400 hover:text-slate-600 md:hidden"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 pt-4 px-2 space-y-1">
          <Link href="/">
            <a className={cn(
              "sidebar-item",
              location === "/" ? "active" : "inactive"
            )}>
              <Home className="sidebar-icon" />
              Dashboard
            </a>
          </Link>
          
          <Link href="/listings">
            <a className={cn(
              "sidebar-item",
              location === "/listings" ? "active" : "inactive"
            )}>
              <GanttChart className="sidebar-icon" />
              Listings
            </a>
          </Link>
          
          <Link href="/configuration">
            <a className={cn(
              "sidebar-item",
              location === "/configuration" ? "active" : "inactive"
            )}>
              <Settings className="sidebar-icon" />
              Configuration
            </a>
          </Link>
          
          <Link href="/domains">
            <a className={cn(
              "sidebar-item",
              location === "/domains" ? "active" : "inactive"
            )}>
              <Globe className="sidebar-icon" />
              Domain Settings
            </a>
          </Link>
          
          <Link href="/analytics">
            <a className={cn(
              "sidebar-item",
              location === "/analytics" ? "active" : "inactive"
            )}>
              <BarChart className="sidebar-icon" />
              Analytics
            </a>
          </Link>
        </nav>
        
        {/* User info */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
              {user?.displayName ? user.displayName.charAt(0) : "U"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-800">
                {user?.displayName || "User"}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Settings, 
  GanttChart, 
  Globe, 
  BarChart,
  LogOut,
  User as UserIcon,
  Menu as MenuIcon,
  X,
  Bell,
  HelpCircle,
  Presentation,
  FolderOpen,
  Archive,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link href={href} className={cn(
      "flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-slate-700 hover:bg-slate-100/60 hover:text-primary"
    )}>
      {icon}
      <span className="ml-2">{label}</span>
    </Link>
  );
}

export default function TopNavbar() {
  const [location] = useLocation();
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get the current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUsername(userData.displayName || userData.username || userData.email || "User");
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to login page
    window.location.href = "/login";
  };

  const navLinks = [
    { href: "/", icon: <Home className="h-4 w-4" />, label: "Dashboard" },
    { href: "/directories", icon: <FolderOpen className="h-4 w-4" />, label: "Directories" },
    { href: "/listings", icon: <GanttChart className="h-4 w-4" />, label: "Listings" },
    { href: "/collections", icon: <Archive className="h-4 w-4" />, label: "Collections" },
    { href: "/google-drive-setup", icon: <Cloud className="h-4 w-4" />, label: "Google Drive" },
    { href: "/wizard", icon: <Presentation className="h-4 w-4" />, label: "Slideshow Wizard" },
    { href: "/config-wizard", icon: <Settings className="h-4 w-4" />, label: "Config Wizard" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold mr-2">
              DE
            </div>
            <h1 className="text-lg font-heading font-semibold text-slate-800 mr-8">Directory Engine</h1>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4 ml-4">
              {navLinks.map((link) => (
                <NavLink 
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  active={location === link.href}
                />
              ))}
            </nav>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          
          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary-500">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary-500">
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-sm px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100">
                  <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center mr-2">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[100px] text-ellipsis overflow-hidden whitespace-nowrap">{username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Mobile menu - dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-2 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2 text-base font-medium rounded-md",
                  location === link.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-slate-700 hover:bg-slate-100"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                <span className="ml-3">{link.label}</span>
              </Link>
            ))}
            
            {/* Mobile Logout Button */}
            <button 
              className="flex w-full items-center px-3 py-2 text-base font-medium rounded-md text-red-500 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
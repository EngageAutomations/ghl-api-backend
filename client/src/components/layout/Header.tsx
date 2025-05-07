import { Search, Bell, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex justify-between items-center px-4 py-3 md:px-6">
        {/* Mobile menu button and title */}
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-lg font-medium text-slate-800">HL Directory</h1>
        </div>
        
        {/* Search bar (hidden on mobile) */}
        <div className="hidden md:block">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-full"
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary-500">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="ml-2 text-slate-600 hover:text-primary-500">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

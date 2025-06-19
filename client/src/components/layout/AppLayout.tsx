import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Directories", href: "/directories", icon: "📁" },
    { name: "Listings", href: "/listings", icon: "📋" },
    { name: "Collections", href: "/collections", icon: "📚" },
    { name: "GHL Products", href: "/ghl-product-demo", icon: "🛍️" },
    { name: "Railway Test", href: "/railway-test", icon: "🔧" },
    { name: "API Management", href: "/api-management", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">GoHighLevel</h1>
          <p className="text-sm text-gray-600">Directory Manager</p>
        </div>
        
        <nav className="mt-6">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setLocation(item.href)}
              className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50 ${
                location === item.href
                  ? "text-blue-600 bg-blue-50 border-r-2 border-blue-600"
                  : "text-gray-700"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === location)?.name || "Dashboard"}
            </h2>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/wizard")}
              >
                Config Wizard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
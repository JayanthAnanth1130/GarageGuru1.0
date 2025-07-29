import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  ClipboardList, 
  TrendingUp, 
  Users, 
  Cog,
  Clock,
  IndianRupee,
  TriangleAlert 
} from "lucide-react";

export default function Dashboard() {
  const { user, garage } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();

  const { data: pendingJobs } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: salesStats } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "stats"],
    queryFn: async () => {
      if (!garage?.id || user?.role !== "garage_admin") return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/stats`);
      return response.json();
    },
    enabled: !!garage?.id && user?.role === "garage_admin",
  });

  const { data: lowStockParts } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts", "low-stock"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts/low-stock`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const pendingCount = pendingJobs?.length || 0;
  const lowStockCount = lowStockParts?.length || 0;
  const todaySales = salesStats?.totalServiceCharges || 0;

  const quickActions = [
    {
      title: "New Job Card",
      icon: ClipboardList,
      path: "/job-card",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Pending Services",
      icon: Clock,
      path: "/pending-services",
      bgColor: "warning-bg",
      iconColor: "warning-text",
    },
    {
      title: "Customers",
      icon: Users,
      path: "/customers",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600",
    },
    ...(user?.role === "garage_admin" ? [{
      title: "Spare Parts",
      icon: Cog,
      path: "/spare-parts",
      bgColor: "success-bg",
      iconColor: "success-text",
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">{garage?.name || "GarageGuru"}</h2>
            <p className="text-sm text-blue-100">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="w-5 h-5" />
            {lowStockCount > 0 && (
              <div className="notification-badge">{lowStockCount}</div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-white hover:bg-white/10"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="screen-content">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pending Jobs</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <div className="icon-container warning-bg">
                  <Clock className="warning-text text-xl w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Today's Sales</p>
                  <p className="text-2xl font-bold">₹{todaySales.toLocaleString()}</p>
                </div>
                <div className="icon-container success-bg">
                  <IndianRupee className="success-text text-xl w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="action-card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-6 flex flex-col items-center space-y-3">
                  <div className={`icon-container ${action.bgColor}`}>
                    <Icon className={`${action.iconColor} text-2xl w-8 h-8`} />
                  </div>
                  <span className="font-semibold text-center">{action.title}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TriangleAlert className="w-5 h-5 text-destructive" />
                <span className="font-semibold text-destructive">Low Stock Alert</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {lowStockCount} spare part{lowStockCount !== 1 ? 's' : ''} running low on stock
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/spare-parts")}
                className="text-primary border-primary"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

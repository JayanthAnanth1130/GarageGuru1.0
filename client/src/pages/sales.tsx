import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Filter, FileText, Settings, TrendingUp, IndianRupee } from "lucide-react";

export default function Sales() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();

  const { data: salesStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "sales", "stats"],
    queryFn: async () => {
      if (!garage?.id) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/sales/stats`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: recentInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "invoices"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/invoices`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Mock monthly data for chart representation (in production, this would come from the API)
  const monthlyData = [
    { name: "December", amount: salesStats?.totalProfit * 0.35 || 0, percentage: 75 },
    { name: "November", amount: salesStats?.totalProfit * 0.25 || 0, percentage: 55 },
    { name: "October", amount: salesStats?.totalProfit * 0.20 || 0, percentage: 45 },
    { name: "September", amount: salesStats?.totalProfit * 0.20 || 0, percentage: 40 },
  ];

  if (statsLoading || invoicesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Sales & Profits</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Sales & Profits</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      <div className="screen-content space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold">{salesStats?.totalInvoices || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Spare Parts Cost</p>
                  <p className="text-2xl font-bold">₹{(salesStats?.totalPartsTotal || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 warning-bg rounded-lg flex items-center justify-center">
                  <Settings className="warning-text w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Service Charges</p>
                  <p className="text-2xl font-bold">₹{(salesStats?.totalServiceCharges || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Profit</p>
                  <p className="text-2xl font-bold success-text">₹{(salesStats?.totalProfit || 0).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 success-bg rounded-lg flex items-center justify-center">
                  <TrendingUp className="success-text w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{month.name}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${month.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium">₹{month.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.slice(0, 5).map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(invoice.totalAmount).toLocaleString()}</p>
                      <p className="text-sm success-text">
                        +₹{(Number(invoice.serviceCharge) || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

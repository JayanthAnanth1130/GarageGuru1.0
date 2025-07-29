import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, User, Phone, FileText, Bike } from "lucide-react";
import { callCustomer } from "@/utils/whatsapp";

export default function Customers() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "customers"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/customers`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastVisit = (dateString: string | null) => {
    if (!dateString) return "No visits";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleViewInvoices = async (customerId: string) => {
    try {
      const response = await apiRequest("GET", `/api/garages/${garage?.id}/customers/${customerId}/invoices`);
      const invoices = await response.json();
      
      if (invoices.length === 0) {
        alert("No invoices found for this customer");
        return;
      }
      
      // For now, just show the count and open the first PDF if available
      const firstInvoice = invoices[0];
      if (firstInvoice.pdfUrl) {
        window.open(firstInvoice.pdfUrl, '_blank');
      } else {
        alert(`Customer has ${invoices.length} invoice(s) but no PDF available`);
      }
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
      alert("Failed to fetch customer invoices");
    }
  };

  if (isLoading) {
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
            <h2 className="text-lg font-semibold">Customers</h2>
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
          <h2 className="text-lg font-semibold">Customers</h2>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{filteredCustomers.length} Customers</span>
        </div>
      </div>

      <div className="screen-content">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
        </div>

        {/* Customer List */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No customers found matching your search" : "No customers yet"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer: any) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="text-primary w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Bike className="w-3 h-3" />
                          <span>{customer.bikeNumber}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => callCustomer(customer.phone)}
                        className="w-10 h-10 success-bg hover:bg-green-200 dark:hover:bg-green-900/30"
                      >
                        <Phone className="success-text w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewInvoices(customer.id)}
                        className="w-10 h-10 bg-primary/10 hover:bg-primary/20"
                      >
                        <FileText className="text-primary w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Total Jobs: {customer.totalJobs || 0}</span>
                      <span>Last Visit: {formatLastVisit(customer.lastVisit)}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      ₹{Number(customer.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

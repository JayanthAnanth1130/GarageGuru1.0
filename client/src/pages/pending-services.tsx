import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Bike, Phone, Calendar } from "lucide-react";
import { useState } from "react";

export default function PendingServices() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pendingJobs = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", "pending"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards?status=pending`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const filteredJobs = pendingJobs.filter((job: any) =>
    job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.bikeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.phone.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })}`;
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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
            <h2 className="text-lg font-semibold">Pending Services</h2>
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
          <h2 className="text-lg font-semibold">Pending Services</h2>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full">
          <span className="text-sm font-medium">{filteredJobs.length} Jobs</span>
        </div>
      </div>

      <div className="screen-content">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by customer name or bike number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
        </div>

        {/* Job Cards List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No jobs found matching your search" : "No pending services"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job: any) => (
              <Card key={job.id} className="border-l-4 border-l-warning">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{job.customerName}</h3>
                    <Badge variant="secondary" className="warning-bg warning-text">
                      Pending
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-2">
                      <Bike className="w-4 h-4" />
                      <span>{job.bikeNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{job.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-foreground mb-3 line-clamp-2">
                    {job.complaint}
                  </p>

                  {job.spareParts && job.spareParts.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Parts: {job.spareParts.map((part: any) => part.name).join(", ")}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement view details modal or page
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/invoice/${job.id}`)}
                    >
                      Generate Invoice
                    </Button>
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

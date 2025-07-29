import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, QrCode, Plus, Trash2, Scan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

interface SparePartUsed {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function JobCard() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startScanning } = useBarcodeScanner();

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    bikeNumber: "",
    complaint: "",
    date: new Date().toISOString().split('T')[0],
  });

  const [selectedParts, setSelectedParts] = useState<SparePartUsed[]>([]);

  const { data: spareParts = [] } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const createJobCardMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("POST", `/api/garages/${garage.id}/job-cards`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job card created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      navigate("/pending-services");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create job card",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSparePart = () => {
    setSelectedParts(prev => [...prev, { id: "", name: "", quantity: 1, price: 0 }]);
  };

  const updateSparePart = (index: number, field: string, value: any) => {
    setSelectedParts(prev => {
      const updated = [...prev];
      if (field === "id") {
        const part = spareParts.find((p: any) => p.id === value);
        if (part) {
          updated[index] = {
            id: part.id,
            name: part.name,
            quantity: updated[index].quantity,
            price: Number(part.price),
          };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const removeSparePart = (index: number) => {
    setSelectedParts(prev => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScanned = (barcode: string) => {
    const part = spareParts.find((p: any) => p.barcode === barcode);
    if (part) {
      const existingIndex = selectedParts.findIndex(p => p.id === part.id);
      if (existingIndex >= 0) {
        updateSparePart(existingIndex, "quantity", selectedParts[existingIndex].quantity + 1);
      } else {
        setSelectedParts(prev => [...prev, {
          id: part.id,
          name: part.name,
          quantity: 1,
          price: Number(part.price),
        }]);
      }
      toast({
        title: "Part Added",
        description: `${part.name} added to job card`,
      });
    } else {
      toast({
        title: "Part Not Found",
        description: "No spare part found with this barcode",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = selectedParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    
    createJobCardMutation.mutate({
      ...formData,
      spareParts: selectedParts,
      totalAmount,
    });
  };

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
          <h2 className="text-lg font-semibold">New Job Card</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => startScanning(handleBarcodeScanned)}
          className="text-white hover:bg-white/10"
        >
          <QrCode className="w-5 h-5" />
        </Button>
      </div>

      <div className="screen-content">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bikeNumber">Bike Number</Label>
                <Input
                  id="bikeNumber"
                  value={formData.bikeNumber}
                  onChange={(e) => handleInputChange("bikeNumber", e.target.value)}
                  placeholder="Enter bike registration number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Complaint Description */}
          <Card>
            <CardHeader>
              <CardTitle>Complaint Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.complaint}
                onChange={(e) => handleInputChange("complaint", e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
                required
              />
            </CardContent>
          </Card>

          {/* Spare Parts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spare Parts Used</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={addSparePart}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedParts.map((part, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Select
                      value={part.id}
                      onValueChange={(value) => updateSparePart(index, "id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select spare part..." />
                      </SelectTrigger>
                      <SelectContent>
                        {spareParts.map((sparePart: any) => (
                          <SelectItem key={sparePart.id} value={sparePart.id}>
                            {sparePart.name} - ₹{sparePart.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(index, "quantity", parseInt(e.target.value))}
                    className="w-20"
                    placeholder="Qty"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSparePart(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => startScanning(handleBarcodeScanned)}
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan Barcode/QR Code
              </Button>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            disabled={createJobCardMutation.isPending}
          >
            {createJobCardMutation.isPending ? "Saving..." : "Save Job Card"}
          </Button>
        </form>
      </div>
    </div>
  );
}

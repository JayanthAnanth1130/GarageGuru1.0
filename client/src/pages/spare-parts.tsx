import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Plus, Edit, Trash2, TriangleAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SparePartForm {
  name: string;
  partNumber: string;
  price: string;
  quantity: string;
  lowStockThreshold: string;
  barcode: string;
}

export default function SpareParts() {
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [formData, setFormData] = useState<SparePartForm>({
    name: "",
    partNumber: "",
    price: "",
    quantity: "",
    lowStockThreshold: "2",
    barcode: "",
  });

  const { data: spareParts = [], isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const { data: lowStockParts = [] } = useQuery({
    queryKey: ["/api/garages", garage?.id, "spare-parts", "low-stock"],
    queryFn: async () => {
      if (!garage?.id) return [];
      const response = await apiRequest("GET", `/api/garages/${garage.id}/spare-parts/low-stock`);
      return response.json();
    },
    enabled: !!garage?.id,
  });

  const createPartMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("POST", `/api/garages/${garage.id}/spare-parts`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Spare part created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create spare part",
        variant: "destructive",
      });
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("PUT", `/api/garages/${garage.id}/spare-parts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Spare part updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update spare part",
        variant: "destructive",
      });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("DELETE", `/api/garages/${garage.id}/spare-parts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Spare part deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete spare part",
        variant: "destructive",
      });
    },
  });

  const filteredParts = spareParts.filter((part: any) => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showLowStockOnly) {
      return matchesSearch && part.quantity <= part.lowStockThreshold;
    }
    
    return matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      partNumber: "",
      price: "",
      quantity: "",
      lowStockThreshold: "2",
      barcode: "",
    });
    setEditingPart(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (part: any) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      partNumber: part.partNumber,
      price: part.price.toString(),
      quantity: part.quantity.toString(),
      lowStockThreshold: part.lowStockThreshold.toString(),
      barcode: part.barcode || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      partNumber: formData.partNumber,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      barcode: formData.barcode || null,
    };

    if (editingPart) {
      updatePartMutation.mutate({ id: editingPart.id, data });
    } else {
      createPartMutation.mutate(data);
    }
  };

  const handleDelete = (part: any) => {
    if (confirm(`Are you sure you want to delete "${part.name}"?`)) {
      deletePartMutation.mutate(part.id);
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
            <h2 className="text-lg font-semibold">Spare Parts</h2>
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
          <h2 className="text-lg font-semibold">Spare Parts</h2>
        </div>
      </div>

      <div className="screen-content">
        {/* Add New Part Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Add New Part
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>{editingPart ? "Edit" : "Add New"} Spare Part</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Part Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, partNumber: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="barcode">Barcode (Optional)</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createPartMutation.isPending || updatePartMutation.isPending}
                >
                  {editingPart ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Search and Filter */}
        <div className="flex space-x-2 mb-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={showLowStockOnly ? "border-destructive bg-destructive text-destructive-foreground" : "border-destructive text-destructive"}
          >
            <TriangleAlert className="w-4 h-4" />
          </Button>
        </div>

        {/* Parts List */}
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                {searchTerm ? "No parts found matching your search" : "No spare parts yet"}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredParts.map((part: any) => (
              <Card key={part.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{part.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          #{part.partNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Price: ₹{Number(part.price).toFixed(2)}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">Stock:</span>
                          <span 
                            className={`text-sm font-medium ${
                              part.quantity <= part.lowStockThreshold ? 'text-destructive' : 'text-foreground'
                            }`}
                          >
                            {part.quantity}
                          </span>
                        </div>
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            part.quantity <= part.lowStockThreshold ? 'bg-destructive' : 'bg-green-500'
                          }`}
                        />
                        {part.quantity <= part.lowStockThreshold && (
                          <Badge variant="destructive" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(part)}
                        className="px-3 py-1 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(part)}
                        className="px-3 py-1 text-xs text-destructive border-destructive hover:bg-destructive/10"
                        disabled={deletePartMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
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

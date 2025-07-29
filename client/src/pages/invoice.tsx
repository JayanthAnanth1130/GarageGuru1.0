import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDF, uploadPDFToCloudinary } from "@/utils/pdf-generator";
import { sendWhatsAppMessage } from "@/utils/whatsapp";

export default function Invoice() {
  const { jobCardId } = useParams();
  const [, navigate] = useLocation();
  const { garage } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [serviceCharge, setServiceCharge] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: jobCard, isLoading } = useQuery({
    queryKey: ["/api/garages", garage?.id, "job-cards", jobCardId],
    queryFn: async () => {
      if (!garage?.id || !jobCardId) return null;
      const response = await apiRequest("GET", `/api/garages/${garage.id}/job-cards`);
      const jobCards = await response.json();
      return jobCards.find((jc: any) => jc.id === jobCardId);
    },
    enabled: !!garage?.id && !!jobCardId,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      if (!garage?.id) throw new Error("No garage selected");
      const response = await apiRequest("POST", `/api/garages/${garage.id}/invoices`, invoiceData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/garages", garage?.id] });
      navigate("/pending-services");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-header">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/pending-services")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Generate Invoice</h2>
          </div>
        </div>
        <div className="screen-content flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!jobCard || !garage) {
    return (
      <div className="min-h-screen bg-background">
        <div className="screen-content flex items-center justify-center">
          <div className="text-destructive">Job card not found</div>
        </div>
      </div>
    );
  }

  const partsTotal = Array.isArray(jobCard.spareParts) 
    ? jobCard.spareParts.reduce((sum: number, part: any) => sum + (part.price * part.quantity), 0)
    : 0;
  
  const totalAmount = partsTotal + serviceCharge;
  const invoiceNumber = `INV-${Date.now()}`;

  const handleGeneratePDF = async (sendWhatsApp: boolean = false) => {
    setIsGenerating(true);
    
    try {
      // Generate PDF
      const pdfBlob = generateInvoicePDF({
        jobCard,
        garage,
        serviceCharge,
        invoiceNumber,
      });
      
      // Upload to Cloudinary
      const pdfUrl = await uploadPDFToCloudinary(pdfBlob);
      
      // Create invoice record
      await createInvoiceMutation.mutateAsync({
        jobCardId: jobCard.id,
        customerId: jobCard.customerId,
        invoiceNumber,
        pdfUrl,
        totalAmount,
        partsTotal,
        serviceCharge,
        whatsappSent: sendWhatsApp,
      });
      
      if (sendWhatsApp) {
        // Send WhatsApp message
        sendWhatsAppMessage(jobCard.phone, pdfUrl);
        toast({
          title: "Success",
          description: "Invoice generated and WhatsApp opened",
        });
      } else {
        // Just download PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Invoice PDF downloaded",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="screen-header">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/pending-services")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">Generate Invoice</h2>
        </div>
      </div>

      <div className="screen-content space-y-4">
        {/* Invoice Preview */}
        <Card>
          <CardContent className="p-4">
            {/* Garage Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="text-primary w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">{garage.name}</h3>
                <p className="text-sm text-muted-foreground">{garage.phone}</p>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span>{jobCard.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bike Number:</span>
                <span>{jobCard.bikeNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complaint:</span>
                <span className="text-right max-w-[200px]">{jobCard.complaint}</span>
              </div>
            </div>

            {/* Services & Parts */}
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold mb-3">Services & Parts</h4>
              
              <div className="space-y-2">
                {Array.isArray(jobCard.spareParts) && jobCard.spareParts.map((part: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{part.name} x{part.quantity}</span>
                    <span>₹{(part.price * part.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts Total:</span>
                  <span>₹{partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Service Charge:</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(Number(e.target.value))}
                    className="w-24 h-8 text-right text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t border-border">
                  <span>Total Amount:</span>
                  <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => handleGeneratePDF(true)}
            disabled={isGenerating}
            className="w-full"
          >
            <Share className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate PDF & Send WhatsApp"}
          </Button>
          
          <Button
            onClick={() => handleGeneratePDF(false)}
            disabled={isGenerating}
            variant="outline"
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

import jsPDF from 'jspdf';
import type { JobCard, Garage } from '@shared/schema';

interface InvoiceData {
  jobCard: JobCard;
  garage: Garage;
  serviceCharge: number;
  invoiceNumber: string;
}

export function generateInvoicePDF(data: InvoiceData): Blob {
  const { jobCard, garage, serviceCharge, invoiceNumber } = data;
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  
  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(garage.name, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(garage.phone, pageWidth / 2, 30, { align: 'center' });
  
  // Invoice details
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth / 2, 50, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  // Customer details
  let yPos = 70;
  pdf.text(`Invoice Number: ${invoiceNumber}`, 20, yPos);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos + 10);
  pdf.text(`Customer: ${jobCard.customerName}`, 20, yPos + 20);
  pdf.text(`Phone: ${jobCard.phone}`, 20, yPos + 30);
  pdf.text(`Bike Number: ${jobCard.bikeNumber}`, 20, yPos + 40);
  
  // Services & Parts
  yPos += 60;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Services & Parts:', 20, yPos);
  
  pdf.setFont('helvetica', 'normal');
  yPos += 10;
  
  let partsTotal = 0;
  
  if (jobCard.spareParts && Array.isArray(jobCard.spareParts)) {
    jobCard.spareParts.forEach((part: any) => {
      const lineTotal = part.price * part.quantity;
      partsTotal += lineTotal;
      
      pdf.text(`${part.name} x${part.quantity}`, 20, yPos);
      pdf.text(`₹${lineTotal.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
      yPos += 10;
    });
  }
  
  // Totals
  yPos += 10;
  pdf.line(20, yPos, pageWidth - 20, yPos); // Line separator
  
  yPos += 10;
  pdf.text('Parts Total:', 20, yPos);
  pdf.text(`₹${partsTotal.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
  
  yPos += 10;
  pdf.text('Service Charge:', 20, yPos);
  pdf.text(`₹${serviceCharge.toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
  
  yPos += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Amount:', 20, yPos);
  pdf.text(`₹${(partsTotal + serviceCharge).toFixed(2)}`, pageWidth - 40, yPos, { align: 'right' });
  
  // Footer
  yPos += 30;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Thank you for choosing ' + garage.name, pageWidth / 2, yPos, { align: 'center' });
  
  return pdf.output('blob');
}

export async function uploadPDFToCloudinary(pdfBlob: Blob): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || 'garage_guru_pdfs';
  
  const formData = new FormData();
  formData.append('file', pdfBlob);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', 'raw');
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to upload PDF');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload PDF to cloud storage');
  }
}

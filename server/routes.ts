import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertGarageSchema, insertCustomerSchema, insertSparePartSchema, insertJobCardSchema, insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware for authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware for role-based access
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware for garage isolation
const requireGarageAccess = (req: any, res: any, next: any) => {
  if (req.user.role === 'super_admin') {
    next();
    return;
  }
  
  const garageId = req.params.garageId || req.body.garageId;
  if (!garageId || garageId !== req.user.garageId) {
    return res.status(403).json({ message: 'Access denied to this garage' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, activationCode, garageName, ownerName, phone } = req.body;
      
      // Validate activation codes
      const validCodes = {
        'GG-ADMIN-2025': 'garage_admin',
        'GG-STAFF-2025': 'mechanic_staff'
      };
      
      if (!validCodes[activationCode as keyof typeof validCodes]) {
        return res.status(400).json({ message: 'Invalid activation code' });
      }
      
      const role = validCodes[activationCode as keyof typeof validCodes];
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      let garageId = null;
      
      // Create garage for admin users
      if (role === 'garage_admin') {
        const garage = await storage.createGarage({
          name: garageName,
          ownerName,
          phone,
          email
        });
        garageId = garage.id;
      }
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        garageId
      });
      
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      
      res.json({ 
        token, 
        user: { ...user, password: undefined },
        garage: garageId ? await storage.getGarage(garageId) : null
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ email: user.email, id: user.id }, JWT_SECRET);
      
      let garage = null;
      if (user.garageId) {
        garage = await storage.getGarage(user.garageId);
      }
      
      res.json({ 
        token, 
        user: { ...user, password: undefined },
        garage
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      let garage = null;
      if (req.user.garageId) {
        garage = await storage.getGarage(req.user.garageId);
      }
      
      res.json({ 
        user: { ...req.user, password: undefined },
        garage
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Garage routes
  app.put("/api/garages/:id", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertGarageSchema.partial().parse(req.body);
      
      const garage = await storage.updateGarage(id, updateData);
      res.json(garage);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update garage' });
    }
  });

  // Customer routes
  app.get("/api/garages/:garageId/customers", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const customers = await storage.getCustomers(garageId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customers' });
    }
  });

  app.post("/api/garages/:garageId/customers", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const customerData = insertCustomerSchema.parse({ ...req.body, garageId });
      
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });

  app.get("/api/garages/:garageId/customers/:customerId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId, customerId } = req.params;
      const invoices = await storage.getCustomerInvoices(customerId, garageId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch customer invoices' });
    }
  });

  // Spare parts routes
  app.get("/api/garages/:garageId/spare-parts", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const spareParts = await storage.getSpareParts(garageId);
      res.json(spareParts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch spare parts' });
    }
  });

  app.get("/api/garages/:garageId/spare-parts/low-stock", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const lowStockParts = await storage.getLowStockParts(garageId);
      res.json(lowStockParts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch low stock parts' });
    }
  });

  app.post("/api/garages/:garageId/spare-parts", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const partData = insertSparePartSchema.parse({ ...req.body, garageId });
      
      const sparePart = await storage.createSparePart(partData);
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create spare part' });
    }
  });

  app.put("/api/garages/:garageId/spare-parts/:id", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertSparePartSchema.partial().parse(req.body);
      
      const sparePart = await storage.updateSparePart(id, updateData);
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update spare part' });
    }
  });

  app.delete("/api/garages/:garageId/spare-parts/:id", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId, id } = req.params;
      await storage.deleteSparePart(id, garageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete spare part' });
    }
  });

  // Job card routes
  app.get("/api/garages/:garageId/job-cards", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const { status } = req.query;
      const jobCards = await storage.getJobCards(garageId, status as string);
      res.json(jobCards);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch job cards' });
    }
  });

  app.post("/api/garages/:garageId/job-cards", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const jobCardData = insertJobCardSchema.parse({ ...req.body, garageId });
      
      // Create or find customer
      let customer = await storage.getCustomers(garageId).then(customers => 
        customers.find(c => c.phone === jobCardData.phone && c.bikeNumber === jobCardData.bikeNumber)
      );
      
      if (!customer) {
        customer = await storage.createCustomer({
          garageId,
          name: jobCardData.customerName,
          phone: jobCardData.phone,
          bikeNumber: jobCardData.bikeNumber
        });
      }
      
      const jobCard = await storage.createJobCard({
        ...jobCardData,
        customerId: customer.id,
        spareParts: jobCardData.spareParts || []
      });
      
      // Update spare parts quantities
      if (jobCard.spareParts && Array.isArray(jobCard.spareParts)) {
        for (const part of jobCard.spareParts) {
          const sparePart = await storage.getSparePart(part.id, garageId);
          if (sparePart) {
            await storage.updateSparePart(part.id, {
              quantity: sparePart.quantity - part.quantity
            });
          }
        }
      }
      
      res.json(jobCard);
    } catch (error) {
      console.error('Job card creation error:', error);
      res.status(500).json({ message: 'Failed to create job card' });
    }
  });

  app.put("/api/garages/:garageId/job-cards/:id", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertJobCardSchema.partial().parse(req.body);
      
      const jobCard = await storage.updateJobCard(id, updateData);
      res.json(jobCard);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update job card' });
    }
  });

  // Invoice routes
  app.get("/api/garages/:garageId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const invoices = await storage.getInvoices(garageId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch invoices' });
    }
  });

  app.post("/api/garages/:garageId/invoices", authenticateToken, requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, garageId });
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Update job card status to completed
      const jobCard = await storage.updateJobCard(invoice.jobCardId, {
        status: 'completed',
        completedAt: new Date()
      });
      
      // Update customer stats
      const customer = await storage.getCustomer(jobCard.customerId, garageId);
      if (customer) {
        await storage.updateCustomer(customer.id, {
          totalJobs: (customer.totalJobs || 0) + 1,
          totalSpent: String(Number(customer.totalSpent || 0) + Number(invoice.totalAmount)),
          lastVisit: new Date()
        });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create invoice' });
    }
  });

  // Sales analytics routes
  app.get("/api/garages/:garageId/sales/stats", authenticateToken, requireRole(['garage_admin']), requireGarageAccess, async (req, res) => {
    try {
      const { garageId } = req.params;
      const stats = await storage.getSalesStats(garageId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sales stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

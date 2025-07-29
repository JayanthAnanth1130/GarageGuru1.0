import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  garages, users, customers, spareParts, jobCards, invoices,
  type Garage, type User, type Customer, type SparePart, type JobCard, type Invoice,
  type InsertGarage, type InsertUser, type InsertCustomer, type InsertSparePart, type InsertJobCard, type InsertInvoice
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGarage(garage: InsertGarage): Promise<Garage>;
  
  // Garages
  getGarage(id: string): Promise<Garage | undefined>;
  updateGarage(id: string, garage: Partial<Garage>): Promise<Garage>;
  
  // Customers
  getCustomers(garageId: string): Promise<Customer[]>;
  getCustomer(id: string, garageId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer>;
  
  // Spare Parts
  getSpareParts(garageId: string): Promise<SparePart[]>;
  getLowStockParts(garageId: string): Promise<SparePart[]>;
  getSparePart(id: string, garageId: string): Promise<SparePart | undefined>;
  createSparePart(part: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart>;
  deleteSparePart(id: string, garageId: string): Promise<void>;
  
  // Job Cards
  getJobCards(garageId: string, status?: string): Promise<JobCard[]>;
  getJobCard(id: string, garageId: string): Promise<JobCard | undefined>;
  createJobCard(jobCard: InsertJobCard): Promise<JobCard>;
  updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard>;
  
  // Invoices
  getInvoices(garageId: string): Promise<Invoice[]>;
  getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
  
  // Analytics
  getSalesStats(garageId: string): Promise<{
    totalInvoices: number;
    totalPartsTotal: number;
    totalServiceCharges: number;
    totalProfit: number;
  }>;
}

export class SupabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createGarage(garage: InsertGarage): Promise<Garage> {
    const result = await db.insert(garages).values(garage).returning();
    return result[0];
  }

  async getGarage(id: string): Promise<Garage | undefined> {
    const result = await db.select().from(garages).where(eq(garages.id, id)).limit(1);
    return result[0];
  }

  async updateGarage(id: string, garage: Partial<Garage>): Promise<Garage> {
    const result = await db.update(garages).set(garage).where(eq(garages.id, id)).returning();
    return result[0];
  }

  async getCustomers(garageId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.garageId, garageId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string, garageId: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers)
      .where(and(eq(customers.id, id), eq(customers.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async getSpareParts(garageId: string): Promise<SparePart[]> {
    return await db.select().from(spareParts).where(eq(spareParts.garageId, garageId)).orderBy(desc(spareParts.createdAt));
  }

  async getLowStockParts(garageId: string): Promise<SparePart[]> {
    return await db.select().from(spareParts)
      .where(and(
        eq(spareParts.garageId, garageId),
        // Using SQL for dynamic comparison
        sql`${spareParts.quantity} <= ${spareParts.lowStockThreshold}`
      ));
  }

  async getSparePart(id: string, garageId: string): Promise<SparePart | undefined> {
    const result = await db.select().from(spareParts)
      .where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createSparePart(part: InsertSparePart): Promise<SparePart> {
    const result = await db.insert(spareParts).values(part).returning();
    return result[0];
  }

  async updateSparePart(id: string, part: Partial<SparePart>): Promise<SparePart> {
    const result = await db.update(spareParts).set(part).where(eq(spareParts.id, id)).returning();
    return result[0];
  }

  async deleteSparePart(id: string, garageId: string): Promise<void> {
    await db.delete(spareParts).where(and(eq(spareParts.id, id), eq(spareParts.garageId, garageId)));
  }

  async getJobCards(garageId: string, status?: string): Promise<JobCard[]> {
    const conditions = [eq(jobCards.garageId, garageId)];
    if (status) {
      conditions.push(eq(jobCards.status, status));
    }
    
    return await db.select().from(jobCards)
      .where(and(...conditions))
      .orderBy(desc(jobCards.createdAt));
  }

  async getJobCard(id: string, garageId: string): Promise<JobCard | undefined> {
    const result = await db.select().from(jobCards)
      .where(and(eq(jobCards.id, id), eq(jobCards.garageId, garageId)))
      .limit(1);
    return result[0];
  }

  async createJobCard(jobCard: InsertJobCard): Promise<JobCard> {
    const result = await db.insert(jobCards).values(jobCard).returning();
    return result[0];
  }

  async updateJobCard(id: string, jobCard: Partial<JobCard>): Promise<JobCard> {
    const result = await db.update(jobCards).set(jobCard).where(eq(jobCards.id, id)).returning();
    return result[0];
  }

  async getInvoices(garageId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.garageId, garageId)).orderBy(desc(invoices.createdAt));
  }

  async getCustomerInvoices(customerId: string, garageId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(and(eq(invoices.customerId, customerId), eq(invoices.garageId, garageId)))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const result = await db.update(invoices).set(invoice).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async getSalesStats(garageId: string): Promise<{
    totalInvoices: number;
    totalPartsTotal: number;
    totalServiceCharges: number;
    totalProfit: number;
  }> {
    const result = await db.select({
      totalInvoices: sql<number>`count(*)`,
      totalPartsTotal: sql<number>`sum(${invoices.partsTotal})`,
      totalServiceCharges: sql<number>`sum(${invoices.serviceCharge})`,
    }).from(invoices).where(eq(invoices.garageId, garageId));

    const stats = result[0];
    return {
      totalInvoices: stats.totalInvoices || 0,
      totalPartsTotal: Number(stats.totalPartsTotal) || 0,
      totalServiceCharges: Number(stats.totalServiceCharges) || 0,
      totalProfit: (Number(stats.totalServiceCharges) || 0) - (Number(stats.totalPartsTotal) || 0),
    };
  }
}

export const storage = new SupabaseStorage();

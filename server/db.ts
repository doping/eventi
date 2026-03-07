import { eq, and, gte, lte, like, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  events, 
  Event,
  InsertEvent,
  ticketCategories,
  TicketCategory,
  InsertTicketCategory,
  orders,
  Order,
  InsertOrder,
  tickets,
  Ticket,
  InsertTicket,
  commissionSettings,
  CommissionSetting,
  InsertCommissionSetting,
  transactions,
  Transaction,
  InsertTransaction,
  emailQueue,
  EmailQueue,
  InsertEmailQueue
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ EVENT MANAGEMENT ============

export async function createEvent(event: InsertEvent): Promise<Event> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(events).values(event);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(events).where(eq(events.id, insertedId)).limit(1);
  return created[0];
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPublicEvents(filters?: {
  category?: string;
  city?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(events.status, 'approved')];

  if (filters?.category) {
    conditions.push(eq(events.category, filters.category as any));
  }

  if (filters?.city) {
    conditions.push(eq(events.venueCity, filters.city));
  }

  if (filters?.search) {
    conditions.push(
      or(
        like(events.title, `%${filters.search}%`),
        like(events.description, `%${filters.search}%`)
      )!
    );
  }

  if (filters?.dateFrom) {
    conditions.push(gte(events.eventDate, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(events.eventDate, filters.dateTo));
  }

  return await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(events.eventDate);
}

export async function getEventsByOrganizer(organizerId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(events.organizerId, organizerId)];
  
  if (status) {
    conditions.push(eq(events.status, status as any));
  }

  return await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.createdAt));
}

export async function updateEvent(id: number, updates: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(events).set(updates).where(eq(events.id, id));
  return await getEventById(id);
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(events).where(eq(events.id, id));
}

export async function getPendingEvents() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(events)
    .where(eq(events.status, 'pending'))
    .orderBy(desc(events.createdAt));
}

// ============ TICKET CATEGORY MANAGEMENT ============

export async function createTicketCategory(category: InsertTicketCategory): Promise<TicketCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(ticketCategories).values(category);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(ticketCategories).where(eq(ticketCategories.id, insertedId)).limit(1);
  return created[0];
}

export async function getTicketCategoriesByEvent(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(ticketCategories)
    .where(eq(ticketCategories.eventId, eventId));
}

export async function getTicketCategoryById(id: number): Promise<TicketCategory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(ticketCategories).where(eq(ticketCategories.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTicketCategory(id: number, updates: Partial<InsertTicketCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(ticketCategories).set(updates).where(eq(ticketCategories.id, id));
  return await getTicketCategoryById(id);
}

export async function decrementTicketAvailability(categoryId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(ticketCategories)
    .set({
      availableQuantity: sql`${ticketCategories.availableQuantity} - ${quantity}`,
    })
    .where(eq(ticketCategories.id, categoryId));
}

// ============ ORDER MANAGEMENT ============

export async function createOrder(order: InsertOrder): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(order);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(orders).where(eq(orders.id, insertedId)).limit(1);
  return created[0];
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function updateOrder(id: number, updates: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(orders).set(updates).where(eq(orders.id, id));
  return await getOrderById(id);
}

// ============ TICKET MANAGEMENT ============

export async function createTicket(ticket: InsertTicket): Promise<Ticket> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tickets).values(ticket);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(tickets).where(eq(tickets.id, insertedId)).limit(1);
  return created[0];
}

export async function getTicketsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(tickets)
    .where(eq(tickets.orderId, orderId));
}

export async function getTicketByQrCode(qrCode: string): Promise<Ticket | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tickets).where(eq(tickets.qrCode, qrCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function validateTicket(id: number, validatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tickets)
    .set({
      isValidated: true,
      validatedAt: new Date(),
      validatedBy,
    })
    .where(eq(tickets.id, id));
}

// ============ COMMISSION MANAGEMENT ============

export async function getCommissionForPartner(partnerId: number): Promise<CommissionSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const partnerCommission = await db
    .select()
    .from(commissionSettings)
    .where(and(eq(commissionSettings.partnerId, partnerId), eq(commissionSettings.isActive, true)))
    .limit(1);

  if (partnerCommission.length > 0) {
    return partnerCommission[0];
  }

  const globalCommission = await db
    .select()
    .from(commissionSettings)
    .where(and(sql`${commissionSettings.partnerId} IS NULL`, eq(commissionSettings.isActive, true)))
    .limit(1);

  return globalCommission.length > 0 ? globalCommission[0] : undefined;
}

export async function setCommissionForPartner(partnerId: number | null, percentage: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (partnerId !== null) {
    await db
      .update(commissionSettings)
      .set({ isActive: false })
      .where(eq(commissionSettings.partnerId, partnerId));
  } else {
    await db
      .update(commissionSettings)
      .set({ isActive: false })
      .where(sql`${commissionSettings.partnerId} IS NULL`);
  }

  const result = await db.insert(commissionSettings).values({
    partnerId,
    commissionPercentage: percentage.toString(),
    isActive: true,
  });

  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(commissionSettings).where(eq(commissionSettings.id, insertedId)).limit(1);
  return created[0];
}

export async function getAllCommissionSettings() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(commissionSettings)
    .where(eq(commissionSettings.isActive, true))
    .orderBy(desc(commissionSettings.createdAt));
}

// ============ TRANSACTION MANAGEMENT ============

export async function createTransaction(transaction: InsertTransaction): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(transactions).values(transaction);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(transactions).where(eq(transactions.id, insertedId)).limit(1);
  return created[0];
}

export async function getTransactionsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, orderId))
    .orderBy(desc(transactions.createdAt));
}

// ============ EMAIL QUEUE MANAGEMENT ============

export async function queueEmail(email: InsertEmailQueue): Promise<EmailQueue> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailQueue).values(email);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(emailQueue).where(eq(emailQueue.id, insertedId)).limit(1);
  return created[0];
}

export async function getPendingEmails() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  
  return await db
    .select()
    .from(emailQueue)
    .where(
      and(
        eq(emailQueue.status, 'pending'),
        or(
          sql`${emailQueue.scheduledFor} IS NULL`,
          lte(emailQueue.scheduledFor, now)
        )!
      )
    )
    .orderBy(emailQueue.createdAt);
}

export async function updateEmailStatus(id: number, status: 'sent' | 'failed', errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = {
    status,
  };

  if (status === 'sent') {
    updates.sentAt = new Date();
  }

  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }

  await db.update(emailQueue).set(updates).where(eq(emailQueue.id, id));
}

// ============ STATISTICS & ANALYTICS ============

export async function getEventSalesStats(eventId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})`,
      totalTickets: sql<number>`COUNT(${tickets.id})`,
      totalRevenue: sql<string>`SUM(${orders.totalAmount})`,
      totalCommission: sql<string>`SUM(${orders.commissionAmount})`,
    })
    .from(orders)
    .leftJoin(tickets, eq(tickets.orderId, orders.id))
    .where(and(eq(tickets.eventId, eventId), eq(orders.status, 'completed')))
    .groupBy(tickets.eventId);

  return result.length > 0 ? result[0] : null;
}

export async function getPartnerEarnings(partnerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      eventId: events.id,
      eventTitle: events.title,
      eventDate: events.eventDate,
      totalRevenue: sql<string>`SUM(${orders.totalAmount})`,
      totalCommission: sql<string>`SUM(${orders.commissionAmount})`,
      netEarnings: sql<string>`SUM(${orders.totalAmount}) - SUM(${orders.commissionAmount})`,
      ticketsSold: sql<number>`COUNT(${tickets.id})`,
    })
    .from(events)
    .leftJoin(tickets, eq(tickets.eventId, events.id))
    .leftJoin(orders, eq(orders.id, tickets.orderId))
    .where(and(eq(events.organizerId, partnerId), eq(orders.status, 'completed')))
    .groupBy(events.id);
}

export async function getAdminDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalEventsResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(events);

  const [totalOrdersResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders)
    .where(eq(orders.status, 'completed'));

  const [totalRevenueResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)` })
    .from(orders)
    .where(eq(orders.status, 'completed'));

  const [totalTicketsResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tickets);

  const [pendingEventsResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(events)
    .where(eq(events.status, 'pending'));

  const [totalUsersResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(users);

  return {
    totalEvents: Number(totalEventsResult?.count ?? 0),
    totalOrders: Number(totalOrdersResult?.count ?? 0),
    totalRevenue: parseFloat(totalRevenueResult?.total ?? '0'),
    totalTickets: Number(totalTicketsResult?.count ?? 0),
    pendingEvents: Number(pendingEventsResult?.count ?? 0),
    totalUsers: Number(totalUsersResult?.count ?? 0),
  };
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalAmount: orders.totalAmount,
      commissionAmount: orders.commissionAmount,
      createdAt: orders.createdAt,
      userId: orders.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: 'user' | 'admin' | 'partner') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
}

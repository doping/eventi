import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role system for admin, partner, and regular users.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "partner", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table - stores all events (both admin and partner created)
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["classica", "lirica", "teatro", "danza", "altro"]).notNull(),
  eventDate: timestamp("eventDate").notNull(),
  eventEndDate: timestamp("eventEndDate"),
  venueName: varchar("venueName", { length: 255 }).notNull(),
  venueAddress: text("venueAddress"),
  venueCity: varchar("venueCity", { length: 100 }).notNull(),
  venueLatitude: decimal("venueLatitude", { precision: 10, scale: 7 }),
  venueLongitude: decimal("venueLongitude", { precision: 10, scale: 7 }),
  imageUrl: text("imageUrl"),
  slug: varchar("slug", { length: 300 }),
  status: mysqlEnum("status", ["draft", "pending", "approved", "rejected", "cancelled"]).default("draft").notNull(),
  organizerId: int("organizerId").notNull(), // references users.id
  isPartnerEvent: boolean("isPartnerEvent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  organizerIdx: index("organizer_idx").on(table.organizerId),
  statusIdx: index("status_idx").on(table.status),
  categoryIdx: index("category_idx").on(table.category),
  eventDateIdx: index("event_date_idx").on(table.eventDate),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Ticket categories for each event (e.g., VIP, Standard, Balcony)
 */
export const ticketCategories = mysqlTable("ticketCategories", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(), // references events.id
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  totalQuantity: int("totalQuantity").notNull(),
  availableQuantity: int("availableQuantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventIdx: index("event_idx").on(table.eventId),
}));

export type TicketCategory = typeof ticketCategories.$inferSelect;
export type InsertTicketCategory = typeof ticketCategories.$inferInsert;

/**
 * Orders table - tracks purchases
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull(), // references users.id
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  // Guest checkout fields (null for registered users)
  guestFirstName: varchar("guestFirstName", { length: 100 }),
  guestLastName: varchar("guestLastName", { length: 100 }),
  guestEmail: varchar("guestEmail", { length: 320 }),
  guestCountry: varchar("guestCountry", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  orderNumberIdx: index("order_number_idx").on(table.orderNumber),
}));

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Tickets table - individual tickets with QR codes
 */
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(), // references orders.id
  eventId: int("eventId").notNull(), // references events.id
  ticketCategoryId: int("ticketCategoryId").notNull(), // references ticketCategories.id
  qrCode: varchar("qrCode", { length: 255 }).notNull().unique(),
  holderName: varchar("holderName", { length: 255 }),
  holderEmail: varchar("holderEmail", { length: 320 }),
  isValidated: boolean("isValidated").default(false).notNull(),
  validatedAt: timestamp("validatedAt"),
  validatedBy: int("validatedBy"), // references users.id (admin who validated)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_idx").on(table.orderId),
  eventIdx: index("event_idx").on(table.eventId),
  qrCodeIdx: index("qr_code_idx").on(table.qrCode),
}));

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

/**
 * Order items - tracks individual items within an order
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(), // references orders.id
  ticketCategoryId: int("ticketCategoryId").notNull(), // references ticketCategories.id
  eventId: int("eventId").notNull(), // references events.id
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_item_order_idx").on(table.orderId),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Commission settings - configurable fees for partner events
 */
export const commissionSettings = mysqlTable("commissionSettings", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId"), // references users.id, null means global default
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }).notNull(), // e.g., 15.00 for 15%
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  partnerIdx: index("partner_idx").on(table.partnerId),
}));

export type CommissionSetting = typeof commissionSettings.$inferSelect;
export type InsertCommissionSetting = typeof commissionSettings.$inferInsert;

/**
 * Transactions table - detailed payment tracking
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(), // references orders.id
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_idx").on(table.orderId),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Email notifications queue
 */
export const emailQueue = mysqlTable("emailQueue", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  templateType: mysqlEnum("templateType", ["order_confirmation", "event_reminder", "partner_event_notification", "sales_milestone"]).notNull(),
  templateData: text("templateData"), // JSON string with template variables
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  scheduledIdx: index("scheduled_idx").on(table.scheduledFor),
}));

export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = typeof emailQueue.$inferInsert;

/**
 * Event dates - supports multi-date events (same event, different dates/times)
 */
export const eventDates = mysqlTable("eventDates", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(), // references events.id
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  label: varchar("label", { length: 100 }), // e.g. "Serata 1", "Replica"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventIdx: index("event_date_event_idx").on(table.eventId),
  startDateIdx: index("event_date_start_idx").on(table.startDate),
}));

export type EventDate = typeof eventDates.$inferSelect;
export type InsertEventDate = typeof eventDates.$inferInsert;

/**
 * Site settings - admin-configurable UI settings (colors, logo, texts)
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  settingType: mysqlEnum("settingType", ["text", "color", "image", "boolean", "json"]).default("text").notNull(),
  label: varchar("label", { length: 255 }),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Reviews - user reviews for events (only buyers can review)
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  authorName: varchar("authorName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventIdx: index("review_event_idx").on(table.eventId),
  userIdx: index("review_user_idx").on(table.userId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Newsletter subscribers
 */
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * Contact pages - landing pages with editable content (eventi privati, location, artisti, etc.)
 */
export const contactPages = mysqlTable("contactPages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // e.g. 'eventi-privati'
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  bodyText: text("bodyText"),
  ctaLabel: varchar("ctaLabel", { length: 100 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }), // where form submissions go
  isActive: boolean("isActive").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactPage = typeof contactPages.$inferSelect;
export type InsertContactPage = typeof contactPages.$inferInsert;

/**
 * Contact form submissions from landing pages
 */
export const contactSubmissions = mysqlTable("contactSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  pageSlug: varchar("pageSlug", { length: 100 }).notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Error logs table for admin monitoring
 */
export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  message: text("message").notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

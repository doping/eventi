import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as db from "./db";
import { createCheckoutSession } from "./stripe";
import { eurosToCents } from "../shared/products";
import { generateMultipleTicketsPDF } from "./pdfGenerator";
import { notifyOwner } from "./_core/notification";
import { sendEmail, buildBuyerEmailHtml, buildAdminNotificationEmailHtml, SMTP_FROM } from "./emailSender";

// ============ CUSTOM PROCEDURES ============

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const partnerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'partner' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Partner or admin access required' });
  }
  return next({ ctx });
});

// ============ APP ROUTER ============

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ EVENTS ============
  events: router({
    // Get public events with filters
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        city: z.string().optional(),
        search: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          category: input.category,
          city: input.city,
          search: input.search,
          dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
          dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
        } : undefined;
        
        return await db.getPublicEvents(filters);
      }),

    // Get event by ID with ticket categories
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        
        const categories = await db.getTicketCategoriesByEvent(input.id);
        return { event, categories };
      }),

    // Get organizer's events
    myEvents: partnerProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getEventsByOrganizer(ctx.user.id, input?.status);
      }),

    // Create event
    create: partnerProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        category: z.enum(['classica', 'lirica', 'teatro', 'danza', 'altro']),
        eventDate: z.string(),
        eventEndDate: z.string().optional(),
        venueName: z.string().min(1),
        venueAddress: z.string().min(1),
        venueCity: z.string().min(1),
        venueLatitude: z.number().optional(),
        venueLongitude: z.number().optional(),
        imageUrl: z.string().optional(),
        ticketCategories: z.array(z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.number().min(0),
          quantity: z.number().min(1),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const isPartner = ctx.user.role === 'partner';
        const status = isPartner ? 'pending' : 'approved';

        const event = await db.createEvent({
          title: input.title,
          description: input.description,
          category: input.category,
          eventDate: new Date(input.eventDate),
          eventEndDate: input.eventEndDate ? new Date(input.eventEndDate) : null,
          venueName: input.venueName,
          venueAddress: input.venueAddress,
          venueCity: input.venueCity,
          venueLatitude: input.venueLatitude?.toString() || null,
          venueLongitude: input.venueLongitude?.toString() || null,
          imageUrl: input.imageUrl || null,
          status,
          organizerId: ctx.user.id,
          isPartnerEvent: isPartner,
        });

        // Create ticket categories
        for (const cat of input.ticketCategories) {
          await db.createTicketCategory({
            eventId: event.id,
            name: cat.name,
            description: cat.description || null,
            price: cat.price.toString(),
            totalQuantity: cat.quantity,
            availableQuantity: cat.quantity,
          });
        }

        return event;
      }),

    // Update event
    update: partnerProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        category: z.enum(['classica', 'lirica', 'teatro', 'danza', 'altro']).optional(),
        eventDate: z.string().optional(),
        eventEndDate: z.string().optional(),
        venueName: z.string().min(1).optional(),
        venueAddress: z.string().min(1).optional(),
        venueCity: z.string().min(1).optional(),
        venueLatitude: z.number().optional(),
        venueLongitude: z.number().optional(),
        imageUrl: z.string().optional(),
        status: z.enum(['draft', 'pending', 'approved', 'rejected', 'cancelled']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        // Check permissions
        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to update this event' });
        }

        const updates: any = {};
        if (input.title) updates.title = input.title;
        if (input.description) updates.description = input.description;
        if (input.category) updates.category = input.category;
        if (input.eventDate) updates.eventDate = new Date(input.eventDate);
        if (input.eventEndDate) updates.eventEndDate = new Date(input.eventEndDate);
        if (input.venueName) updates.venueName = input.venueName;
        if (input.venueAddress) updates.venueAddress = input.venueAddress;
        if (input.venueCity) updates.venueCity = input.venueCity;
        if (input.venueLatitude !== undefined) updates.venueLatitude = input.venueLatitude.toString();
        if (input.venueLongitude !== undefined) updates.venueLongitude = input.venueLongitude.toString();
        if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
        if (input.status) updates.status = input.status;

        return await db.updateEvent(input.id, updates);
      }),

    // Delete event
    delete: partnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to delete this event' });
        }

        await db.deleteEvent(input.id);
        return { success: true };
      }),

    // Get pending events (admin only)
    pending: adminProcedure.query(async () => {
      return await db.getPendingEvents();
    }),

    // Approve event (admin only)
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateEvent(input.id, { status: 'approved' });
      }),

    // Reject event (admin only)
    reject: adminProcedure
      .input(z.object({ id: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        return await db.updateEvent(input.id, { status: 'rejected' });
      }),

    // Update ticket category (price, quantity, name)
    updateCategory: partnerProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().min(0).optional(),
        totalQuantity: z.number().min(0).optional(),
        availableQuantity: z.number().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getTicketCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
        }
        const event = await db.getEventById(category.eventId);
        if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        const updates: any = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.price !== undefined) updates.price = input.price.toString();
        if (input.totalQuantity !== undefined) updates.totalQuantity = input.totalQuantity;
        if (input.availableQuantity !== undefined) updates.availableQuantity = input.availableQuantity;
        return await db.updateTicketCategory(input.id, updates);
      }),

    // Add new ticket category to existing event
    addCategory: partnerProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().min(0),
        quantity: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        return await db.createTicketCategory({
          eventId: input.eventId,
          name: input.name,
          description: input.description || null,
          price: input.price.toString(),
          totalQuantity: input.quantity,
          availableQuantity: input.quantity,
        });
      }),

    // Delete ticket category
    deleteCategory: partnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const category = await db.getTicketCategoryById(input.id);
        if (!category) throw new TRPCError({ code: 'NOT_FOUND', message: 'Category not found' });
        const event = await db.getEventById(category.eventId);
        if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        await db.deleteTicketCategory(input.id);
        return { success: true };
      }),

    // Get event sales statistics
    stats: partnerProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return await db.getEventSalesStats(input.eventId);
      }),
  }),

  // ============ ORDERS & CHECKOUT ============
  orders: router({
    // Create order and checkout session
    createCheckout: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          ticketCategoryId: z.number(),
          quantity: z.number().min(1),
        })),
        origin: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate ticket availability and calculate total
        let totalAmount = 0;
        let commissionAmount = 0;
        const lineItems = [];

        for (const item of input.items) {
          const category = await db.getTicketCategoryById(item.ticketCategoryId);
          if (!category) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket category not found' });
          }

          if (category.availableQuantity < item.quantity) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: `Not enough tickets available for ${category.name}` 
            });
          }

          const price = parseFloat(category.price);
          const itemTotal = price * item.quantity;
          totalAmount += itemTotal;

          // Get event to check if commission applies
          const event = await db.getEventById(category.eventId);
          if (event?.isPartnerEvent) {
            const commission = await db.getCommissionForPartner(event.organizerId);
            if (commission) {
              const commissionRate = parseFloat(commission.commissionPercentage) / 100;
              commissionAmount += itemTotal * commissionRate;
            }
          }

          lineItems.push({
            name: `${event?.title} - ${category.name}`,
            description: category.description || '',
            priceInCents: eurosToCents(price),
            quantity: item.quantity,
            categoryId: category.id,
            eventId: category.eventId,
          });
        }

        // Create order
        const orderNumber = `ORD-${nanoid(10)}`;
        const order = await db.createOrder({
          orderNumber,
          userId: ctx.user.id,
          totalAmount: totalAmount.toString(),
          commissionAmount: commissionAmount.toString(),
          status: 'pending',
        });

        // Save order items for later ticket generation
        for (const item of input.items) {
          const category = await db.getTicketCategoryById(item.ticketCategoryId);
          if (category) {
            await db.createOrderItem({
              orderId: order.id,
              ticketCategoryId: item.ticketCategoryId,
              eventId: category.eventId,
              quantity: item.quantity,
              unitPrice: category.price,
            });
          }
        }

        // Create Stripe checkout session
        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || '',
          orderNumber,
          items: lineItems,
          origin: input.origin,
          metadata: {
            order_id: order.id.toString(),
          },
        });

        return {
          orderId: order.id,
          orderNumber,
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      }),

    // Get order by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const tickets = await db.getTicketsByOrder(order.id);
        return { order, tickets };
      }),

    // Get user's orders
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByUser(ctx.user.id);
    }),

    // Confirm order after payment - generates tickets automatically
    confirm: protectedProcedure
      .input(z.object({ 
        orderNumber: z.string(),
        sessionId: z.string(),
        items: z.array(z.object({
          ticketCategoryId: z.number(),
          quantity: z.number(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderByNumber(input.orderNumber);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        if (order.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        // If already completed, just return existing tickets
        if (order.status === 'completed') {
          const existingTickets = await db.getTicketsByOrder(order.id);
          return { success: true, orderId: order.id, tickets: existingTickets };
        }

        // Update order status
        await db.updateOrder(order.id, {
          status: 'completed',
          stripeSessionId: input.sessionId,
        });

        // Generate tickets from items
        const generatedTickets = [];
        let itemsToProcess: { ticketCategoryId: number; quantity: number }[] = [];
        if (input.items && input.items.length > 0) {
          itemsToProcess = input.items;
        } else {
          const savedItems = await db.getOrderItemsByOrder(order.id);
          itemsToProcess = savedItems.map(i => ({ ticketCategoryId: i.ticketCategoryId, quantity: i.quantity }));
        }

        for (const item of itemsToProcess) {
          const category = await db.getTicketCategoryById(item.ticketCategoryId);
          if (!category) continue;

          // Decrement available quantity
          await db.decrementTicketAvailability(item.ticketCategoryId, item.quantity);

          // Create tickets
          for (let i = 0; i < item.quantity; i++) {
            const qrCode = `TKT-${nanoid(16)}`;
            const ticket = await db.createTicket({
              orderId: order.id,
              eventId: category.eventId,
              ticketCategoryId: category.id,
              qrCode,
              holderName: ctx.user.name || null,
              holderEmail: ctx.user.email || null,
              isValidated: false,
            });
            generatedTickets.push(ticket);
          }
        }

        // Notify admin of new order + send emails
        try {
          const event = generatedTickets.length > 0 
            ? await db.getEventById(generatedTickets[0].eventId)
            : null;

          // 1. Notifica Manus owner
          await notifyOwner({
            title: `🎟️ Nuovo ordine: ${order.orderNumber}`,
            content: `Nuovo acquisto completato!\n\nOrdine: ${order.orderNumber}\nAcquirente: ${ctx.user.name || ctx.user.email}\nBiglietti: ${generatedTickets.length}\nEvento: ${event?.title || 'N/A'}\nTotale: €${parseFloat(order.totalAmount).toFixed(2)}`,
          });

          // 2. Recupera impostazioni sito per nome, url e email notifiche
          const allSettings = await db.getAllSiteSettings();
          const settingsMap = Object.fromEntries(allSettings.map((s: { settingKey: string; settingValue: string | null }) => [s.settingKey, s.settingValue]));
          const siteName = settingsMap['site_name'] || 'EventiPro';
          const siteUrl = settingsMap['site_url'] || 'https://eventitix-yemokzo8.manus.space';
          const notificationEmail = settingsMap['notification_email'] || '';

          const eventDate = event?.eventDate
            ? new Date(event.eventDate).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : 'Data da definire';
          const eventVenue = event ? `${event.venueName}, ${event.venueCity}` : '';
          const totalAmount = parseFloat(order.totalAmount).toFixed(2);

          const ticketsForEmail = generatedTickets.map((t: any) => ({
            qrCode: t.qrCode,
            categoryName: t.ticketCategoryId?.toString() || 'Biglietto',
            holderName: t.holderName || null,
          }));

          // Recupera nomi categorie per i biglietti
          const categoryCache: Record<number, string> = {};
          for (const t of generatedTickets as any[]) {
            if (t.ticketCategoryId && !categoryCache[t.ticketCategoryId]) {
              const cat = await db.getTicketCategoryById(t.ticketCategoryId);
              categoryCache[t.ticketCategoryId] = cat?.name || 'Biglietto';
            }
          }
          const ticketsWithNames = generatedTickets.map((t: any) => ({
            qrCode: t.qrCode,
            categoryName: categoryCache[t.ticketCategoryId] || 'Biglietto',
            holderName: t.holderName || null,
          }));

          // 3. Email all'acquirente
          if (ctx.user.email) {
            const buyerHtml = buildBuyerEmailHtml({
              buyerName: ctx.user.name || ctx.user.email,
              orderNumber: order.orderNumber,
              eventTitle: event?.title || 'Evento',
              eventDate,
              eventVenue,
              tickets: ticketsWithNames,
              totalAmount,
              siteName,
              siteUrl,
            });
            await sendEmail({
              to: ctx.user.email,
              subject: `✅ Conferma ordine ${order.orderNumber} - ${event?.title || 'Evento'}`,
              html: buyerHtml,
            });
          }

          // 4. Copia notifica all'indirizzo admin configurato
          if (notificationEmail) {
            const adminHtml = buildAdminNotificationEmailHtml({
              orderNumber: order.orderNumber,
              buyerName: ctx.user.name || ctx.user.email || 'N/A',
              buyerEmail: ctx.user.email || 'N/A',
              eventTitle: event?.title || 'Evento',
              ticketCount: generatedTickets.length,
              totalAmount,
              siteName,
              siteUrl,
            });
            await sendEmail({
              to: notificationEmail,
              subject: `🎟️ Nuovo ordine ${order.orderNumber} - ${event?.title || 'Evento'}`,
              html: adminHtml,
            });
          }

        } catch (e) {
          console.warn('[Notification/Email] Errore invio notifiche:', e);
        }

        return { success: true, orderId: order.id, tickets: generatedTickets };
      }),
  }),

  // ============ TICKETS ============
  tickets: router({
    // Generate tickets after successful payment
    generate: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        items: z.array(z.object({
          ticketCategoryId: z.number(),
          quantity: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        if (order.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const generatedTickets = [];

        for (const item of input.items) {
          const category = await db.getTicketCategoryById(item.ticketCategoryId);
          if (!category) continue;

          // Decrement available quantity
          await db.decrementTicketAvailability(item.ticketCategoryId, item.quantity);

          // Create tickets
          for (let i = 0; i < item.quantity; i++) {
            const qrCode = `TKT-${nanoid(16)}`;
            const ticket = await db.createTicket({
              orderId: order.id,
              eventId: category.eventId,
              ticketCategoryId: category.id,
              qrCode,
              holderName: ctx.user.name || null,
              holderEmail: ctx.user.email || null,
              isValidated: false,
            });
            generatedTickets.push(ticket);
          }
        }

        return { tickets: generatedTickets };
      }),

    // Get tickets by order
    byOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return await db.getTicketsByOrder(input.orderId);
      }),

    // Download ticket PDF
    downloadPDF: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
        }

        if (order.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const tickets = await db.getTicketsByOrder(input.orderId);
        if (tickets.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No tickets found' });
        }

        // Gather all data needed for PDF generation
        const ticketsData = [];
        for (const ticket of tickets) {
          const event = await db.getEventById(ticket.eventId);
          const category = await db.getTicketCategoryById(ticket.ticketCategoryId);
          
          if (event && category) {
            ticketsData.push({ ticket, event, category, order });
          }
        }

        const pdfBase64 = await generateMultipleTicketsPDF(ticketsData);
        return { pdf: pdfBase64 };
      }),

    // Validate ticket by QR code (admin only)
    validate: adminProcedure
      .input(z.object({ qrCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const ticket = await db.getTicketByQrCode(input.qrCode);
        if (!ticket) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
        }

        if (ticket.isValidated) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ticket already validated' });
        }

        await db.validateTicket(ticket.id, ctx.user.id);
        
        // Get event details for response
        const event = await db.getEventById(ticket.eventId);
        const category = await db.getTicketCategoryById(ticket.ticketCategoryId);

        return {
          success: true,
          ticket,
          event,
          category,
        };
      }),

    // Check ticket status
    checkStatus: publicProcedure
      .input(z.object({ qrCode: z.string() }))
      .query(async ({ input }) => {
        const ticket = await db.getTicketByQrCode(input.qrCode);
        if (!ticket) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
        }

        const event = await db.getEventById(ticket.eventId);
        const category = await db.getTicketCategoryById(ticket.ticketCategoryId);

        return { ticket, event, category };
      }),
  }),

  // ============ ADMIN ============
  admin: router({
    // Global dashboard statistics
    stats: adminProcedure.query(async () => {
      return await db.getAdminDashboardStats();
    }),

    // All events list
    allEvents: adminProcedure.query(async () => {
      return await db.getAllEvents();
    }),

    // All orders list
    allOrders: adminProcedure.query(async () => {
      return await db.getAllOrders();
    }),

    // All users list
    allUsers: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    // Update user role
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin', 'partner']),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
  }),

  // ============ EVENT DATES (multi-date support) ============
  eventDates: router({
    // Get all dates for an event
    list: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEventDates(input.eventId);
      }),

    // Add a date to an event
    add: partnerProcedure
      .input(z.object({
        eventId: z.number(),
        startDate: z.string(),
        endDate: z.string().optional(),
        label: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        if (event.organizerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }
        return await db.createEventDate({
          eventId: input.eventId,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          label: input.label || null,
          isActive: true,
        });
      }),

    // Update a date
    update: partnerProcedure
      .input(z.object({
        id: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        label: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updates: any = {};
        if (input.startDate) updates.startDate = new Date(input.startDate);
        if (input.endDate) updates.endDate = new Date(input.endDate);
        if (input.label !== undefined) updates.label = input.label;
        if (input.isActive !== undefined) updates.isActive = input.isActive;
        return await db.updateEventDate(input.id, updates);
      }),

    // Delete a date
    delete: partnerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEventDate(input.id);
        return { success: true };
      }),
  }),

  // ============ SITE SETTINGS ============
  siteSettings: router({
    // Get all settings (public - needed for frontend theming)
    getAll: publicProcedure.query(async () => {
      return await db.getAllSiteSettings();
    }),

    // Get a single setting by key
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await db.getSiteSetting(input.key);
      }),

    // Update a setting (admin only)
    set: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string().nullable(),
        type: z.enum(['text', 'color', 'image', 'boolean', 'json']).optional(),
        label: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.setSiteSetting(input.key, input.value, input.type, input.label, input.description);
      }),

    // Bulk update settings (admin only)
    setBulk: adminProcedure
      .input(z.array(z.object({
        key: z.string(),
        value: z.string().nullable(),
        type: z.enum(['text', 'color', 'image', 'boolean', 'json']).optional(),
        label: z.string().optional(),
      })))
      .mutation(async ({ input }) => {
        for (const setting of input) {
          await db.setSiteSetting(setting.key, setting.value, setting.type, setting.label);
        }
        return { success: true };
      }),
  }),

  // ============ COMMISSIONS ============
  commissions: router({
    // Get commission for partner
    getForPartner: partnerProcedure
      .input(z.object({ partnerId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const partnerId = input.partnerId || ctx.user.id;
        
        if (partnerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return await db.getCommissionForPartner(partnerId);
      }),

    // Set commission (admin only)
    set: adminProcedure
      .input(z.object({
        partnerId: z.number().nullable(),
        percentage: z.number().min(0).max(100),
      }))
      .mutation(async ({ input }) => {
        return await db.setCommissionForPartner(input.partnerId, input.percentage);
      }),

    // Get all commission settings (admin only)
    listAll: adminProcedure.query(async () => {
      return await db.getAllCommissionSettings();
    }),

    // Get partner earnings
    earnings: partnerProcedure
      .input(z.object({ partnerId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const partnerId = input.partnerId || ctx.user.id;
        
        if (partnerId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return await db.getPartnerEarnings(partnerId);
      }),
  }),

  // ============ REVIEWS ============
  reviews: router({
    // Get reviews for an event (public)
    list: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const reviewList = await db.getReviewsByEvent(input.eventId);
        const stats = await db.getEventAvgRating(input.eventId);
        return { reviews: reviewList, avg: stats.avg, count: stats.count };
      }),

    // Create a review (only buyers)
    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already reviewed this event
        const existing = await db.getUserReviewForEvent(ctx.user.id, input.eventId);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Hai già lasciato una recensione per questo evento' });
        }
        return await db.createReview({
          eventId: input.eventId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment || null,
          authorName: ctx.user.name || null,
        });
      }),

    // Check if current user already reviewed
    myReview: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserReviewForEvent(ctx.user.id, input.eventId);
      }),
  }),

  // ============ NEWSLETTER ============
  newsletter: router({
    // Subscribe (public)
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.subscribeNewsletter(input.email, input.name);
        return { success: true };
      }),

    // List all subscribers (admin only)
    listSubscribers: adminProcedure.query(async () => {
      return await db.getAllNewsletterSubscribers();
    }),
  }),

  // ============ CONTACT PAGES ============
  contactPages: router({
    // Get a single contact page by slug (public)
    get: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getContactPage(input.slug);
      }),

    // Get all contact pages (admin)
    listAll: adminProcedure.query(async () => {
      return await db.getAllContactPages();
    }),

    // Upsert a contact page (admin)
    upsert: adminProcedure
      .input(z.object({
        slug: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        bodyText: z.string().optional(),
        ctaLabel: z.string().optional(),
        recipientEmail: z.string().email().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.upsertContactPage({
          slug: input.slug,
          title: input.title,
          subtitle: input.subtitle || null,
          bodyText: input.bodyText || null,
          ctaLabel: input.ctaLabel || null,
          recipientEmail: input.recipientEmail || null,
          isActive: input.isActive !== undefined ? input.isActive : true,
        });
      }),

    // Submit a contact form (public)
    submit: publicProcedure
      .input(z.object({
        pageSlug: z.string(),
        senderName: z.string().min(2),
        senderEmail: z.string().email(),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const submission = await db.createContactSubmission(input);
        // Notify owner
        try {
          const page = await db.getContactPage(input.pageSlug);
          await notifyOwner({
            title: `📩 Nuovo contatto: ${page?.title || input.pageSlug}`,
            content: `Da: ${input.senderName} <${input.senderEmail}>\n\n${input.message}`,
          });
        } catch (e) {
          console.warn('[ContactForm] Notifica fallita:', e);
        }
        return { success: true, id: submission.id };
      }),

    // List submissions (admin)
    listSubmissions: adminProcedure
      .input(z.object({ pageSlug: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getContactSubmissions(input.pageSlug);
      }),
  }),
});

export type AppRouter = typeof appRouter;

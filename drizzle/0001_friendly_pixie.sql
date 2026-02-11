CREATE TABLE `commissionSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int,
	`commissionPercentage` decimal(5,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissionSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`recipientName` varchar(255),
	`subject` varchar(255) NOT NULL,
	`templateType` enum('order_confirmation','event_reminder','partner_event_notification','sales_milestone') NOT NULL,
	`templateData` text,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`scheduledFor` timestamp,
	`sentAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('classica','lirica','teatro','danza','altro') NOT NULL,
	`eventDate` timestamp NOT NULL,
	`eventEndDate` timestamp,
	`venueName` varchar(255) NOT NULL,
	`venueAddress` text NOT NULL,
	`venueCity` varchar(100) NOT NULL,
	`venueLatitude` decimal(10,7),
	`venueLongitude` decimal(10,7),
	`imageUrl` text,
	`status` enum('draft','pending','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`organizerId` int NOT NULL,
	`isPartnerEvent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`commissionAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `ticketCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`totalQuantity` int NOT NULL,
	`availableQuantity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticketCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`eventId` int NOT NULL,
	`ticketCategoryId` int NOT NULL,
	`qrCode` varchar(255) NOT NULL,
	`holderName` varchar(255),
	`holderEmail` varchar(320),
	`isValidated` boolean NOT NULL DEFAULT false,
	`validatedAt` timestamp,
	`validatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_qrCode_unique` UNIQUE(`qrCode`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`stripeChargeId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`status` enum('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','partner','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `partner_idx` ON `commissionSettings` (`partnerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `emailQueue` (`status`);--> statement-breakpoint
CREATE INDEX `scheduled_idx` ON `emailQueue` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `organizer_idx` ON `events` (`organizerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `events` (`status`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `events` (`category`);--> statement-breakpoint
CREATE INDEX `event_date_idx` ON `events` (`eventDate`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `orders` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `order_number_idx` ON `orders` (`orderNumber`);--> statement-breakpoint
CREATE INDEX `event_idx` ON `ticketCategories` (`eventId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `tickets` (`orderId`);--> statement-breakpoint
CREATE INDEX `event_idx` ON `tickets` (`eventId`);--> statement-breakpoint
CREATE INDEX `qr_code_idx` ON `tickets` (`qrCode`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `transactions` (`orderId`);
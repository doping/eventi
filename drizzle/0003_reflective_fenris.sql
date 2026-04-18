CREATE TABLE `eventDates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp,
	`label` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventDates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`settingType` enum('text','color','image','boolean','json') NOT NULL DEFAULT 'text',
	`label` varchar(255),
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE INDEX `event_date_event_idx` ON `eventDates` (`eventId`);--> statement-breakpoint
CREATE INDEX `event_date_start_idx` ON `eventDates` (`startDate`);
CREATE TABLE `slugRedirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`oldSlug` varchar(300) NOT NULL,
	`newSlug` varchar(300) NOT NULL,
	`eventId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slugRedirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `slugRedirects_oldSlug_unique` UNIQUE(`oldSlug`)
);

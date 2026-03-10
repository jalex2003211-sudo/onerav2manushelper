CREATE TABLE `couples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerAId` int NOT NULL,
	`partnerBId` int,
	`relationshipStage` enum('break-the-ice','dating','long-term') NOT NULL DEFAULT 'dating',
	`streakCount` int NOT NULL DEFAULT 0,
	`lastActiveDate` varchar(10),
	`inviteCode` varchar(12) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `couples_id` PRIMARY KEY(`id`),
	CONSTRAINT `couples_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `mood_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`coupleId` int NOT NULL,
	`mood` enum('calm','connected','tired','anxious','grateful','distant','playful','tender') NOT NULL,
	`visibleToPartner` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mood_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationship_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`insightType` enum('weekly','monthly') NOT NULL,
	`content` text NOT NULL,
	`themes` json DEFAULT ('[]'),
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relationship_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_moments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`questionId` varchar(64) NOT NULL,
	`questionText` text NOT NULL,
	`deckId` varchar(64) NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_moments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`deckId` varchar(64) NOT NULL,
	`questionIds` json NOT NULL,
	`connectionScore` int,
	`savedMomentIds` json DEFAULT ('[]'),
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `couples` ADD CONSTRAINT `couples_partnerAId_users_id_fk` FOREIGN KEY (`partnerAId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `couples` ADD CONSTRAINT `couples_partnerBId_users_id_fk` FOREIGN KEY (`partnerBId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mood_entries` ADD CONSTRAINT `mood_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mood_entries` ADD CONSTRAINT `mood_entries_coupleId_couples_id_fk` FOREIGN KEY (`coupleId`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationship_insights` ADD CONSTRAINT `relationship_insights_coupleId_couples_id_fk` FOREIGN KEY (`coupleId`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_moments` ADD CONSTRAINT `saved_moments_coupleId_couples_id_fk` FOREIGN KEY (`coupleId`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_coupleId_couples_id_fk` FOREIGN KEY (`coupleId`) REFERENCES `couples`(`id`) ON DELETE no action ON UPDATE no action;
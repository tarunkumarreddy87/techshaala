CREATE TABLE `assignments` (
	`id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`due_date` timestamp NOT NULL,
	`max_score` int NOT NULL DEFAULT 100,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`duration` text NOT NULL,
	`teacher_id` varchar(36) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`course_id` varchar(36) NOT NULL,
	`enrolled_at` timestamp DEFAULT (now()),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` varchar(36) NOT NULL,
	`submission_id` varchar(36) NOT NULL,
	`score` int NOT NULL,
	`feedback` text,
	`graded_at` timestamp DEFAULT (now()),
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` varchar(36) NOT NULL,
	`assignment_id` varchar(36) NOT NULL,
	`student_id` varchar(36) NOT NULL,
	`content` text NOT NULL,
	`submitted_at` timestamp DEFAULT (now()),
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`role` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);

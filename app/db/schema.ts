import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	pgEnum,
	timestamp,
	varchar,
	uuid,
	customType,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

const prefixes = {
	user: "usr",
	thread: "thr",
	prompt: "prm",
	instance: "ins",
};

const bytea = customType<{
	data: Buffer;
	notNull: false;
	default: false;
}>({
	dataType() {
		return "bytea";
	},
});

export const userRoles = ["admin", "user"] as const;
export const rolesEnum = pgEnum("roles", userRoles);
export type UserRole = (typeof userRoles)[number];

function pk(prefix: keyof typeof prefixes) {
	return text()
		.primaryKey()
		.notNull()
		.$defaultFn(() => [prefixes[prefix], nanoid()].join("_"));
}

export const usersTable = pgTable("users", {
	id: pk("user"),
	email: varchar({ length: 255 }).notNull().unique(),
	selectedInstanceId: varchar({ length: 52 }),
	selectedAgentId: varchar({ length: 52 }),
	role: rolesEnum().default("user").notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});

export const threadsTable = pgTable("threads", {
	id: pk("thread"),
	userId: text()
		.notNull()
		.references(() => usersTable.id), // Add foreign key to users table
	label: text().default("New chat").notNull(),
	agentId: text().notNull(),
	sessionId: uuid().notNull().unique().defaultRandom(),
	createdAt: timestamp().defaultNow().notNull(),
});

export const promptsTable = pgTable("prompts", {
	id: pk("prompt"),
	userId: text()
		.notNull()
		.references(() => usersTable.id), // Add foreign key to users table
	title: text().notNull(),
	content: text().notNull(),
	updatedAt: timestamp().defaultNow().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});

export const instancesTable = pgTable("instances", {
	id: pk("instance"),
	userId: text()
		.notNull()
		.references(() => usersTable.id), // Add foreign key to users table
	name: text().notNull(),
	host: text().notNull(),
	email: text().notNull(),
	password: bytea("token").notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});

export const userRelations = relations(usersTable, ({ many }) => ({
	threads: many(threadsTable),
}));

export const threadRelations = relations(threadsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [threadsTable.userId],
		references: [usersTable.id],
	}),
}));

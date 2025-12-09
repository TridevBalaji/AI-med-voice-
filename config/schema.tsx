import { integer, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer(),
});

export const SessionChatTable = pgTable("session_chats", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar({ length: 255 }).notNull().unique(),
  createdBy: varchar({ length: 255 }).notNull(),
  notes: text("notes").notNull(),
  selectedDoctor: varchar({ length: 255 }).notNull(),
  createdOn: varchar({ length: 255 }).notNull(),
});

export const MedicalReportsTable = pgTable("medical_reports", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  agent: varchar({ length: 255 }).notNull(),
  user: varchar({ length: 255 }).notNull(),
  timestamp: varchar({ length: 255 }).notNull(),
  chiefComplaint: text("chief_complaint").notNull(),
  summary: text("summary").notNull(),
  symptoms: text("symptoms").notNull(), // JSON array as string
  duration: varchar({ length: 255 }).notNull(),
  severity: varchar({ length: 255 }).notNull(),
  medicationsMentioned: text("medications_mentioned").notNull(), // JSON array as string
  recommendations: text("recommendations").notNull(), // JSON array as string
  createdOn: varchar("created_on", { length: 255 }).notNull(),
});
import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  points: real("points").default(0).notNull(),
  tonBalance: real("ton_balance").default(0).notNull(),
  email: text("email"),
  walletAddress: text("wallet_address"),
  accountAgeYears: real("account_age_years").default(0),
  isEligible: boolean("is_eligible").default(false),
  lastCheckIn: timestamp("last_check_in"),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  points: true, 
  tonBalance: true, 
  accountAgeYears: true, 
  isEligible: true,
  lastCheckIn: true,
  createdAt: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// API Schemas
export const checkEligibilitySchema = z.object({
  telegramId: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  referredBy: z.string().optional(),
  // For demo purposes, we might allow passing explicit age, 
  // but in prod this would be calculated from ID or API
  mockAgeYears: z.number().optional(), 
});

export const submitEmailSchema = z.object({
  telegramId: z.string(),
  email: z.string().email().refine((email) => {
    const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yandex.com'];
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }, { message: "Only Gmail, Hotmail, Outlook, Yahoo, and Yandex are allowed." }),
});

export const checkInSchema = z.object({
  telegramId: z.string(),
});

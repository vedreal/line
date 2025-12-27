import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(telegramId: string, user: Partial<InsertUser>): Promise<User>;
  getReferrals(telegramId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(telegramId: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.telegramId, telegramId))
      .returning();
    return user;
  }

  async getReferrals(telegramId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.referredBy, telegramId));
  }
}

export const storage = new DatabaseStorage();

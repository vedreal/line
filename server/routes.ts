import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth / Login / Eligibility Check
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      
      let user = await storage.getUser(input.telegramId);

      if (!user) {
        // Create new user logic
        // 1. Calculate Eligibility & Age Points
        // Mock age logic: If mockAgeYears provided, use it. Else random between 0.5 and 5.
        const age = input.mockAgeYears ?? (Math.random() * 4.5 + 0.5); 
        const isEligible = age >= 1;
        const points = isEligible ? Math.floor(age * 1000) : 0;

        // 2. Handle Referral
        if (input.referredBy && isEligible) {
          const referrer = await storage.getUser(input.referredBy);
          if (referrer) {
            // Reward referrer: 5 pts + 0.002 TON
            await storage.updateUser(referrer.telegramId, {
              points: referrer.points + 5,
              tonBalance: referrer.tonBalance + 0.002
            });
          }
        }

        // 3. Create User
        user = await storage.createUser({
          telegramId: input.telegramId,
          username: input.username,
          firstName: input.firstName,
          lastName: input.lastName,
          accountAgeYears: age,
          isEligible: isEligible,
          points: points,
          tonBalance: 0,
          referralCode: input.telegramId, // Simple referral code
          referredBy: input.referredBy,
        });
        
        return res.status(201).json(user);
      }

      // User exists, return current data
      return res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Get User
  app.get(api.user.get.path, async (req, res) => {
    const user = await storage.getUser(req.params.telegramId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  // Check-in
  app.post(api.user.checkIn.path, async (req, res) => {
    try {
      const input = api.user.checkIn.input.parse(req.body);
      const user = await storage.getUser(input.telegramId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already checked in today (UTC)
      const now = new Date();
      const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
      
      let canCheckIn = true;
      if (lastCheckIn) {
        const isSameDay = 
          now.getUTCFullYear() === lastCheckIn.getUTCFullYear() &&
          now.getUTCMonth() === lastCheckIn.getUTCMonth() &&
          now.getUTCDate() === lastCheckIn.getUTCDate();
        if (isSameDay) {
          canCheckIn = false;
        }
      }

      if (!canCheckIn) {
        return res.status(403).json({ message: "Already checked in today" });
      }

      const updatedUser = await storage.updateUser(input.telegramId, {
        points: user.points + 10,
        lastCheckIn: now
      });

      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      }
    }
  });

  // Submit Email
  app.post(api.user.submitEmail.path, async (req, res) => {
    try {
      const input = api.user.submitEmail.input.parse(req.body);
      
      // Check if email already set (optional requirement: "tersave permanen ga bisa di ubah lagi")
      const existingUser = await storage.getUser(input.telegramId);
      if (existingUser?.email) {
         return res.status(400).json({ message: "Email already submitted and cannot be changed." });
      }

      const user = await storage.updateUser(input.telegramId, {
        email: input.email
      });
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      }
    }
  });

  // Get Referrals
  app.get(api.referrals.list.path, async (req, res) => {
    const referrals = await storage.getReferrals(req.params.telegramId);
    res.json(referrals);
  });

  // Seeding
  if (process.env.NODE_ENV !== 'production') {
    const existing = await storage.getUser('seed_user_1');
    if (!existing) {
      console.log('Seeding database...');
      // Eligible user
      await storage.createUser({
        telegramId: 'seed_user_1',
        username: 'crypto_king',
        firstName: 'Alex',
        accountAgeYears: 2.5,
        isEligible: true,
        points: 2500,
        tonBalance: 0,
        referralCode: 'seed_user_1'
      });
      // Not eligible user
      await storage.createUser({
        telegramId: 'seed_user_2',
        username: 'noob_trader',
        firstName: 'Bob',
        accountAgeYears: 0.5,
        isEligible: false,
        points: 0,
        tonBalance: 0,
        referralCode: 'seed_user_2'
      });
    }
  }

  return httpServer;
}

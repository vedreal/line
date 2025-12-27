import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertUser } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Mock Telegram WebApp Data (for development)
const getTelegramUser = () => {
  // In a real TWA, this comes from window.Telegram.WebApp.initDataUnsafe
  // For dev, we mock a user
  return {
    id: "123456789",
    username: "crypto_fan_dev",
    first_name: "Alex",
    last_name: "Dev",
  };
};

// Hook to check eligibility / Login
export function useEligibility() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (mockAgeYears?: number) => {
      const tgUser = getTelegramUser();
      const payload = {
        telegramId: String(tgUser.id),
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        mockAgeYears: mockAgeYears // Optional for demo
      };

      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to check eligibility");
      }

      return api.auth.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Update the 'currentUser' query cache
      queryClient.setQueryData([api.user.get.path, String(data.telegramId)], data);
      
      if (!data.isEligible) {
        toast({
          variant: "destructive",
          title: "Not Eligible",
          description: "Your Telegram account must be at least 1 year old.",
        });
      }
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  });
}

// Hook to get current user data
export function useUser(telegramId?: string) {
  // Default to mock ID if not passed (for simpler dev flow)
  const id = telegramId || String(getTelegramUser().id);

  return useQuery({
    queryKey: [api.user.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.user.get.path, { telegramId: id });
      const res = await fetch(url);
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      
      return api.user.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Hook for Daily Check-in
export function useCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (telegramId: string) => {
      const res = await fetch(api.user.checkIn.path, {
        method: api.user.checkIn.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Check-in failed");
      }

      return api.user.checkIn.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.user.get.path, data.telegramId] });
      toast({
        title: "Checked In!",
        description: "You've earned 10 points.",
        className: "bg-green-600 text-white border-none",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Check-in Failed",
        description: error.message,
      });
    }
  });
}

// Hook for Email Submission
export function useSubmitEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ telegramId, email }: { telegramId: string, email: string }) => {
      const res = await fetch(api.user.submitEmail.path, {
        method: api.user.submitEmail.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, email }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit email");
      }

      return api.user.submitEmail.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.user.get.path, data.telegramId] });
      toast({
        title: "Success",
        description: "Email saved successfully!",
        className: "bg-blue-600 text-white border-none",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: error.message,
      });
    }
  });
}

// Hook to get referrals
export function useReferrals(telegramId?: string) {
  const id = telegramId || String(getTelegramUser().id);

  return useQuery({
    queryKey: [api.referrals.list.path, id],
    queryFn: async () => {
      const url = buildUrl(api.referrals.list.path, { telegramId: id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch referrals");
      return api.referrals.list.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

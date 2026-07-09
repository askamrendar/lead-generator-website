import { z } from 'zod';

/** Lead capture schema — shared by the client form and the API route. */
export const leadSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  phone: z
    .string()
    .min(7, 'Please enter a valid phone number')
    .regex(/[0-9]/, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email'),
  service: z.string().optional(),
  message: z.string().max(1000).optional(),
  /**
   * Honeypot — a hidden field real users never see. It must accept ANY value at
   * the schema level: a bot that fills it should pass validation and then be
   * silently dropped by the API route (`if (parsed.data.company)`), never
   * rejected with a 422 that would reveal which field is the trap.
   */
  company: z.string().max(200).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

import { z } from "zod";

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a ticket title.")
    .max(200, "Ticket titles must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Describe the problem you are experiencing.")
    .max(20000, "Descriptions must be 20,000 characters or fewer."),
});

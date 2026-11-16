import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .max(254, "Email must be 254 characters or fewer.")
  .email("Enter a valid email address.");

const passwordByteLength = (password) => new TextEncoder().encode(password).length;

const loginPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .max(72, "Password must be 72 characters or fewer.")
  .refine((password) => passwordByteLength(password) <= 72, {
    message: "Password must be 72 UTF-8 bytes or fewer.",
  });

const registrationPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(72, "Password must be 72 characters or fewer.")
  .refine((password) => passwordByteLength(password) <= 72, {
    message: "Password must be 72 UTF-8 bytes or fewer.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registrationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(160, "Name must be 160 characters or fewer."),
    email: emailSchema,
    password: registrationPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

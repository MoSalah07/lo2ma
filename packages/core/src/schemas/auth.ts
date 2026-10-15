import { z } from 'zod';

export const otpChannelSchema = z.enum(['phone', 'email']);
export type OtpChannel = z.infer<typeof otpChannelSchema>;

/** The phone number is national (10 digits, see normalizeEgyptMobile); the email is lowercase. */
export const otpRequestSchema = z.object({
  channel: otpChannelSchema,
  destination: z.string().min(1),
});
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const OTP_LENGTH = 6;

export const otpVerifySchema = otpRequestSchema.extend({
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`)),
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  email: z.email().optional(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

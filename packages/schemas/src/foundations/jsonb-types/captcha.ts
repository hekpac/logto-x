import { z } from 'zod';

export enum CaptchaType {
  RecaptchaEnterprise = 'RecaptchaEnterprise',
  Turnstile = 'Turnstile',
}

export const turnstileConfigGuard = z.object({
  type: z.literal(CaptchaType.Turnstile),
  siteKey: z.string(),
  secretKey: z.string(),
});

export type TurnstileConfig = z.infer<typeof turnstileConfigGuard>;

export const recaptchaEnterpriseConfigGuard = z.object({
  type: z.literal(CaptchaType.RecaptchaEnterprise),
  siteKey: z.string(),
  secretKey: z.string(),
  projectId: z.string(),
  /** The minimum acceptable score returned from reCAPTCHA Enterprise. */
  scoreThreshold: z.number().min(0).max(1).optional().default(0.7),
});

export type RecaptchaEnterpriseConfig = z.infer<typeof recaptchaEnterpriseConfigGuard>;

export const captchaConfigGuard = z.discriminatedUnion('type', [
  turnstileConfigGuard,
  recaptchaEnterpriseConfigGuard,
]);

export type CaptchaConfig = z.infer<typeof captchaConfigGuard>;

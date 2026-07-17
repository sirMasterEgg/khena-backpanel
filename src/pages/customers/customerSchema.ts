import { z } from "zod";
import { isValidEmail, isValidPhone } from "@/lib/validation";

export const customerSchema = z.object({
	name: z.string().trim().min(1, "Full name is required"),
	// Email wajib dan formatnya harus valid.
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.refine(isValidEmail, "Masukkan email yang valid"),
	// Phone opsional, tapi kalau diisi harus format nomor HP yang valid.
	phone: z
		.string()
		.trim()
		.optional()
		.refine((v) => !v || isValidPhone(v), "Masukkan nomor HP yang valid"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

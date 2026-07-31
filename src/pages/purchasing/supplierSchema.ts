import { z } from "zod";

/** Pola dari contract.md bagian 15. */
const PHONE_PATTERN = /^\+?[0-9][0-9 -]{6,18}$/;

export const supplierSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Supplier name is required")
		.max(255, "Maksimal 255 karakter"),
	contactPerson: z.string().trim().max(255, "Maksimal 255 karakter"),
	// Opsional di form (string kosong OK), tapi kalau diisi harus valid.
	phone: z.union([
		z.literal(""),
		z
			.string()
			.trim()
			.max(20, "Maksimal 20 karakter")
			.regex(PHONE_PATTERN, "Masukkan nomor telepon yang valid"),
	]),
	email: z.union([
		z.literal(""),
		z
			.string()
			.trim()
			.max(255, "Maksimal 255 karakter")
			.pipe(z.email("Masukkan email yang valid")),
	]),
	note: z.string().trim(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

import { z } from "zod";

/** Pola dari contract.md bagian 11 — huruf & tanda baca saja, tanpa angka. */
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z .,'-]*$/;
/** Pola dari contract.md bagian 11 — LEBIH KETAT dari isValidPhone() di lib. */
const PHONE_PATTERN = /^\+?[0-9][0-9 -]{6,18}$/;

export const customerFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Full name is required")
		.max(255, "Maksimal 255 karakter")
		.regex(NAME_PATTERN, "Nama hanya boleh huruf, spasi, dan tanda . , ' -"),
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.max(255, "Maksimal 255 karakter")
		// Cek format lewat pipe supaya jalan SETELAH trim — z.email().trim() akan
		// mengecek format sebelum trim, menolak email yang di-paste dengan spasi.
		.pipe(z.email("Masukkan email yang valid")),
	// WAJIB (beda dengan customerSchema.ts lama yang opsional).
	phone: z
		.string()
		.trim()
		.min(1, "Phone is required")
		.max(20, "Maksimal 20 karakter")
		.regex(PHONE_PATTERN, "Masukkan nomor HP yang valid, mis. 081234567890"),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

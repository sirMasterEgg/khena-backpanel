import { z } from "zod";

export const supplierSchema = z.object({
	name: z.string().trim().min(1, "Supplier name is required"),
	contactPerson: z.string().trim().optional(),
	phone: z.string().trim().optional(),
	// Email opsional: string kosong OK, kalau diisi harus format valid.
	email: z
		.union([z.literal(""), z.string().email("Invalid email format")])
		.optional(),
	notes: z.string().trim().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

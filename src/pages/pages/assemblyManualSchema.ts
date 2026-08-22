import { z } from "zod";

export const assemblyManualSchema = z.object({
	productName: z.string().trim().min(1, "Product name is required"),
	productSku: z.string().trim().optional(),
	fileName: z.string().trim().min(1, "PDF file is required"),
});

export type AssemblyManualFormData = z.infer<typeof assemblyManualSchema>;

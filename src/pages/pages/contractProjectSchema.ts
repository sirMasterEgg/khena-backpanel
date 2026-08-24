import { z } from "zod";

export const contractProjectSchema = z.object({
	field: z.string().trim().min(1, "Field is required"),
	description: z.string().trim().min(1, "Short description is required"),
	status: z.enum(["published", "draft"]),
});

export type ContractProjectFormData = z.infer<typeof contractProjectSchema>;

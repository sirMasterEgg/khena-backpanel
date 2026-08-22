import { z } from "zod";

export const contractProjectSchema = z.object({
	title: z.string().trim().min(1, "Title is required"),
	field: z.string().trim().min(1, "Field is required"),
	description: z.string().trim().min(1, "Short description is required"),
	coverUrl: z.string().min(1, "Cover image is required"),
	status: z.enum(["published", "draft"]),
});

export type ContractProjectFormData = z.infer<typeof contractProjectSchema>;

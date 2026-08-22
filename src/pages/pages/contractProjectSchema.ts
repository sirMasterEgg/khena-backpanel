import { z } from "zod";

export const contractProjectSchema = z.object({
	title: z.string().trim().min(1, "Title is required"),
	client: z.string().trim().min(1, "Client is required"),
	location: z.string().trim().min(1, "Location is required"),
	year: z.string().trim().min(1, "Year is required"),
	coverUrl: z.string().min(1, "Cover image is required"),
	status: z.enum(["published", "draft"]),
});

export type ContractProjectFormData = z.infer<typeof contractProjectSchema>;

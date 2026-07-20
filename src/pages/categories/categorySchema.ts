import { z } from "zod";

export const categorySchema = z.object({
	category: z.string().trim().min(1, "Category name is required"),
	roomTypeId: z.string().trim().min(1, "Room type is required"),
	order: z.number().min(0, "Display order must be 0 or greater"),
	status: z.enum(["published", "draft"]),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

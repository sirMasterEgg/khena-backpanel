import { z } from "zod";

export const categorySchema = z.object({
	name: z.string().trim().min(1, "Category name is required"),
	roomType: z.string().trim().min(1, "Room type is required"),
	displayOrder: z.number().min(0, "Display order must be 0 or greater"),
	status: z.enum(["published", "draft"]),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

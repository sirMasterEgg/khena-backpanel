import { z } from "zod";

export const roleFormSchema = z.object({
	name: z.string().trim().min(1, "Role name is required").max(255),
	description: z.string(),
	permissions: z.array(z.string()),
});

export type RoleFormData = z.infer<typeof roleFormSchema>;

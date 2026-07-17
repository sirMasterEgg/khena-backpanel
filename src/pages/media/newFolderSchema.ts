import { z } from "zod";

export const newFolderSchema = z.object({
	name: z.string().trim().min(1, "Folder name is required"),
});

export type NewFolderFormData = z.infer<typeof newFolderSchema>;

import { z } from "zod";

export const jobSchema = z.object({
	jobTitle: z.string().trim().min(1, "Position title is required").max(255),
	/** "" = belum dipilih. Isinya SELALU uuid, tidak pernah teks nama. */
	departmentId: z.string().min(1, "Department is required"),
	location: z.string().trim().min(1, "Location is required").max(255),
	employmentTypeId: z.string().min(1, "Employment type is required"),
	status: z.enum(["open", "closed", "draft"]),
	roleDescription: z.string().trim().min(1, "Role description is required"),
	requirements: z.string().trim().min(1, "Requirements is required"),
	/** Opsional di server; di form pakai "" lalu dikonversi saat submit. */
	benefits: z.string(),
});

export type JobFormData = z.infer<typeof jobSchema>;

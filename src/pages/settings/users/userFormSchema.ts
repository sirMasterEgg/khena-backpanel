import { z } from "zod";

/** `isEditing = false` → password wajib min 8. `isEditing = true` → boleh "" (tidak diubah). */
export function makeUserFormSchema(isEditing: boolean) {
	return z
		.object({
			name: z.string().trim().min(1, "Name is required").max(255),
			email: z
				.string()
				.trim()
				.min(1, "Email is required")
				.email("Invalid email")
				.max(255),
			roleId: z.string().min(1, "Role is required"),
			/** "" = tidak diubah (khusus mode edit). */
			password: z.string(),
		})
		.superRefine((d, ctx) => {
			if (!isEditing && d.password.length < 8) {
				ctx.addIssue({
					code: "custom",
					path: ["password"],
					message: "Password must be at least 8 characters",
				});
			}
			if (isEditing && d.password.length > 0 && d.password.length < 8) {
				ctx.addIssue({
					code: "custom",
					path: ["password"],
					message: "Password must be at least 8 characters",
				});
			}
		});
}

export type UserFormData = z.infer<ReturnType<typeof makeUserFormSchema>>;

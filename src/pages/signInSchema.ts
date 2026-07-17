import { z } from "zod";

export const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Masukkan email yang valid"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean(),
});

export type SignInFormData = z.infer<typeof signInSchema>;

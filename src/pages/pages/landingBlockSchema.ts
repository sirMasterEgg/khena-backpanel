import { z } from "zod";

export const landingBlockSchema = z.object({
	name: z.string().trim().min(1, "Block name is required"),
	headline: z.string().trim().min(1, "Headline is required"),
	buttonLabel: z.string().trim().min(1, "Button label is required"),
	// Free text — kosong berarti "no destination set".
	buttonDestination: z.string(),
	mediaUrl: z.string().min(1, "Hero image is required"),
});

export type LandingBlockFormData = z.infer<typeof landingBlockSchema>;

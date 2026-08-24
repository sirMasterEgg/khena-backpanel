import { z } from "zod";

export const qnaItemSchema = z.object({
	question: z.string().trim().min(1, "Question is required"),
	answer: z.string().trim().min(1, "Answer is required"),
	category: z.string().optional(),
});

/** Varian FAQ — kategori wajib diisi. */
export const faqItemSchema = qnaItemSchema.extend({
	category: z.string().min(1, "Category is required"),
});

export type QnaItemFormData = z.infer<typeof qnaItemSchema>;

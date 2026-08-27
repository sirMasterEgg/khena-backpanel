import { zodResolver } from "@hookform/resolvers/zod";
import {
	Autocomplete,
	Button,
	Group,
	Modal,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { FAQ_CATEGORIES, type QnaItem } from "./landingTypes";
import {
	faqItemSchema,
	type QnaItemFormData,
	qnaItemSchema,
} from "./qnaItemSchema";

interface QnaItemModalProps {
	opened: boolean;
	onClose: () => void;
	onSave: (data: QnaItemFormData) => void;
	item?: QnaItem | null;
	withCategory?: boolean;
	/** Kategori yang sudah pernah dipakai di item FAQ lain — jadi saran tambahan. */
	existingCategories?: string[];
}

export function QnaItemModal({
	opened,
	onClose,
	onSave,
	item,
	withCategory,
	existingCategories,
}: QnaItemModalProps) {
	const isEdit = Boolean(item);

	// Free text + saran: gabungan kategori baku (FAQ_CATEGORIES) dan kategori
	// yang sudah pernah diketik user di item lain, supaya penamaan tetap
	// konsisten tanpa mengunci user ke daftar tetap.
	const categorySuggestions = useMemo(
		() =>
			Array.from(
				new Set([...FAQ_CATEGORIES, ...(existingCategories ?? [])]),
			).sort((a, b) => a.localeCompare(b)),
		[existingCategories],
	);

	const {
		control,
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<QnaItemFormData>({
		resolver: zodResolver(withCategory ? faqItemSchema : qnaItemSchema),
		defaultValues: { question: "", answer: "", category: "" },
	});

	// Reset form tiap kali modal dibuka, baik mode tambah maupun edit.
	useEffect(() => {
		if (!opened) return;
		reset({
			question: item?.question ?? "",
			answer: item?.answer ?? "",
			category: item?.category ?? "",
		});
	}, [opened, item, reset]);

	const onSubmit = (data: QnaItemFormData) => {
		onSave(data);
		onClose();
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEdit ? "Edit item" : "Add item"}
			centered
		>
			<Stack gap="md">
				<TextInput
					label="Question"
					{...register("question")}
					error={errors.question?.message}
				/>
				<Textarea
					label="Answer"
					autosize
					minRows={3}
					{...register("answer")}
					error={errors.answer?.message}
				/>
				{withCategory && (
					<Controller
						name="category"
						control={control}
						render={({ field }) => (
							<Autocomplete
								label="Category"
								placeholder="e.g. Ordering"
								data={categorySuggestions}
								value={field.value}
								onChange={field.onChange}
								error={errors.category?.message}
							/>
						)}
					/>
				)}
				<Group justify="flex-end" mt="sm">
					<Button type="button" variant="default" onClick={onClose}>
						Cancel
					</Button>
					<Button type="button" onClick={handleSubmit(onSubmit)}>
						Save
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Group,
	Modal,
	Select,
	Stack,
	Textarea,
	TextInput,
} from "@mantine/core";
import { useEffect } from "react";
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
}

const FAQ_CATEGORY_OPTIONS = FAQ_CATEGORIES.map((c) => ({
	value: c,
	label: c,
}));

export function QnaItemModal({
	opened,
	onClose,
	onSave,
	item,
	withCategory,
}: QnaItemModalProps) {
	const isEdit = Boolean(item);

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
							<Select
								label="Category"
								data={FAQ_CATEGORY_OPTIONS}
								value={field.value || null}
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

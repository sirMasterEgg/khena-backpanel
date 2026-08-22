import { zodResolver } from "@hookform/resolvers/zod";
import {
	Button,
	Card,
	Group,
	Modal,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconFileTypePdf, IconSearch } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { MediaFile } from "@/api/media";
import { listProducts } from "@/api/products";
import type { AssemblyManual } from "@/data/dummy";
import { MediaPickerModal } from "@/pages/color/MediaPickerModal";
import {
	type AssemblyManualFormData,
	assemblyManualSchema,
} from "./assemblyManualSchema";

/** Perkiraan ukuran file dari MediaFile — dummy data cukup pakai KB/MB kasar. */
function formatFileSize(bytes: number) {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface AssemblyManualModalProps {
	opened: boolean;
	onClose: () => void;
	onSave: (data: AssemblyManualFormData & { fileSize: string }) => void;
	manual?: AssemblyManual | null;
}

export function AssemblyManualModal({
	opened,
	onClose,
	onSave,
	manual,
}: AssemblyManualModalProps) {
	const isEdit = Boolean(manual);
	const [pickerOpened, setPickerOpened] = useState(false);
	const [fileSize, setFileSize] = useState("");
	// Dropdown hasil pencarian produk cuma tampil selagi input sedang difokus.
	const [searchFocused, setSearchFocused] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<AssemblyManualFormData>({
		resolver: zodResolver(assemblyManualSchema),
		defaultValues: { productName: "", fileName: "" },
	});

	const productNameField = register("productName");

	const fileName = watch("fileName");
	const productName = watch("productName");
	const [debouncedProductName] = useDebouncedValue(productName, 300);

	const productSearchQuery = useQuery({
		queryKey: ["products", { search: debouncedProductName, forAssembly: true }],
		queryFn: () => listProducts({ search: debouncedProductName, limit: 8 }),
		enabled: debouncedProductName.trim().length > 0,
	});
	const productSuggestions = productSearchQuery.data?.data ?? [];
	const showDropdown =
		searchFocused &&
		debouncedProductName.trim().length > 0 &&
		productSuggestions.length > 0;

	useEffect(() => {
		if (!opened) return;
		reset({
			productName: manual?.productName ?? "",
			fileName: manual?.fileName ?? "",
		});
		setFileSize(manual?.fileSize ?? "");
	}, [opened, manual, reset]);

	const handlePick = (file: MediaFile) => {
		setValue("fileName", file.name, { shouldValidate: true });
		setFileSize(formatFileSize(file.sizeBytes));
		setPickerOpened(false);
	};

	const onSubmit = (data: AssemblyManualFormData) => {
		onSave({ ...data, fileSize });
		onClose();
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				title={isEdit ? "Replace manual" : "Add manual"}
				centered
			>
				<Stack gap="md">
					<div style={{ position: "relative" }}>
						<TextInput
							label="Product name"
							placeholder="Search product..."
							leftSection={<IconSearch size={16} />}
							{...productNameField}
							onFocus={() => setSearchFocused(true)}
							onBlur={(e) => {
								productNameField.onBlur(e);
								setTimeout(() => setSearchFocused(false), 150);
							}}
							error={errors.productName?.message}
						/>
						{showDropdown && (
							<Card
								withBorder
								p="xs"
								style={{
									position: "absolute",
									zIndex: 10,
									width: "100%",
									marginTop: 4,
									maxHeight: 220,
									overflowY: "auto",
								}}
							>
								<Stack gap={4}>
									{productSuggestions.map((product) => (
										<Button
											key={product.id}
											type="button"
											variant="subtle"
											justify="flex-start"
											fullWidth
											onClick={() =>
												setValue("productName", product.name, {
													shouldValidate: true,
												})
											}
										>
											{product.name} ({product.baseSku})
										</Button>
									))}
								</Stack>
							</Card>
						)}
					</div>
					<Stack gap="xs">
						<Text size="sm" fw={500}>
							PDF file
						</Text>
						{fileName && (
							<Group gap="xs">
								<IconFileTypePdf size={18} />
								<Text size="sm">{fileName}</Text>
							</Group>
						)}
						{errors.fileName && (
							<Text size="xs" c="red">
								{errors.fileName.message}
							</Text>
						)}
						<Button
							type="button"
							variant="default"
							onClick={() => setPickerOpened(true)}
						>
							Choose PDF
						</Button>
					</Stack>
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

			<MediaPickerModal
				opened={pickerOpened}
				onClose={() => setPickerOpened(false)}
				onSelect={handlePick}
				type="document"
			/>
		</>
	);
}

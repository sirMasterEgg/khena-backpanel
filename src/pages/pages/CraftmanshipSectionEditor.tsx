import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Button,
	Card,
	Grid,
	Group,
	Image,
	Slider,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconArrowDown,
	IconArrowUp,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { PAGES_ACCEPTED_IMAGE_TYPES, PAGES_MAX_IMAGE_BYTES } from "@/api/pages";
import { notify } from "@/components/notify";
import {
	type CraftmanshipSectionFormData,
	type CraftmanshipSlideFormData,
	craftmanshipSectionSchema,
	DURATION_PRESETS,
	MAX_SLIDE_SECONDS,
	MIN_SLIDE_SECONDS,
} from "./craftmanshipSectionSchema";
import type { CraftmanshipSection } from "./landingTypes";

/** Buang "/" di depan supaya tidak dobel dengan leftSection input. */
function stripLeadingSlash(value: string) {
	return value.replace(/^\/+/, "");
}

/** Revoke object URL preview kalau memang blob — URL server biasa dibiarkan. */
function revokeIfBlob(url: string) {
	if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

interface CraftmanshipSectionEditorProps {
	section: CraftmanshipSection;
	/**
	 * `slideFiles` = file baru per slide (key = slide id), belum diupload.
	 * Slide yang gambarnya tidak diganti tidak punya entri di sini.
	 */
	onSave: (
		data: CraftmanshipSectionFormData,
		slideFiles: Record<string, File | null>,
	) => void;
	onCancel: () => void;
	isSaving?: boolean;
	canSave?: boolean;
}

export function CraftmanshipSectionEditor({
	section,
	onSave,
	onCancel,
	isSaving = false,
	canSave = true,
}: CraftmanshipSectionEditorProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		control,
		formState: { errors },
	} = useForm<CraftmanshipSectionFormData>({
		resolver: zodResolver(craftmanshipSectionSchema),
		defaultValues: {
			eyebrow: section.eyebrow,
			ctaText: section.ctaText,
			ctaLink: stripLeadingSlash(section.ctaLink),
			slides: section.slides.map((s) => ({
				id: s.id,
				imageUrl: s.image.url,
				imageAlt: s.image.alt,
				caption: s.caption,
				title: s.title,
				description: s.description,
			})),
			slideDurationSec: section.slideDurationSec,
		},
	});

	// File baru per slide (belum diupload) — ditahan sampai Save (gotcha #6:
	// key hanya lahir saat dirujuk, lihat createFileCollector di src/api/pages.ts).
	const [slideFiles, setSlideFiles] = useState<Record<string, File | null>>({});

	const ctaText = watch("ctaText");
	const hasCtaText = ctaText.trim().length > 0;
	const slides = watch("slides");
	const durationSec = watch("slideDurationSec");

	// Lacak slide terbaru supaya cleanup unmount bisa revoke semua blob URL
	// tanpa perlu deps effect berubah tiap kali slides berubah.
	const slidesRef = useRef(slides);
	slidesRef.current = slides;

	useEffect(() => {
		return () => {
			for (const s of slidesRef.current) revokeIfBlob(s.imageUrl);
		};
	}, []);

	const updateSlides = (next: CraftmanshipSlideFormData[]) =>
		setValue("slides", next, { shouldDirty: true, shouldValidate: true });

	const moveSlide = (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= slides.length) return;
		const next = [...slides];
		[next[index], next[target]] = [next[target], next[index]];
		updateSlides(next);
	};

	const updateSlideField = (
		index: number,
		field: "title" | "caption" | "description",
		value: string,
	) =>
		updateSlides(
			slides.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
		);

	const confirmDeleteSlide = (index: number) => {
		const target = slides[index];
		modals.openConfirmModal({
			title: "Delete slide",
			children: (
				<Text size="sm">
					Hapus slide ini dari carousel? Tindakan ini tidak bisa dibatalkan.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => {
				revokeIfBlob(target.imageUrl);
				setSlideFiles((prev) => {
					const next = { ...prev };
					delete next[target.id];
					return next;
				});
				updateSlides(slides.filter((_, i) => i !== index));
			},
		});
	};

	const handleFilesSelected = (list: FileList | null) => {
		if (fileInputRef.current) fileInputRef.current.value = "";
		const files = Array.from(list ?? []);
		if (files.length === 0) return;

		const validFiles = files.filter((f) => f.size <= PAGES_MAX_IMAGE_BYTES);
		if (validFiles.length < files.length) {
			notify.error("Sebagian gambar melebihi 5 MB dan dilewati");
		}
		if (validFiles.length === 0) return;

		const newSlides = validFiles.map((file) => ({
			id: crypto.randomUUID(),
			file,
			imageUrl: URL.createObjectURL(file),
			imageAlt: "",
			caption: "",
			title: "",
			description: "",
		}));
		updateSlides([...slides, ...newSlides.map(({ file, ...slide }) => slide)]);
		setSlideFiles((prev) => {
			const next = { ...prev };
			for (const s of newSlides) next[s.id] = s.file;
			return next;
		});
		notify.success(`${newSlides.length} slide ditambahkan`);
	};

	const onSubmit = (data: CraftmanshipSectionFormData) => {
		const text = data.ctaText.trim();
		const link = text ? stripLeadingSlash(data.ctaLink.trim()) : "";
		onSave(
			{
				...data,
				ctaText: text,
				ctaLink: link ? `/${link}` : "",
			},
			slideFiles,
		);
	};

	return (
		<Grid gap="lg">
			{/* KIRI — daftar slide */}
			<Grid.Col span={{ base: 12, lg: 7 }}>
				<Card withBorder>
					<Stack gap="md">
						<Text fw={600}>Slides ({slides.length})</Text>

						{errors.slides?.message && (
							<Text size="xs" c="red">
								{errors.slides.message}
							</Text>
						)}

						{slides.length === 0 ? (
							<Text size="sm" c="dimmed">
								No slides yet — add photos below.
							</Text>
						) : (
							<Stack gap="sm">
								{slides.map((slide, index) => (
									<Card key={slide.id} withBorder padding="sm">
										<Group align="flex-start" wrap="nowrap">
											<Stack gap={2}>
												<ActionIcon
													type="button"
													variant="subtle"
													size="sm"
													disabled={index === 0}
													aria-label="Move slide up"
													onClick={() => moveSlide(index, -1)}
												>
													<IconArrowUp size={14} />
												</ActionIcon>
												<ActionIcon
													type="button"
													variant="subtle"
													size="sm"
													disabled={index === slides.length - 1}
													aria-label="Move slide down"
													onClick={() => moveSlide(index, 1)}
												>
													<IconArrowDown size={14} />
												</ActionIcon>
											</Stack>
											<Image
												src={slide.imageUrl}
												w={96}
												h={64}
												fit="cover"
												radius="sm"
											/>
											<Stack gap={2} style={{ flex: "0 0 auto" }}>
												<Text size="sm" fw={500}>
													Slide {index + 1}
												</Text>
											</Stack>
											<Stack gap="xs" style={{ flex: 1 }}>
												<TextInput
													placeholder="Title"
													size="sm"
													value={slide.title}
													onChange={(e) =>
														updateSlideField(
															index,
															"title",
															e.currentTarget.value,
														)
													}
												/>
												<TextInput
													placeholder="Caption"
													size="sm"
													value={slide.caption}
													onChange={(e) =>
														updateSlideField(
															index,
															"caption",
															e.currentTarget.value,
														)
													}
												/>
												<Textarea
													placeholder="Description"
													size="sm"
													autosize
													minRows={2}
													value={slide.description}
													onChange={(e) =>
														updateSlideField(
															index,
															"description",
															e.currentTarget.value,
														)
													}
												/>
											</Stack>
											<ActionIcon
												type="button"
												variant="subtle"
												color="red"
												aria-label="Delete slide"
												onClick={() => confirmDeleteSlide(index)}
											>
												<IconTrash size={16} />
											</ActionIcon>
										</Group>
									</Card>
								))}
							</Stack>
						)}

						<input
							ref={fileInputRef}
							type="file"
							accept={PAGES_ACCEPTED_IMAGE_TYPES}
							multiple
							hidden
							onChange={(e) => handleFilesSelected(e.currentTarget.files)}
						/>
						<Button
							type="button"
							fullWidth
							variant="default"
							leftSection={<IconPlus size={16} />}
							onClick={() => fileInputRef.current?.click()}
						>
							Add slides
						</Button>
					</Stack>
				</Card>
			</Grid.Col>

			{/* KANAN — settings */}
			<Grid.Col span={{ base: 12, lg: 5 }}>
				<Stack gap="md">
					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Call to action</Text>
							<TextInput
								label="Eyebrow (optional)"
								description="Small text shown above the CTA"
								{...register("eyebrow")}
								error={errors.eyebrow?.message}
							/>
							<TextInput
								label="CTA text (optional)"
								{...register("ctaText")}
								error={errors.ctaText?.message}
							/>
							{hasCtaText && (
								<TextInput
									label="CTA link"
									leftSection="/"
									placeholder="products"
									{...register("ctaLink")}
									error={errors.ctaLink?.message}
								/>
							)}
						</Stack>
					</Card>

					<Card withBorder>
						<Stack gap="md">
							<Stack gap={2}>
								<Text fw={600}>Auto-rotation</Text>
								<Text size="sm" c="dimmed">
									How long each slide stays on screen before the next one.
								</Text>
							</Stack>

							<Stack gap="xs">
								<Text size="sm" fw={500}>
									Time per slide: {durationSec}s
								</Text>
								<Controller
									name="slideDurationSec"
									control={control}
									render={({ field }) => (
										<Slider
											min={MIN_SLIDE_SECONDS}
											max={MAX_SLIDE_SECONDS}
											step={1}
											value={field.value}
											onChange={field.onChange}
											marks={[
												{ value: MIN_SLIDE_SECONDS, label: "fast" },
												{ value: MAX_SLIDE_SECONDS, label: "slow" },
											]}
										/>
									)}
								/>
							</Stack>

							<Group gap="xs">
								{DURATION_PRESETS.map((sec) => (
									<Button
										key={sec}
										type="button"
										size="xs"
										variant={durationSec === sec ? "filled" : "default"}
										onClick={() =>
											setValue("slideDurationSec", sec, { shouldDirty: true })
										}
									>
										{sec}s
									</Button>
								))}
							</Group>
						</Stack>
					</Card>

					<Group justify="flex-end">
						<Button
							type="button"
							variant="default"
							disabled={isSaving}
							onClick={onCancel}
						>
							Cancel
						</Button>
						<Button
							type="button"
							loading={isSaving}
							disabled={!canSave}
							onClick={handleSubmit(onSubmit)}
						>
							Save changes
						</Button>
					</Group>
				</Stack>
			</Grid.Col>
		</Grid>
	);
}

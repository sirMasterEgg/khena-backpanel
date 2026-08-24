import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Center,
	Grid,
	Group,
	Image,
	Slider,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
	Title,
	UnstyledButton,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
	IconArrowDown,
	IconArrowUp,
	IconPlus,
	IconTrash,
	IconUpload,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/api/client";
import { notify } from "@/components/notify";
import type { CarouselSlide, LandingBlock } from "@/data/dummy";
import {
	type CarouselBlockFormData,
	carouselBlockSchema,
	DURATION_PRESETS,
	MAX_SLIDE_SECONDS,
	MIN_SLIDE_SECONDS,
} from "./carouselBlockSchema";
import {
	ACCEPTED_IMAGE_TYPES,
	MAX_IMAGE_BYTES,
	uploadLandingImages,
} from "./uploadLandingMedia";

/** Buang "/" di depan supaya tidak dobel dengan leftSection input. */
function stripLeadingSlash(value: string) {
	return value.replace(/^\/+/, "");
}

interface CarouselBlockEditorProps {
	block: LandingBlock;
	onSave: (data: CarouselBlockFormData) => void;
	onCancel: () => void;
}

export function CarouselBlockEditor({
	block,
	onSave,
	onCancel,
}: CarouselBlockEditorProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		control,
		formState: { errors },
	} = useForm<CarouselBlockFormData>({
		resolver: zodResolver(carouselBlockSchema),
		defaultValues: {
			name: block.name,
			headline: block.headline,
			buttonLabel: block.buttonLabel,
			buttonDestination: stripLeadingSlash(block.buttonDestination ?? ""),
			slides: block.slides ?? [],
			slideDurationSec: block.slideDurationSec ?? 5,
			status: block.status,
		},
	});

	const blockName = watch("name");
	const headline = watch("headline");
	const buttonLabel = watch("buttonLabel");
	const hasButtonLabel = buttonLabel.trim().length > 0;
	const slides = watch("slides");
	const durationSec = watch("slideDurationSec");

	// Slide bergonta-ganti otomatis sesuai durasi rotasi.
	useEffect(() => {
		if (slides.length <= 1) return;
		const timer = setInterval(
			() => setActiveIndex((i) => (i + 1) % slides.length),
			durationSec * 1000,
		);
		return () => clearInterval(timer);
	}, [slides.length, durationSec]);

	// Slide terakhir bisa terhapus saat activeIndex sedang menunjuk ke sana.
	useEffect(() => {
		if (activeIndex >= slides.length) setActiveIndex(0);
	}, [activeIndex, slides.length]);

	const updateSlides = (next: CarouselSlide[]) =>
		setValue("slides", next, { shouldDirty: true });

	const moveSlide = (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= slides.length) return;
		const next = [...slides];
		[next[index], next[target]] = [next[target], next[index]];
		updateSlides(next);
		// Ikutkan preview supaya slide yang barusan dipindah tetap yang terlihat.
		if (activeIndex === index) setActiveIndex(target);
	};

	const updateCaption = (index: number, caption: string) =>
		updateSlides(slides.map((s, i) => (i === index ? { ...s, caption } : s)));

	const confirmDeleteSlide = (index: number) => {
		modals.openConfirmModal({
			title: "Delete slide",
			children: (
				<Text size="sm">
					Hapus slide ini dari carousel? Tindakan ini tidak bisa dibatalkan.
				</Text>
			),
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: () => updateSlides(slides.filter((_, i) => i !== index)),
		});
	};

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => uploadLandingImages(files),
		onSuccess: (urls) => {
			updateSlides([
				...slides,
				...urls.map((url) => ({
					id: crypto.randomUUID(),
					mediaUrl: url,
					caption: "",
				})),
			]);
			notify.success(`${urls.length} slide ditambahkan`);
		},
		onError: (err) => notify.error(getApiErrorMessage(err)),
	});

	const handleFilesSelected = (list: FileList | null) => {
		if (fileInputRef.current) fileInputRef.current.value = "";
		const files = Array.from(list ?? []);
		if (files.length === 0) return;

		const validFiles = files.filter((f) => f.size <= MAX_IMAGE_BYTES);
		if (validFiles.length < files.length) {
			notify.error("Sebagian gambar melebihi 10 MB dan dilewati");
		}
		if (validFiles.length > 0) uploadMutation.mutate(validFiles);
	};

	const onSubmit = (data: CarouselBlockFormData) => {
		const label = data.buttonLabel.trim();
		const destination = label
			? stripLeadingSlash(data.buttonDestination.trim())
			: "";
		onSave({
			...data,
			buttonLabel: label,
			buttonDestination: destination ? `/${destination}` : "",
		});
	};

	return (
		<Grid gap="lg">
			{/* KIRI — live preview */}
			<Grid.Col span={{ base: 12, lg: 7 }}>
				<Card withBorder>
					<Stack gap="md">
						<Stack gap={2}>
							<Text fw={600}>{blockName} — Preview</Text>
							<Text size="sm" c="dimmed">
								Slides rotate automatically every {durationSec}s
							</Text>
						</Stack>

						<Box
							pos="relative"
							h={320}
							style={{
								borderRadius: "var(--mantine-radius-sm)",
								overflow: "hidden",
							}}
						>
							{slides.length === 0 ? (
								<Center h="100%" bg="var(--mantine-color-gray-1)">
									<Stack gap={4} align="center">
										<IconUpload
											size={40}
											color="var(--mantine-color-gray-6)"
											stroke={1.5}
										/>
										<Text fw={500}>No slides yet</Text>
										<Text size="sm" c="dimmed">
											Add photos to start building this carousel.
										</Text>
									</Stack>
								</Center>
							) : (
								<>
									<Image
										src={slides[activeIndex]?.mediaUrl}
										h={320}
										fit="cover"
									/>
									{headline && (
										<Box
											pos="absolute"
											inset={0}
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												padding: "var(--mantine-spacing-md)",
												background: "rgba(0, 0, 0, 0.25)",
											}}
										>
											<Title
												order={3}
												c="white"
												ta="center"
												style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
											>
												{headline}
											</Title>
										</Box>
									)}
									{slides[activeIndex]?.caption && (
										<Box
											pos="absolute"
											bottom={0}
											left={0}
											right={0}
											p="sm"
											style={{
												background:
													"linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
											}}
										>
											<Text size="sm" c="white">
												{slides[activeIndex]?.caption}
											</Text>
										</Box>
									)}
									<Group
										justify="center"
										gap={6}
										pos="absolute"
										bottom={8}
										left={0}
										right={0}
									>
										{slides.map((s, i) => (
											<UnstyledButton
												key={s.id}
												aria-label={`Go to slide ${i + 1}`}
												onClick={() => setActiveIndex(i)}
												style={{
													width: 8,
													height: 8,
													borderRadius: "50%",
													backgroundColor:
														i === activeIndex
															? "white"
															: "rgba(255, 255, 255, 0.5)",
												}}
											/>
										))}
									</Group>
								</>
							)}
						</Box>

						{slides.length > 0 && (
							<Stack gap="xs">
								<Text size="sm" fw={500}>
									Slides ({slides.length}) — drag the arrows to reorder
								</Text>
								{slides.map((slide, index) => (
									<Group key={slide.id} wrap="nowrap">
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
											src={slide.mediaUrl}
											w={72}
											h={48}
											fit="cover"
											radius="sm"
										/>
										<TextInput
											placeholder="Caption (optional)"
											style={{ flex: 1 }}
											value={slide.caption}
											onChange={(e) =>
												updateCaption(index, e.currentTarget.value)
											}
										/>
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
								))}
							</Stack>
						)}

						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPTED_IMAGE_TYPES}
							multiple
							hidden
							onChange={(e) => handleFilesSelected(e.currentTarget.files)}
						/>
						<Button
							type="button"
							fullWidth
							variant="default"
							leftSection={<IconPlus size={16} />}
							loading={uploadMutation.isPending}
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
							<Text fw={600}>Block details</Text>
							<TextInput
								label="Block name (internal only)"
								{...register("name")}
								error={errors.name?.message}
							/>
							<Textarea
								label="Headline (shown over slides)"
								autosize
								minRows={2}
								{...register("headline")}
							/>
							<TextInput
								label="Button label (optional)"
								{...register("buttonLabel")}
							/>
							{hasButtonLabel && (
								<TextInput
									label="Button destination"
									description="Leave blank for no destination"
									placeholder="products"
									leftSection="/"
									{...register("buttonDestination")}
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

					<Card withBorder>
						<Stack gap="md">
							<Text fw={600}>Visibility</Text>
							<Controller
								name="status"
								control={control}
								render={({ field }) => (
									<Group gap="sm">
										<Switch
											checked={field.value === "published"}
											onChange={(e) =>
												field.onChange(
													e.currentTarget.checked ? "published" : "draft",
												)
											}
										/>
										<Text
											size="sm"
											c={field.value === "published" ? undefined : "dimmed"}
										>
											{field.value === "published"
												? "Visible on website"
												: "Hidden — saved as draft"}
										</Text>
									</Group>
								)}
							/>
						</Stack>
					</Card>

					<Group justify="flex-end">
						<Button type="button" variant="default" onClick={onCancel}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSubmit(onSubmit)}>
							Save changes
						</Button>
					</Group>
				</Stack>
			</Grid.Col>
		</Grid>
	);
}

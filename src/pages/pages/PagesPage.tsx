import {
	Alert,
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Container,
	Skeleton,
	Stack,
	Tabs,
	Text,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { getApiErrorMessage } from "@/api/client";
import type { PageFilePart, PageStatus } from "@/api/pages";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePermissions } from "@/hooks/usePermissions";
import { AssemblyManualsEditor } from "./AssemblyManualsEditor";
import { ContractProjectsEditor } from "./ContractProjectsEditor";
import { CraftmanshipSectionEditor } from "./CraftmanshipSectionEditor";
import type { CraftmanshipSectionFormData } from "./craftmanshipSectionSchema";
import { DesignedForLifeEditor } from "./DesignedForLifeEditor";
import type { DesignedForLifeFormData } from "./designedForLifeSchema";
import { HeroSectionEditor } from "./HeroSectionEditor";
import type { HeroSectionFormData } from "./heroSectionSchema";
import { LandingSectionsList } from "./LandingSectionsList";
import type {
	AssemblyManual,
	ContractProject,
	CraftmanshipSection,
	DesignedForLifeSection,
	HeroSection,
	LandingSectionKey,
	QnaItem,
	SignatureCollectionSection,
} from "./landingTypes";
import { DEFAULT_LANDING_SECTIONS } from "./landingTypes";
import {
	COLLECTION_SECTION,
	LANDING_SECTION_KEYS,
	PAGE_NAME,
} from "./pagesApiMap";
import {
	craftmanshipFromRow,
	craftmanshipToPayload,
	designedForLifeFromRow,
	designedForLifeToPayload,
	heroFromRow,
	heroToPayload,
	itemsFromRow,
	signatureFromRow,
	signatureToPayload,
} from "./pagesMapper";
import { PAGE_SECTIONS, type PageSection } from "./pagesSections";
import { QnaSectionEditor } from "./QnaSectionEditor";
import { SignatureSectionEditor } from "./SignatureSectionEditor";
import type { SignatureSectionFormData } from "./signatureSectionSchema";
import { usePagesApi } from "./usePagesApi";

export function PagesPage() {
	usePageTitle("Pages");
	const navigate = useNavigate();
	const { can } = usePermissions();

	const canRead = can("page.read");
	// Setiap section pada dasarnya "upsert" (row bisa belum ada) — perlu KEDUA
	// izin supaya tidak ada tombol yang pasti gagal 403 tergantung apakah row
	// sudah ada atau belum.
	const canEdit = can("page.create") && can("page.update");

	const { section: sectionParam, sectionKey } = useParams();

	const section: PageSection = PAGE_SECTIONS.some(
		(s) => s.value === sectionParam,
	)
		? (sectionParam as PageSection)
		: "landing";

	// Editor hanya berlaku di tab landing.
	const editingKey: LandingSectionKey | null =
		section === "landing" && sectionKey
			? (sectionKey as LandingSectionKey)
			: null;
	const isEditingSection = editingKey !== null;

	const {
		rows,
		isLoading,
		isError,
		error,
		refetch,
		saveMutation,
		toggleStatusMutation,
	} = usePagesApi({ enabled: canRead });

	const findRow = (page: string, sectionName: string) =>
		rows.find((r) => r.page === page && r.section === sectionName);

	// ------ Turunkan sections landing dari row API (fallback ke default kosong) ------
	const sections = useMemo(() => {
		return LANDING_SECTION_KEYS.map((key) => {
			// biome-ignore lint/style/noNonNullAssertion: LANDING_SECTION_KEYS selalu punya pasangan di DEFAULT_LANDING_SECTIONS.
			const base = DEFAULT_LANDING_SECTIONS.find((s) => s.key === key)!;
			const row = rows.find(
				(r) => r.page === PAGE_NAME.landing && r.section === key,
			);
			if (!row) return base;
			switch (base.kind) {
				case "hero":
					return heroFromRow(row, base as HeroSection);
				case "signature":
					return signatureFromRow(row, base as SignatureCollectionSection);
				case "craftmanship":
					return craftmanshipFromRow(row, base as CraftmanshipSection);
				case "productGrid":
					return designedForLifeFromRow(row, base as DesignedForLifeSection);
				default:
					return base;
			}
		});
	}, [rows]);

	const faqRow = findRow(PAGE_NAME.faq, COLLECTION_SECTION.faq);
	const faqItems = itemsFromRow<QnaItem>(faqRow, COLLECTION_SECTION.faq);
	const returnsRow = findRow(PAGE_NAME.returns, COLLECTION_SECTION.returns);
	const returnsItems = itemsFromRow<QnaItem>(
		returnsRow,
		COLLECTION_SECTION.returns,
	);
	const shippingRow = findRow(PAGE_NAME.shipping, COLLECTION_SECTION.shipping);
	const shippingItems = itemsFromRow<QnaItem>(
		shippingRow,
		COLLECTION_SECTION.shipping,
	);
	const careRow = findRow(PAGE_NAME.care, COLLECTION_SECTION.care);
	const careItems = itemsFromRow<QnaItem>(careRow, COLLECTION_SECTION.care);
	const assemblyRow = findRow(PAGE_NAME.assembly, COLLECTION_SECTION.assembly);
	const manuals = itemsFromRow<AssemblyManual>(
		assemblyRow,
		COLLECTION_SECTION.assembly,
	);
	const contractRow = findRow(PAGE_NAME.contract, COLLECTION_SECTION.contract);
	const projects = itemsFromRow<ContractProject>(
		contractRow,
		COLLECTION_SECTION.contract,
	);

	const counts: Record<PageSection, number> = useMemo(
		() => ({
			landing: sections.length,
			faq: faqItems.length,
			returns: returnsItems.length,
			shipping: shippingItems.length,
			care: careItems.length,
			assembly: manuals.length,
			contract: projects.length,
		}),
		[
			sections.length,
			faqItems.length,
			returnsItems.length,
			shippingItems.length,
			careItems.length,
			manuals.length,
			projects.length,
		],
	);

	const editingSection = sections.find((s) => s.key === editingKey) ?? null;

	useEffect(() => {
		// URL menunjuk tab tidak dikenal, atau section yang tidak ada -> betulkan URL.
		if (sectionParam && sectionParam !== section) {
			navigate(`/pages/${section}`, { replace: true });
		} else if (editingKey && !editingSection) {
			navigate("/pages/landing", { replace: true });
		}
	}, [sectionParam, section, editingKey, editingSection, navigate]);

	const subtitle =
		isEditingSection && editingSection
			? `Edit the ${editingSection.label} section`
			: (PAGE_SECTIONS.find((s) => s.value === section)?.subtitle ?? "");

	// ------ Handler section landing ------

	const closeEditor = () => navigate("/pages/landing");

	const handleEditSection = (key: LandingSectionKey) =>
		navigate(`/pages/landing/${key}`);

	const handleTogglePublish = (key: LandingSectionKey) => {
		const target = sections.find((s) => s.key === key);
		const row = findRow(PAGE_NAME.landing, key);
		if (!target) return;
		if (!row) {
			notify.info("Simpan section ini dulu sebelum dipublish");
			return;
		}
		const nextStatus: PageStatus =
			target.status === "published" ? "draft" : "published";
		// Hanya kirim `status` — TIDAK ikut `data`, supaya tidak ada risiko
		// menimpa isi (gotcha #8).
		toggleStatusMutation.mutate(
			{ id: row.id, status: nextStatus },
			{
				onSuccess: () =>
					notify.success(
						nextStatus === "published"
							? "Section published"
							: "Section unpublished",
					),
				onError: (err) => notify.error(getApiErrorMessage(err)),
			},
		);
	};

	const saveLandingSection = (
		key: LandingSectionKey,
		data: unknown,
		files: PageFilePart[],
	) => {
		const row = findRow(PAGE_NAME.landing, key);
		saveMutation.mutate(
			{
				existingId: row?.id,
				page: PAGE_NAME.landing,
				section: key,
				status: row?.status ?? "draft",
				data,
				files,
			},
			{
				onSuccess: () => {
					notify.success("Section updated");
					closeEditor();
				},
				onError: (err) => notify.error(getApiErrorMessage(err)),
			},
		);
	};

	const handleSaveHero = (
		data: HeroSectionFormData,
		imageFile: File | null,
	) => {
		if (!editingKey) return;
		const { data: payloadData, files } = heroToPayload({
			subtitle: data.subtitle,
			title: data.title,
			ctaText: data.ctaText,
			ctaLink: data.ctaLink,
			image: { url: data.imageUrl, alt: data.imageAlt, file: imageFile },
		});
		saveLandingSection(editingKey, payloadData, files);
	};

	const handleSaveSignature = (
		data: SignatureSectionFormData,
		imageFile: File | null,
	) => {
		if (!editingKey) return;
		const { data: payloadData, files } = signatureToPayload({
			title: data.title,
			image: { url: data.imageUrl, alt: data.imageAlt, file: imageFile },
		});
		saveLandingSection(editingKey, payloadData, files);
	};

	const handleSaveCraftmanship = (
		data: CraftmanshipSectionFormData,
		slideFiles: Record<string, File | null>,
	) => {
		if (!editingKey) return;
		const { data: payloadData, files } = craftmanshipToPayload({
			eyebrow: data.eyebrow,
			ctaText: data.ctaText,
			ctaLink: data.ctaLink,
			slideDurationSec: data.slideDurationSec,
			slides: data.slides.map((slide) => ({
				id: slide.id,
				image: {
					url: slide.imageUrl,
					alt: slide.imageAlt,
					file: slideFiles[slide.id] ?? null,
				},
				caption: slide.caption,
				title: slide.title,
				description: slide.description,
			})),
		});
		saveLandingSection(editingKey, payloadData, files);
	};

	const handleSaveDesignedForLife = (data: DesignedForLifeFormData) => {
		if (!editingKey) return;
		const { data: payloadData, files } = designedForLifeToPayload({
			productIds: data.productIds,
		});
		saveLandingSection(editingKey, payloadData, files);
	};

	// ------ Handler tab koleksi (FAQ/Returns/Shipping/Care/Assembly/Contract) ------
	// Tambah/edit/hapus/reorder semuanya jadi satu PATCH dengan array penuh —
	// endpoint tidak punya DELETE (gotcha #10).

	const saveCollection = (
		pageName: string,
		sectionName: string,
		data: unknown,
	) => {
		const row = findRow(pageName, sectionName);
		saveMutation.mutate(
			{
				existingId: row?.id,
				page: pageName,
				section: sectionName,
				status: "published",
				data,
				files: [],
			},
			{
				onSuccess: () => notify.success("Section updated"),
				onError: (err) => notify.error(getApiErrorMessage(err)),
			},
		);
	};

	// ------ Render isi tab ------

	const renderEditor = () => {
		if (!editingSection) return null;
		const isSaving = saveMutation.isPending;
		// `key` memaksa remount saat pindah antar section (mis. mainHero ->
		// bottomHero, sama-sama kind "hero") supaya defaultValues useForm dan
		// file lokal yang ditahan tidak "nyangkut" dari section sebelumnya.
		switch (editingSection.kind) {
			case "hero":
				return (
					<HeroSectionEditor
						key={editingSection.key}
						section={editingSection}
						onSave={handleSaveHero}
						onCancel={closeEditor}
						isSaving={isSaving}
						canSave={canEdit}
					/>
				);
			case "signature":
				return (
					<SignatureSectionEditor
						key={editingSection.key}
						section={editingSection}
						onSave={handleSaveSignature}
						onCancel={closeEditor}
						isSaving={isSaving}
						canSave={canEdit}
					/>
				);
			case "craftmanship":
				return (
					<CraftmanshipSectionEditor
						key={editingSection.key}
						section={editingSection}
						onSave={handleSaveCraftmanship}
						onCancel={closeEditor}
						isSaving={isSaving}
						canSave={canEdit}
					/>
				);
			case "productGrid":
				return (
					<DesignedForLifeEditor
						key={editingSection.key}
						section={editingSection}
						onSave={handleSaveDesignedForLife}
						onCancel={closeEditor}
						isSaving={isSaving}
						canSave={canEdit}
					/>
				);
		}
	};

	const renderSection = () => {
		const collectionDisabled = saveMutation.isPending || !canEdit;
		switch (section) {
			case "landing":
				return (
					<LandingSectionsList
						sections={sections}
						onEdit={handleEditSection}
						onTogglePublish={handleTogglePublish}
						canEdit={canEdit}
						isToggling={toggleStatusMutation.isPending}
					/>
				);
			case "faq":
				return (
					<QnaSectionEditor
						items={faqItems}
						onChange={(nextItems) =>
							saveCollection(PAGE_NAME.faq, COLLECTION_SECTION.faq, {
								items: nextItems,
							})
						}
						withCategory
						description="Manage the questions and answers shown on the FAQ page."
						disabled={collectionDisabled}
					/>
				);
			case "returns":
				return (
					<QnaSectionEditor
						items={returnsItems}
						onChange={(nextItems) =>
							saveCollection(PAGE_NAME.returns, COLLECTION_SECTION.returns, {
								items: nextItems,
							})
						}
						description="Manage the questions and answers shown on the returns page."
						disabled={collectionDisabled}
					/>
				);
			case "shipping":
				return (
					<QnaSectionEditor
						items={shippingItems}
						onChange={(nextItems) =>
							saveCollection(PAGE_NAME.shipping, COLLECTION_SECTION.shipping, {
								items: nextItems,
							})
						}
						description="Manage the questions and answers shown on the shipping page."
						disabled={collectionDisabled}
					/>
				);
			case "care":
				return (
					<QnaSectionEditor
						items={careItems}
						onChange={(nextItems) =>
							saveCollection(PAGE_NAME.care, COLLECTION_SECTION.care, {
								items: nextItems,
							})
						}
						description="Manage the care and maintenance guidance shown on the storefront."
						disabled={collectionDisabled}
					/>
				);
			case "assembly":
				return (
					<AssemblyManualsEditor
						manuals={manuals}
						onChange={(nextManuals) =>
							saveCollection(PAGE_NAME.assembly, COLLECTION_SECTION.assembly, {
								manuals: nextManuals,
							})
						}
						disabled={collectionDisabled}
					/>
				);
			case "contract":
				return (
					<ContractProjectsEditor
						projects={projects}
						onChange={(nextProjects) =>
							saveCollection(PAGE_NAME.contract, COLLECTION_SECTION.contract, {
								projects: nextProjects,
							})
						}
						disabled={collectionDisabled}
					/>
				);
			default:
				return null;
		}
	};

	if (!canRead) {
		return (
			<Container size="xl">
				<PageHeader title="Pages" />
				<Alert icon={<IconAlertCircle size={16} />} color="red">
					Anda tidak punya akses ke halaman ini.
				</Alert>
			</Container>
		);
	}

	return (
		<Container size="xl">
			<Breadcrumbs mb="xs" separator="›">
				<Anchor size="sm" c="dimmed" onClick={() => navigate("/pages")}>
					Pages
				</Anchor>
				{isEditingSection && editingSection ? (
					<>
						<Anchor
							size="sm"
							c="dimmed"
							onClick={() => navigate("/pages/landing")}
						>
							Landing Page
						</Anchor>
						<Text size="sm" c="dimmed">
							{editingSection.label}
						</Text>
					</>
				) : (
					<Text size="sm" c="dimmed">
						{PAGE_SECTIONS.find((s) => s.value === section)?.label ??
							"All Pages"}
					</Text>
				)}
			</Breadcrumbs>

			<PageHeader
				title="Pages"
				subtitle={subtitle}
				actions={
					isEditingSection ? (
						<Button variant="default" onClick={closeEditor}>
							← Back to all sections
						</Button>
					) : undefined
				}
			/>

			{isError && (
				<Alert
					icon={<IconAlertCircle size={16} />}
					color="red"
					mb="md"
					title="Failed to load pages"
				>
					<Stack gap="xs" align="flex-start">
						<Text size="sm">{getApiErrorMessage(error)}</Text>
						<Button size="xs" variant="light" onClick={() => refetch()}>
							Retry
						</Button>
					</Stack>
				</Alert>
			)}

			{isLoading ? (
				<Stack gap="md">
					<Skeleton h={36} radius="sm" />
					<Skeleton h={160} radius="sm" />
					<Skeleton h={160} radius="sm" />
				</Stack>
			) : (
				<>
					{!isEditingSection && (
						<Tabs
							value={section}
							onChange={(v) => navigate(`/pages/${v ?? "landing"}`)}
							mb="md"
						>
							<Tabs.List>
								{PAGE_SECTIONS.map((s) => (
									<Tabs.Tab
										key={s.value}
										value={s.value}
										rightSection={
											<Badge size="sm" variant="light">
												{counts[s.value]}
											</Badge>
										}
									>
										{s.label}
									</Tabs.Tab>
								))}
							</Tabs.List>
						</Tabs>
					)}

					{isEditingSection && editingSection
						? renderEditor()
						: renderSection()}
				</>
			)}
		</Container>
	);
}

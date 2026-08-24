import {
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Container,
	Tabs,
	Text,
} from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import {
	dummyAssemblyManuals,
	dummyCareItems,
	dummyContractProjects,
	dummyFaqItems,
	dummyLandingSections,
	dummyReturnsItems,
	dummyShippingItems,
	type LandingSectionKey,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AssemblyManualsEditor } from "./AssemblyManualsEditor";
import { ContractProjectsEditor } from "./ContractProjectsEditor";
import { CraftmanshipSectionEditor } from "./CraftmanshipSectionEditor";
import type { CraftmanshipSectionFormData } from "./craftmanshipSectionSchema";
import { DesignedForLifeEditor } from "./DesignedForLifeEditor";
import type { DesignedForLifeFormData } from "./designedForLifeSchema";
import { HeroSectionEditor } from "./HeroSectionEditor";
import type { HeroSectionFormData } from "./heroSectionSchema";
import { LandingSectionsList } from "./LandingSectionsList";
import { PAGE_SECTIONS, type PageSection } from "./pagesSections";
import { QnaSectionEditor } from "./QnaSectionEditor";
import { SignatureSectionEditor } from "./SignatureSectionEditor";
import type { SignatureSectionFormData } from "./signatureSectionSchema";

export function PagesPage() {
	usePageTitle("Pages");
	const navigate = useNavigate();

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

	const [sections, setSections] = useState(dummyLandingSections);
	const [faqItems, setFaqItems] = useState(dummyFaqItems);
	const [returnsItems, setReturnsItems] = useState(dummyReturnsItems);
	const [shippingItems, setShippingItems] = useState(dummyShippingItems);
	const [careItems, setCareItems] = useState(dummyCareItems);
	const [manuals, setManuals] = useState(dummyAssemblyManuals);
	const [projects, setProjects] = useState(dummyContractProjects);

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
		if (!target) return;
		const nextStatus: "published" | "draft" =
			target.status === "published" ? "draft" : "published";
		setSections((prev) =>
			prev.map((s) => (s.key === key ? { ...s, status: nextStatus } : s)),
		);
		notify.success(
			nextStatus === "published" ? "Section published" : "Section unpublished",
		);
	};

	const handleSaveHero = (data: HeroSectionFormData) => {
		setSections((prev) =>
			prev.map((s) =>
				s.key === editingKey && s.kind === "hero"
					? {
							...s,
							subtitle: data.subtitle,
							title: data.title,
							ctaText: data.ctaText,
							ctaLink: data.ctaLink,
							image: { url: data.imageUrl, alt: data.imageAlt },
						}
					: s,
			),
		);
		notify.success("Section updated");
		closeEditor();
	};

	const handleSaveSignature = (data: SignatureSectionFormData) => {
		setSections((prev) =>
			prev.map((s) =>
				s.key === editingKey && s.kind === "signature"
					? {
							...s,
							title: data.title,
							image: { url: data.imageUrl, alt: data.imageAlt },
						}
					: s,
			),
		);
		notify.success("Section updated");
		closeEditor();
	};

	const handleSaveCraftmanship = (data: CraftmanshipSectionFormData) => {
		setSections((prev) =>
			prev.map((s) =>
				s.key === editingKey && s.kind === "craftmanship"
					? {
							...s,
							ctaText: data.ctaText,
							ctaLink: data.ctaLink,
							slideDurationSec: data.slideDurationSec,
							slides: data.slides.map((slide) => ({
								id: slide.id,
								image: { url: slide.imageUrl, alt: slide.imageAlt },
								caption: slide.caption,
								title: slide.title,
								description: slide.description,
							})),
						}
					: s,
			),
		);
		notify.success("Section updated");
		closeEditor();
	};

	const handleSaveDesignedForLife = (data: DesignedForLifeFormData) => {
		setSections((prev) =>
			prev.map((s) =>
				s.key === editingKey && s.kind === "productGrid"
					? { ...s, productIds: data.productIds }
					: s,
			),
		);
		notify.success("Section updated");
		closeEditor();
	};

	const renderEditor = () => {
		if (!editingSection) return null;
		switch (editingSection.kind) {
			case "hero":
				return (
					<HeroSectionEditor
						section={editingSection}
						onSave={handleSaveHero}
						onCancel={closeEditor}
					/>
				);
			case "signature":
				return (
					<SignatureSectionEditor
						section={editingSection}
						onSave={handleSaveSignature}
						onCancel={closeEditor}
					/>
				);
			case "craftmanship":
				return (
					<CraftmanshipSectionEditor
						section={editingSection}
						onSave={handleSaveCraftmanship}
						onCancel={closeEditor}
					/>
				);
			case "productGrid":
				return (
					<DesignedForLifeEditor
						section={editingSection}
						onSave={handleSaveDesignedForLife}
						onCancel={closeEditor}
					/>
				);
		}
	};

	// ------ Render isi tab ------

	const renderSection = () => {
		switch (section) {
			case "landing":
				return (
					<LandingSectionsList
						sections={sections}
						onEdit={handleEditSection}
						onTogglePublish={handleTogglePublish}
					/>
				);
			case "faq":
				return (
					<QnaSectionEditor
						items={faqItems}
						onChange={setFaqItems}
						withCategory
						description="Manage the questions and answers shown on the FAQ page."
					/>
				);
			case "returns":
				return (
					<QnaSectionEditor
						items={returnsItems}
						onChange={setReturnsItems}
						description="Manage the questions and answers shown on the returns page."
					/>
				);
			case "shipping":
				return (
					<QnaSectionEditor
						items={shippingItems}
						onChange={setShippingItems}
						description="Manage the questions and answers shown on the shipping page."
					/>
				);
			case "care":
				return (
					<QnaSectionEditor
						items={careItems}
						onChange={setCareItems}
						description="Manage the care and maintenance guidance shown on the storefront."
					/>
				);
			case "assembly":
				return (
					<AssemblyManualsEditor manuals={manuals} onChange={setManuals} />
				);
			case "contract":
				return (
					<ContractProjectsEditor projects={projects} onChange={setProjects} />
				);
			default:
				return null;
		}
	};

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

			{isEditingSection && editingSection ? renderEditor() : renderSection()}
		</Container>
	);
}

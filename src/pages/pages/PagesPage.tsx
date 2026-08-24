import {
	Anchor,
	Badge,
	Breadcrumbs,
	Button,
	Container,
	Tabs,
	Text,
} from "@mantine/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { notify } from "@/components/notify";
import { PageHeader } from "@/components/PageHeader";
import {
	dummyAssemblyManuals,
	dummyCareItems,
	dummyContractProjects,
	dummyFaqItems,
	dummyLandingBlocks,
	dummyReturnsItems,
	dummyShippingItems,
} from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AssemblyManualsEditor } from "./AssemblyManualsEditor";
import { ContractProjectsEditor } from "./ContractProjectsEditor";
import { LandingBlockEditor } from "./LandingBlockEditor";
import { LandingBlocksList } from "./LandingBlocksList";
import type { LandingBlockFormData } from "./landingBlockSchema";
import { PAGE_SECTIONS, type PageSection } from "./pagesSections";
import { QnaSectionEditor } from "./QnaSectionEditor";

export function PagesPage() {
	usePageTitle("Pages");
	const navigate = useNavigate();

	const [section, setSection] = useState<PageSection>("landing");
	const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
	const isEditingBlock = editingBlockId !== null;

	const [blocks, setBlocks] = useState(dummyLandingBlocks);
	const [faqItems, setFaqItems] = useState(dummyFaqItems);
	const [returnsItems, setReturnsItems] = useState(dummyReturnsItems);
	const [shippingItems, setShippingItems] = useState(dummyShippingItems);
	const [careItems, setCareItems] = useState(dummyCareItems);
	const [manuals, setManuals] = useState(dummyAssemblyManuals);
	const [projects, setProjects] = useState(dummyContractProjects);

	const counts: Record<PageSection, number> = useMemo(
		() => ({
			landing: blocks.length,
			faq: faqItems.length,
			returns: returnsItems.length,
			shipping: shippingItems.length,
			care: careItems.length,
			assembly: manuals.length,
			contract: projects.length,
		}),
		[
			blocks.length,
			faqItems.length,
			returnsItems.length,
			shippingItems.length,
			careItems.length,
			manuals.length,
			projects.length,
		],
	);

	const editingBlock = blocks.find((b) => b.id === editingBlockId) ?? null;

	const subtitle = isEditingBlock
		? "Edit the media and content of this landing block"
		: (PAGE_SECTIONS.find((s) => s.value === section)?.subtitle ?? "");

	// ------ Handler blok landing ------

	const handleEditBlock = (id: string) => setEditingBlockId(id);

	const handleTogglePublish = (id: string) => {
		const target = blocks.find((b) => b.id === id);
		if (!target) return;
		const nextStatus: "published" | "draft" =
			target.status === "published" ? "draft" : "published";
		setBlocks((prev) =>
			prev.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)),
		);
		notify.success(
			nextStatus === "published" ? "Block published" : "Block unpublished",
		);
	};

	const handleSaveBlock = (data: LandingBlockFormData) => {
		setBlocks((prev) =>
			prev.map((b) => (b.id === editingBlockId ? { ...b, ...data } : b)),
		);
		notify.success("Block updated");
		setEditingBlockId(null);
	};

	// ------ Render isi tab ------

	const renderSection = () => {
		switch (section) {
			case "landing":
				return (
					<LandingBlocksList
						blocks={blocks}
						onEdit={handleEditBlock}
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
				<Text size="sm" c="dimmed">
					All Pages
				</Text>
			</Breadcrumbs>

			<PageHeader
				title="Pages"
				subtitle={subtitle}
				actions={
					isEditingBlock ? (
						<Button variant="default" onClick={() => setEditingBlockId(null)}>
							← Back to all blocks
						</Button>
					) : undefined
				}
			/>

			{!isEditingBlock && (
				<Tabs
					value={section}
					onChange={(v) => setSection((v as PageSection) ?? "landing")}
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

			{isEditingBlock && editingBlock ? (
				<LandingBlockEditor
					block={editingBlock}
					onSave={handleSaveBlock}
					onCancel={() => setEditingBlockId(null)}
				/>
			) : (
				renderSection()
			)}
		</Container>
	);
}

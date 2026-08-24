import { zodResolver } from "@hookform/resolvers/zod";
import {
	ActionIcon,
	Button,
	Card,
	Group,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
	IconChevronDown,
	IconChevronUp,
	IconSearch,
	IconTrash,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/api/client";
import { getProduct, listProducts } from "@/api/products";
import { notify } from "@/components/notify";
import type { DesignedForLifeSection } from "@/data/dummy";
import {
	DESIGNED_FOR_LIFE_PRODUCT_COUNT,
	type DesignedForLifeFormData,
	designedForLifeSchema,
} from "./designedForLifeSchema";

/** Label produk yang sudah dipilih — form hanya menyimpan id-nya. */
type ProductLabel = { name: string; baseSku: string };

interface DesignedForLifeEditorProps {
	section: DesignedForLifeSection;
	onSave: (data: DesignedForLifeFormData) => void;
	onCancel: () => void;
}

export function DesignedForLifeEditor({
	section,
	onSave,
	onCancel,
}: DesignedForLifeEditorProps) {
	const {
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<DesignedForLifeFormData>({
		resolver: zodResolver(designedForLifeSchema),
		defaultValues: { productIds: section.productIds },
	});

	const productIds = watch("productIds");
	const [labels, setLabels] = useState<Record<string, ProductLabel>>({});

	// Hydrate label produk yang sudah terpilih dari session sebelumnya (endpoint
	// list tidak dipanggil ulang, jadi ambil detail satu-satu seperti getProduct
	// dipakai di CollectionEditor.tsx).
	// biome-ignore lint/correctness/useExhaustiveDependencies: sengaja hanya jalan sekali saat mount untuk hydrate label productIds awal, bukan tiap kali labels berubah.
	useEffect(() => {
		const missing = section.productIds.filter((id) => !(id in labels));
		if (missing.length === 0) return;
		Promise.all(missing.map((id) => getProduct(id)))
			.then((products) => {
				setLabels((prev) => {
					const next = { ...prev };
					for (const p of products) {
						next[p.id] = { name: p.name, baseSku: p.baseSku };
					}
					return next;
				});
			})
			.catch((err) => notify.error(getApiErrorMessage(err)));
	}, []);

	const isFull = productIds.length >= DESIGNED_FOR_LIFE_PRODUCT_COUNT;

	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebouncedValue(search, 300);

	const searchQuery = useQuery({
		queryKey: ["products", { search: debouncedSearch, forPicker: true }],
		queryFn: () => listProducts({ search: debouncedSearch, limit: 10 }),
		enabled: !isFull && debouncedSearch.trim().length > 0,
	});
	const suggestions = (searchQuery.data?.data ?? []).filter(
		(p) => !productIds.includes(p.id),
	);

	const addProduct = (id: string, label: ProductLabel) => {
		if (productIds.length >= DESIGNED_FOR_LIFE_PRODUCT_COUNT) return;
		setValue("productIds", [...productIds, id], {
			shouldDirty: true,
			shouldValidate: true,
		});
		setLabels((prev) => ({ ...prev, [id]: label }));
		setSearch("");
	};

	const removeProduct = (id: string) => {
		setValue(
			"productIds",
			productIds.filter((pid) => pid !== id),
			{ shouldDirty: true, shouldValidate: true },
		);
	};

	const moveProduct = (index: number, direction: -1 | 1) => {
		const target = index + direction;
		if (target < 0 || target >= productIds.length) return;
		const next = [...productIds];
		[next[index], next[target]] = [next[target], next[index]];
		setValue("productIds", next, { shouldDirty: true });
	};

	return (
		<>
			<Card withBorder mb="lg">
				<Stack gap="md">
					<Text fw={600}>
						Selected products ({productIds.length}/
						{DESIGNED_FOR_LIFE_PRODUCT_COUNT})
					</Text>

					{errors.productIds?.message && (
						<Text size="xs" c="red">
							{errors.productIds.message}
						</Text>
					)}

					{productIds.length === 0 && (
						<Text size="sm" c="dimmed">
							No products selected yet.
						</Text>
					)}

					<Stack gap="xs">
						{productIds.map((id, index) => {
							const label = labels[id];
							return (
								<Group key={id} justify="space-between" wrap="nowrap">
									<Group gap="sm" wrap="nowrap">
										<Stack gap={2}>
											<ActionIcon
												type="button"
												size="sm"
												variant="subtle"
												color="gray"
												disabled={index === 0}
												aria-label="Move up"
												onClick={() => moveProduct(index, -1)}
											>
												<IconChevronUp size={14} />
											</ActionIcon>
											<ActionIcon
												type="button"
												size="sm"
												variant="subtle"
												color="gray"
												disabled={index === productIds.length - 1}
												aria-label="Move down"
												onClick={() => moveProduct(index, 1)}
											>
												<IconChevronDown size={14} />
											</ActionIcon>
										</Stack>
										<Stack gap={0}>
											<Text size="sm">{label?.name ?? id}</Text>
											{label && (
												<Text size="xs" c="dimmed">
													{label.baseSku}
												</Text>
											)}
										</Stack>
									</Group>
									<ActionIcon
										type="button"
										variant="subtle"
										color="red"
										aria-label="Remove product"
										onClick={() => removeProduct(id)}
									>
										<IconTrash size={16} />
									</ActionIcon>
								</Group>
							);
						})}
					</Stack>
				</Stack>
			</Card>

			<Card withBorder>
				<Stack gap="md">
					<Text fw={600}>Add product</Text>
					{isFull ? (
						<Text size="sm" c="dimmed">
							Remove a product first to add another.
						</Text>
					) : (
						<div style={{ position: "relative" }}>
							<TextInput
								placeholder="Search products..."
								leftSection={<IconSearch size={16} />}
								value={search}
								onChange={(e) => setSearch(e.currentTarget.value)}
							/>
							{suggestions.length > 0 && (
								<Card
									withBorder
									p="xs"
									style={{
										position: "absolute",
										zIndex: 10,
										width: "100%",
										marginTop: 4,
										maxHeight: 240,
										overflowY: "auto",
									}}
								>
									<Stack gap={4}>
										{suggestions.map((p) => (
											<Button
												key={p.id}
												type="button"
												variant="subtle"
												justify="flex-start"
												fullWidth
												onClick={() =>
													addProduct(p.id, { name: p.name, baseSku: p.baseSku })
												}
											>
												{p.name} ({p.baseSku})
											</Button>
										))}
									</Stack>
								</Card>
							)}
						</div>
					)}
				</Stack>
			</Card>

			<Group justify="flex-end" mt="lg">
				<Button type="button" variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					type="button"
					disabled={productIds.length !== DESIGNED_FOR_LIFE_PRODUCT_COUNT}
					onClick={handleSubmit(onSave)}
				>
					Save changes
				</Button>
			</Group>
		</>
	);
}

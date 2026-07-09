import { Container } from "@mantine/core";
import { useParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { dummyCollections } from "@/data/dummy";
import { usePageTitle } from "@/hooks/usePageTitle";

export function CollectionDetail() {
	const { id } = useParams();
	const collection = dummyCollections.find((c) => c.id === Number(id));
	usePageTitle(collection ? collection.name : "Collection");

	return (
		<Container size="xl">
			<PageHeader
				title={collection ? collection.name : "Collection not found"}
				subtitle="Collection details"
			/>
			{/* TODO: tampilkan detail collection + daftar produk di dalamnya */}
		</Container>
	);
}

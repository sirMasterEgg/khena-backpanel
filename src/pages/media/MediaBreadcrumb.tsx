import { Anchor, Breadcrumbs, Text } from "@mantine/core";

interface MediaBreadcrumbProps {
	/** Path folder aktif, mis. "/produk/sofa". "/" = root. */
	currentPath: string;
	onNavigate: (path: string) => void;
}

/**
 * Satu-satunya cara naik level setelah panel CATEGORIES dihapus.
 * Segmen terakhir = folder aktif, ditampilkan sebagai teks biasa.
 */
export function MediaBreadcrumb({
	currentPath,
	onNavigate,
}: MediaBreadcrumbProps) {
	const segments = currentPath.split("/").filter(Boolean);

	// Tiap segmen membawa path kumulatifnya sendiri supaya bisa langsung diklik.
	const items = segments.map((label, index) => ({
		label,
		path: `/${segments.slice(0, index + 1).join("/")}`,
	}));

	return (
		<Breadcrumbs mb="md">
			{segments.length === 0 ? (
				<Text size="sm" fw={500}>
					Media Library
				</Text>
			) : (
				<Anchor size="sm" onClick={() => onNavigate("/")}>
					Media Library
				</Anchor>
			)}
			{items.map((item, index) =>
				index === items.length - 1 ? (
					<Text key={item.path} size="sm" fw={500}>
						{item.label}
					</Text>
				) : (
					<Anchor
						key={item.path}
						size="sm"
						onClick={() => onNavigate(item.path)}
					>
						{item.label}
					</Anchor>
				),
			)}
		</Breadcrumbs>
	);
}

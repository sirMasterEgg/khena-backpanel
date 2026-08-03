import {
	Box,
	Button,
	Card,
	Group,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { IconCloudUpload, IconDownload } from "@tabler/icons-react";
import { useState } from "react";

interface BulkUpdateCardProps {
	onOpenImport: () => void;
	onDownloadTemplate: () => void;
	downloadingTemplate: boolean;
}

export function BulkUpdateCard({
	onOpenImport,
	onDownloadTemplate,
	downloadingTemplate,
}: BulkUpdateCardProps) {
	const [dragActive, setDragActive] = useState(false);

	return (
		<Card withBorder h="100%">
			<Stack gap="md">
				<Stack gap={2}>
					<Title order={4}>Bulk update via file</Title>
					<Text size="sm" c="dimmed">
						Upload a CSV to update many products at once.
					</Text>
				</Stack>

				{/* Area unggah bergaris putus-putus. */}
				<Box
					onClick={onOpenImport}
					onDragOver={(e) => {
						e.preventDefault();
						setDragActive(true);
					}}
					onDragLeave={() => setDragActive(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragActive(false);
						onOpenImport();
					}}
					style={{
						border: "1px dashed var(--mantine-color-gray-4)",
						borderRadius: "var(--mantine-radius-md)",
						cursor: "pointer",
						padding: "var(--mantine-spacing-xl)",
						textAlign: "center",
						backgroundColor: dragActive
							? "var(--mantine-color-gray-0)"
							: undefined,
					}}
				>
					<Stack align="center" gap="xs">
						<IconCloudUpload size={36} color="var(--mantine-color-gray-5)" />
						<Text fw={500}>Click to upload a CSV</Text>
						<Text size="sm" c="dimmed">
							or drag and drop · max 10MB
						</Text>
					</Stack>
				</Box>

				{/* Kotak expected columns. */}
				<Box>
					<Text size="sm" fw={500} mb="xs">
						Expected columns
					</Text>
					<Table withTableBorder withColumnBorders>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>sku</Table.Th>
								<Table.Th>adjustment_type</Table.Th>
								<Table.Th>quantity</Table.Th>
								<Table.Th>reason</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td>CHR-001-BLK</Table.Td>
								<Table.Td>in</Table.Td>
								<Table.Td>10</Table.Td>
								<Table.Td>Stock correction</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Box>

				<Group justify="flex-start">
					<Button
						variant="default"
						leftSection={<IconDownload size={16} />}
						loading={downloadingTemplate}
						onClick={onDownloadTemplate}
					>
						Download template (Excel-compatible CSV)
					</Button>
				</Group>
			</Stack>
		</Card>
	);
}

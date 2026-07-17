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
import { useRef, useState } from "react";
import { downloadTemplateCsv } from "./stockCsv";

interface BulkUpdateCardProps {
	onFile: (file: File) => void;
}

/** Validasi tipe & ukuran file dipusatkan di StocksPage lewat onFile. */
export function BulkUpdateCard({ onFile }: BulkUpdateCardProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = useState(false);

	const handleFiles = (files: FileList | null) => {
		const file = files?.[0];
		if (file) onFile(file);
	};

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
					onClick={() => inputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDragActive(true);
					}}
					onDragLeave={() => setDragActive(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragActive(false);
						handleFiles(e.dataTransfer.files);
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
							or drag and drop · max 5MB
						</Text>
					</Stack>
					<input
						ref={inputRef}
						type="file"
						accept=".csv"
						hidden
						onChange={(e) => {
							handleFiles(e.currentTarget.files);
							e.currentTarget.value = "";
						}}
					/>
				</Box>

				{/* Kotak expected columns. */}
				<Box>
					<Text size="sm" fw={500} mb="xs">
						Expected columns
					</Text>
					<Table withTableBorder withColumnBorders>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>SKU</Table.Th>
								<Table.Th>Action</Table.Th>
								<Table.Th>Qty</Table.Th>
								<Table.Th>Reason</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							<Table.Tr>
								<Table.Td>SOFA-001</Table.Td>
								<Table.Td>in</Table.Td>
								<Table.Td>5</Table.Td>
								<Table.Td>Received shipment</Table.Td>
							</Table.Tr>
						</Table.Tbody>
					</Table>
				</Box>

				<Group justify="flex-start">
					<Button
						variant="default"
						leftSection={<IconDownload size={16} />}
						onClick={downloadTemplateCsv}
					>
						Download template (Excel-compatible CSV)
					</Button>
				</Group>
			</Stack>
		</Card>
	);
}

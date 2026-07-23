import {
	Alert,
	Button,
	FileInput,
	Group,
	Modal,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { IconFileTypeCsv } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiErrorMessage } from "@/api/client";
import {
	type ImportProductsResponse,
	importProductsCsv,
} from "@/api/products";

/** Batas ukuran file sesuai contract.md bagian 6 (POST /products/bulk). */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface ImportProductsModalProps {
	opened: boolean;
	onClose: () => void;
}

export function ImportProductsModal({
	opened,
	onClose,
}: ImportProductsModalProps) {
	const queryClient = useQueryClient();
	const [file, setFile] = useState<File | null>(null);
	// Error validasi sisi client (sebelum request terkirim).
	const [validationError, setValidationError] = useState<string | null>(null);
	// Ringkasan hasil import — modal TIDAK langsung ditutup setelah sukses
	// supaya user bisa melihat baris mana yang gagal (partial success).
	const [result, setResult] = useState<ImportProductsResponse | null>(null);

	const mutation = useMutation({
		mutationFn: importProductsCsv,
		onSuccess: (data) => {
			setResult(data);
			if (data.successCount > 0) {
				// Satu invalidate cukup untuk list DAN stats — queryKey stats juga
				// diawali "products".
				queryClient.invalidateQueries({ queryKey: ["products"] });
			}
		},
	});

	const handleFileChange = (next: File | null) => {
		setFile(next);
		setValidationError(null);
		// Hasil import lama tidak relevan lagi begitu file diganti.
		setResult(null);
		mutation.reset();
	};

	const handleUpload = () => {
		if (!file) {
			setValidationError("Pilih file CSV terlebih dahulu");
			return;
		}
		if (!file.name.toLowerCase().endsWith(".csv")) {
			setValidationError("File harus berekstensi .csv");
			return;
		}
		if (file.size > MAX_FILE_SIZE) {
			setValidationError("Ukuran file maksimum 10 MB");
			return;
		}
		setValidationError(null);
		mutation.mutate(file);
	};

	// Reset SETELAH animasi tutup selesai (pola ColorEditorModal) supaya isi
	// modal tidak berkedip ke state kosong saat masih terlihat.
	const handleExited = () => {
		setFile(null);
		setValidationError(null);
		setResult(null);
		mutation.reset();
	};

	const failedRows = result?.results.filter((r) => r.status === "failed") ?? [];

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			onExitTransitionEnd={handleExited}
			title="Import products"
			centered
		>
			<Stack gap="md">
				<FileInput
					label="File CSV"
					description="Format sama dengan hasil Export. Maksimum 10 MB."
					placeholder="Pilih file .csv"
					accept=".csv,text/csv"
					leftSection={<IconFileTypeCsv size={16} />}
					value={file}
					onChange={handleFileChange}
					clearable
					error={validationError}
				/>

				{/* Error level-file dari server (400 csv kosong/tidak valid, 422). */}
				{mutation.isError && (
					<Text size="sm" c="red">
						{getApiErrorMessage(mutation.error)}
					</Text>
				)}

				{/* Ringkasan hasil import (HTTP 200 = partial success). */}
				{result && (
					<Alert
						color={result.failedCount > 0 ? "red" : "green"}
						title={`${result.successCount} sukses, ${result.failedCount} gagal dari ${result.total} total`}
					>
						{failedRows.length > 0 && (
							<Table withRowBorders={false} verticalSpacing={4}>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Base SKU</Table.Th>
										<Table.Th>Error</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{failedRows.map((row) => (
										<Table.Tr key={row.baseSku}>
											<Table.Td>{row.baseSku}</Table.Td>
											<Table.Td>
												<Text size="sm" c="red">
													{row.error ?? "unknown error"}
												</Text>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						)}
					</Alert>
				)}

				<Group justify="flex-end" gap="sm">
					<Button variant="default" onClick={onClose}>
						{result ? "Close" : "Cancel"}
					</Button>
					<Button
						onClick={handleUpload}
						loading={mutation.isPending}
						disabled={mutation.isPending}
					>
						Upload
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

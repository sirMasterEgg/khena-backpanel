import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";

interface ShipOrderModalProps {
	opened: boolean;
	onClose: () => void;
	/** Dipanggil dengan tracking number yang sudah divalidasi (tidak kosong). */
	onConfirm: (trackingNumber: string) => void;
	loading?: boolean;
}

/**
 * Modal input nomor resi saat order pindah ke status `shipped`. Server
 * menolak transisi ini tanpa `trackingNumber` (400) — validasi di sini agar
 * pengguna tidak perlu menemukan itu lewat error server.
 */
export function ShipOrderModal({
	opened,
	onClose,
	onConfirm,
	loading,
}: ShipOrderModalProps) {
	const [trackingNumber, setTrackingNumber] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Reset form tiap kali modal dibuka ulang.
	useEffect(() => {
		if (opened) {
			setTrackingNumber("");
			setError(null);
		}
	}, [opened]);

	const handleSubmit = () => {
		const trimmed = trackingNumber.trim();
		if (!trimmed) {
			setError("Tracking number wajib diisi");
			return;
		}
		if (trimmed.length > 100) {
			setError("Maksimal 100 karakter");
			return;
		}
		onConfirm(trimmed);
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Ship order" centered>
			<Stack gap="md">
				<TextInput
					label="Tracking number"
					placeholder="e.g. JNE1234567890"
					required
					maxLength={100}
					value={trackingNumber}
					onChange={(e) => {
						setTrackingNumber(e.currentTarget.value);
						if (error) setError(null);
					}}
					error={error}
				/>
				<Group justify="flex-end" gap="sm">
					<Button
						type="button"
						variant="default"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleSubmit} loading={loading}>
						Confirm
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

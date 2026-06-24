import { Image, Modal, SimpleGrid, UnstyledButton } from "@mantine/core";
import { dummyMedia } from "@/data/dummy";

interface MediaPickerModalProps {
	opened: boolean;
	onClose: () => void;
	onSelect: (url: string) => void;
}

export function MediaPickerModal({
	opened,
	onClose,
	onSelect,
}: MediaPickerModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Media Library"
			size="lg"
			centered
		>
			<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
				{dummyMedia.map((url) => (
					<UnstyledButton
						key={url}
						onClick={() => {
							onSelect(url);
							onClose();
						}}
						style={{
							borderRadius: 8,
							overflow: "hidden",
							border: "1px solid var(--mantine-color-gray-3)",
						}}
					>
						<Image src={url} h={120} fit="cover" alt="Swatch option" />
					</UnstyledButton>
				))}
			</SimpleGrid>
		</Modal>
	);
}

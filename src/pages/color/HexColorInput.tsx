import { Box, ColorPicker, Popover, TextInput } from "@mantine/core";
import { useState } from "react";
import { HEX_PATTERN, sanitizeHexInput, withHash } from "@/api/colors";

interface HexColorInputProps {
	/** SELALU 6 karakter tanpa "#" (boleh lebih pendek selagi diketik). */
	value: string;
	onChange: (value: string) => void;
	onBlur: () => void;
	error?: string;
}

/**
 * Input hex dengan "#" sebagai prefix TETAP milik field — bukan bagian dari
 * teks, jadi tidak bisa dihapus atau ikut ter-select. User hanya mengetik 6
 * karakter hex; karakter lain tidak pernah masuk (disaring di onChange), dan
 * paste "#FF0000" otomatis diambil nilainya saja.
 *
 * Mantine <ColorInput> tidak dipakai di sini karena teks input-nya memuat
 * seluruh string warna termasuk "#", dan slot kirinya sudah terpakai swatch —
 * tidak ada cara memasang prefix tetap di sana.
 */
export function HexColorInput({
	value,
	onChange,
	onBlur,
	error,
}: HexColorInputProps) {
	const [pickerOpened, setPickerOpened] = useState(false);

	const isComplete = HEX_PATTERN.test(value);
	const cssColor = isComplete ? withHash(value) : undefined;

	return (
		<TextInput
			label="Colour"
			required
			placeholder="b23a2f"
			value={value}
			onChange={(event) =>
				onChange(sanitizeHexInput(event.currentTarget.value))
			}
			onBlur={onBlur}
			error={error}
			maxLength={6}
			leftSection="#"
			// Prefix murni dekorasi: klik harus tembus ke input, bukan menyeleksinya.
			leftSectionPointerEvents="none"
			rightSection={
				<Popover
					opened={pickerOpened}
					onChange={setPickerOpened}
					position="bottom-end"
					withinPortal
					shadow="md"
				>
					<Popover.Target>
						<Box
							role="button"
							tabIndex={0}
							aria-label="Pilih warna"
							onClick={() => setPickerOpened((o) => !o)}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									setPickerOpened((o) => !o);
								}
							}}
							style={{
								width: 20,
								height: 20,
								borderRadius: "50%",
								cursor: "pointer",
								backgroundColor: cssColor ?? "transparent",
								border: "1px solid var(--mantine-color-gray-4)",
							}}
						/>
					</Popover.Target>
					<Popover.Dropdown p="xs">
						<ColorPicker
							format="hex"
							// Picker selalu mengirim "#rrggbb"; sanitize mengembalikannya ke
							// bentuk kanonik, jadi sinkronisasi dua arah tanpa state tambahan.
							value={cssColor ?? "#ffffff"}
							onChange={(picked) => onChange(sanitizeHexInput(picked))}
						/>
					</Popover.Dropdown>
				</Popover>
			}
		/>
	);
}

/** Format ukuran file dari byte menjadi string ringkas, mis. "1.2 MB" / "840 KB". */
export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
	const mb = kb / 1024;
	return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

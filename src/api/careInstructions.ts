import { apiClient } from "@/api/client";
import type { ApiListSuccess } from "@/api/types";

/** Bentuk 1 objek CareInstruction dari API (contract.md bagian 13). */
export type CareInstruction = {
	id: string;
	instruction: string;
	createdAt: string;
	updatedAt: string;
};

/**
 * Master data instruksi perawatan — dipakai sebagai sumber opsi checkbox
 * care instructions di form product (`careInstructionIds`). Endpoint publik.
 */
export async function listCareInstructions(params?: {
	page?: number;
	limit?: number;
}) {
	const res = await apiClient.get<ApiListSuccess<CareInstruction>>(
		"/care-instructions",
		{ params },
	);
	return res.data;
}

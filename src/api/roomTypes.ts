import { apiClient } from "@/api/client";
import type { ApiListSuccess, ApiSuccess } from "@/api/types";

export type RoomType = {
	id: string;
	roomType: string;
	createdAt: string;
	updatedAt: string;
};

export async function listRoomTypes(params?: {
	page?: number;
	limit?: number;
}) {
	const res = await apiClient.get<ApiListSuccess<RoomType>>("/room-types", {
		params,
	});
	return res.data;
}

export async function createRoomType(body: { roomType: string }) {
	const res = await apiClient.post<ApiSuccess<RoomType>>("/room-types", body);
	return res.data.data;
}

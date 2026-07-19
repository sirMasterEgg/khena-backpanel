export type ApiSuccess<T> = { data: T };

export type ApiErrorBody = {
	error: {
		code: string; // "UNAUTHORIZED" | "FORBIDDEN" | "BAD_REQUEST" | "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR" | "INTERNAL_ERROR"
		message: string;
		details: unknown[] | null;
	};
};

export type PaginationMeta = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

export type ApiListSuccess<T> = { data: T[]; meta: PaginationMeta };

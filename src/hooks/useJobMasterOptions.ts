import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listDepartments } from "@/api/departments";
import { listEmploymentTypes } from "@/api/employmentTypes";

/**
 * Opsi dropdown Department & Employment Type untuk form editor Job.
 * Kedua master data ini read-only dan tidak berpaginasi.
 */
export function useJobMasterOptions() {
	const departmentQuery = useQuery({
		queryKey: ["departments"],
		queryFn: listDepartments,
	});
	const employmentTypeQuery = useQuery({
		queryKey: ["employment-types"],
		queryFn: listEmploymentTypes,
	});

	const departmentOptions = useMemo(
		() =>
			departmentQuery.data?.map((d) => ({ value: d.id, label: d.name })) ?? [],
		[departmentQuery.data],
	);

	const employmentTypeOptions = useMemo(
		() =>
			employmentTypeQuery.data?.map((e) => ({ value: e.id, label: e.name })) ??
			[],
		[employmentTypeQuery.data],
	);

	return {
		departmentOptions,
		employmentTypeOptions,
		isLoading: departmentQuery.isLoading || employmentTypeQuery.isLoading,
	};
}

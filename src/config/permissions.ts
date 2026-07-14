// Placeholder peran pengguna. Nanti diganti dengan data auth sungguhan.
export const currentUserRole: "admin" | "staff" = "admin";

/** Boleh melihat kolom harga/Total? */
export const canViewPrices = currentUserRole === "admin";

/** Boleh melakukan refund? */
export const canRefund = currentUserRole === "admin";

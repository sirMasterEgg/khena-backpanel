export type StockAction = "in" | "out"; // (+) atau (−)

export type StockReason = {
	value: string; // key unik, mis. "received_shipment"
	label: string; // teks tampil, mis. "Received shipment"
	action: StockAction; // menentukan grup "Stock in (+)" / "Stock out (−)"
};

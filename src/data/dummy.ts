export const dummyProducts = [
	{
		id: 1,
		name: "Modern Sofa Set",
		sku: "SOFA-001",
		category: "Seating",
		price: 2500,
		stock: 15,
		status: "published",
		image: "https://placehold.co/80x80?text=Sofa",
	},
	{
		id: 2,
		name: "Dining Table",
		sku: "TABLE-001",
		category: "Tables",
		price: 1200,
		stock: 3,
		status: "published",
		image: "https://placehold.co/80x80?text=Table",
	},
	{
		id: 3,
		name: "Office Chair",
		sku: "CHAIR-001",
		category: "Seating",
		price: 450,
		stock: 0,
		status: "draft",
		image: "https://placehold.co/80x80?text=Chair",
	},
	{
		id: 4,
		name: "Bookshelf",
		sku: "SHELF-001",
		category: "Storage",
		price: 320,
		stock: 8,
		status: "scheduled",
		image: "https://placehold.co/80x80?text=Shelf",
	},
];

export const dummyOrders = [
	{
		id: "ORD-001",
		customer: "John Doe",
		items: 3,
		total: 2450,
		status: "processing",
		date: "2026-06-18",
	},
	{
		id: "ORD-002",
		customer: "Jane Smith",
		items: 1,
		total: 1200,
		status: "shipped",
		date: "2026-06-17",
	},
	{
		id: "ORD-003",
		customer: "Mike Johnson",
		items: 2,
		total: 750,
		status: "pending",
		date: "2026-06-16",
	},
];

export const dummyContacts = [
	{
		id: 1,
		name: "Alice Brown",
		email: "alice@example.com",
		subject: "Product inquiry",
		message: "I'm interested in the sofa...",
		date: "2026-06-19",
		status: "unread",
	},
	{
		id: 2,
		name: "Bob Wilson",
		email: "bob@example.com",
		subject: "Support",
		message: "Order tracking issue",
		date: "2026-06-18",
		status: "read",
	},
];

export const dummyCollections = [
	{ id: 1, name: "Modern Living", count: 24 },
	{ id: 2, name: "Minimalist", count: 18 },
	{ id: 3, name: "Classic", count: 12 },
];

export const dummyCategories = [
	{ id: 1, name: "Seating", products: 45 },
	{ id: 2, name: "Tables", products: 32 },
	{ id: 3, name: "Storage", products: 28 },
	{ id: 4, name: "Lighting", products: 19 },
];

export const dummyColors = [
	{ id: 1, name: "Black", hex: "#000000" },
	{ id: 2, name: "White", hex: "#FFFFFF" },
	{ id: 3, name: "Navy", hex: "#001F3F" },
	{ id: 4, name: "Beige", hex: "#F5DEB3" },
];

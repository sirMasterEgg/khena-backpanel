export type ProductVariant = {
	id: number;
	colorFinish: string;
	sku: string;
	visibility: "visible" | "hidden";
	price: number;
	cost: number;
	discount: number;
	comparePrice: number;
	marketplacePrice: number;
	stock: number;
	images: string[];
};

export type ProductCareCategory =
	| "high-end-panels"
	| "fabric-boucle"
	| "wood-accents"
	| "stone-marble";

export type Product = {
	id: number;
	name: string;
	sku: string;
	collection: string;
	category: string;
	status: "published" | "draft" | "scheduled" | "archived";
	description?: string;
	lowStockAlert?: number;
	price: number;
	cost: number;
	stock: number;
	updatedAt: string;
	image: string;
	variants?: ProductVariant[];
	materialInfo?: string;
	careCategories?: ProductCareCategory[];
	dimension?: {
		image?: string;
		width?: number;
		depth?: number;
		height?: number;
		weight?: number;
	};
	boxDimension?: {
		image?: string;
		width?: number;
		depth?: number;
		height?: number;
		weight?: number;
	};
	media?: string[];
};

export const dummyProducts: Product[] = [
	{
		id: 1,
		name: "Modern Sofa Set",
		sku: "SOFA-001",
		collection: "Modern Living",
		category: "Seating",
		price: 2500,
		cost: 1500,
		stock: 15,
		status: "published",
		image: "https://placehold.co/80x80?text=Sofa",
		updatedAt: "2026-06-19",
		description: "Elegant modern sofa set with premium fabric upholstery",
		lowStockAlert: 3,
		variants: [
			{
				id: 1,
				colorFinish: "Black",
				sku: "SOFA-001-BLK",
				visibility: "visible",
				price: 2500,
				cost: 1500,
				discount: 10,
				comparePrice: 2778,
				marketplacePrice: 2450,
				stock: 8,
				images: ["https://placehold.co/200x200?text=Sofa+Black"],
			},
			{
				id: 2,
				colorFinish: "Beige",
				sku: "SOFA-001-BEI",
				visibility: "visible",
				price: 2500,
				cost: 1500,
				discount: 0,
				comparePrice: 2500,
				marketplacePrice: 2500,
				stock: 7,
				images: ["https://placehold.co/200x200?text=Sofa+Beige"],
			},
		],
		materialInfo: "High-quality fabric with wooden frame, stainless steel legs",
		careCategories: ["fabric-boucle"],
		media: [
			"https://placehold.co/400x400?text=Sofa+1",
			"https://placehold.co/400x400?text=Sofa+2",
		],
	},
	{
		id: 2,
		name: "Dining Table",
		sku: "TABLE-001",
		collection: "Modern Living",
		category: "Tables",
		price: 1200,
		cost: 700,
		stock: 3,
		status: "published",
		image: "https://placehold.co/80x80?text=Table",
		updatedAt: "2026-06-18",
		description: "Solid wood dining table, seats up to 8 people",
		lowStockAlert: 2,
		variants: [
			{
				id: 3,
				colorFinish: "Natural Wood",
				sku: "TABLE-001-NAT",
				visibility: "visible",
				price: 1200,
				cost: 700,
				discount: 5,
				comparePrice: 1263,
				marketplacePrice: 1180,
				stock: 3,
				images: ["https://placehold.co/200x200?text=Table+Natural"],
			},
		],
		materialInfo: "Oak wood frame with tempered glass top, wood accents",
		careCategories: ["wood-accents", "stone-marble"],
		media: ["https://placehold.co/400x400?text=Dining+Table"],
	},
	{
		id: 3,
		name: "Office Chair",
		sku: "CHAIR-001",
		collection: "Minimalist",
		category: "Seating",
		price: 450,
		cost: 250,
		stock: 0,
		status: "draft",
		image: "https://placehold.co/80x80?text=Chair",
		updatedAt: "2026-06-17",
	},
	{
		id: 4,
		name: "Bookshelf",
		sku: "SHELF-001",
		collection: "Classic",
		category: "Storage",
		price: 320,
		cost: 180,
		stock: 8,
		status: "scheduled",
		image: "https://placehold.co/80x80?text=Shelf",
		updatedAt: "2026-06-16",
	},
	{
		id: 5,
		name: "Floor Lamp",
		sku: "LAMP-001",
		collection: "Modern Living",
		category: "Lighting",
		price: 180,
		cost: 90,
		stock: 25,
		status: "published",
		image: "https://placehold.co/80x80?text=Lamp",
		updatedAt: "2026-06-19",
	},
	{
		id: 6,
		name: "Coffee Table",
		sku: "TABLE-002",
		collection: "Minimalist",
		category: "Tables",
		price: 350,
		cost: 200,
		stock: 12,
		status: "published",
		image: "https://placehold.co/80x80?text=CoffeeTable",
		updatedAt: "2026-06-15",
	},
	{
		id: 7,
		name: "Wall Cabinet",
		sku: "CABINET-001",
		collection: "Classic",
		category: "Storage",
		price: 550,
		cost: 320,
		stock: 0,
		status: "published",
		image: "https://placehold.co/80x80?text=Cabinet",
		updatedAt: "2026-06-14",
	},
	{
		id: 8,
		name: "Recliner Chair",
		sku: "RECLINER-001",
		collection: "Modern Living",
		category: "Seating",
		price: 800,
		cost: 450,
		stock: 5,
		status: "draft",
		image: "https://placehold.co/80x80?text=Recliner",
		updatedAt: "2026-06-13",
	},
	{
		id: 9,
		name: "Pendant Light",
		sku: "PENDANT-001",
		collection: "Minimalist",
		category: "Lighting",
		price: 220,
		cost: 110,
		stock: 18,
		status: "scheduled",
		image: "https://placehold.co/80x80?text=Pendant",
		updatedAt: "2026-06-12",
	},
	{
		id: 10,
		name: "Dining Chairs Set",
		sku: "CHAIRS-001",
		collection: "Classic",
		category: "Seating",
		price: 600,
		cost: 350,
		stock: 8,
		status: "published",
		image: "https://placehold.co/80x80?text=DiningChairs",
		updatedAt: "2026-06-11",
	},
	{
		id: 11,
		name: "Console Table",
		sku: "CONSOLE-001",
		collection: "Modern Living",
		category: "Tables",
		price: 420,
		cost: 240,
		stock: 0,
		status: "archived",
		image: "https://placehold.co/80x80?text=Console",
		updatedAt: "2026-06-10",
	},
	{
		id: 12,
		name: "Storage Bench",
		sku: "BENCH-001",
		collection: "Minimalist",
		category: "Storage",
		price: 480,
		cost: 270,
		stock: 3,
		status: "draft",
		image: "https://placehold.co/80x80?text=Bench",
		updatedAt: "2026-06-09",
	},
	{
		id: 13,
		name: "Table Lamp",
		sku: "LAMP-002",
		collection: "Classic",
		category: "Lighting",
		price: 150,
		cost: 75,
		stock: 20,
		status: "published",
		image: "https://placehold.co/80x80?text=TableLamp",
		updatedAt: "2026-06-08",
	},
	{
		id: 14,
		name: "Armchair",
		sku: "ARMCHAIR-001",
		collection: "Modern Living",
		category: "Seating",
		price: 700,
		cost: 400,
		stock: 7,
		status: "published",
		image: "https://placehold.co/80x80?text=Armchair",
		updatedAt: "2026-06-07",
	},
	{
		id: 15,
		name: "Side Table",
		sku: "SIDE-001",
		collection: "Minimalist",
		category: "Tables",
		price: 280,
		cost: 160,
		stock: 0,
		status: "draft",
		image: "https://placehold.co/80x80?text=SideTable",
		updatedAt: "2026-06-06",
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

export type Collection = {
	id: number;
	name: string;
	slug: string;
	productCount: number;
	status: "published" | "draft";
	updatedAt: string;
	description?: string;
	coverImage?: string;
	heroImage?: string;
	productIds?: number[];
};

export const dummyCollections: Collection[] = [
	{ id: 1, name: "Modern Living", slug: "modern-living", productCount: 24, status: "published", updatedAt: "2026-06-18", description: "Furniture modern untuk hunian masa kini.", coverImage: "https://placehold.co/600x400?text=Modern+Living", heroImage: "https://placehold.co/1200x400?text=Modern+Living", productIds: [1, 2, 5] },
	{ id: 2, name: "Minimalist", slug: "minimalist", productCount: 18, status: "published", updatedAt: "2026-06-16", description: "Design minimalis yang sederhana dan elegan.", coverImage: "https://placehold.co/600x400?text=Minimalist", heroImage: "https://placehold.co/1200x400?text=Minimalist", productIds: [1, 2, 5] },
	{ id: 3, name: "Classic", slug: "classic", productCount: 12, status: "draft", updatedAt: "2026-06-20", description: "Koleksi klasik yang timeless.", coverImage: "https://placehold.co/600x400?text=Classic", heroImage: "https://placehold.co/1200x400?text=Classic", productIds: [1, 2, 5] },
	{ id: 4, name: "Contemporary", slug: "contemporary", productCount: 16, status: "published", updatedAt: "2026-05-18", description: "Desain kontemporer yang modern.", coverImage: "https://placehold.co/600x400?text=Contemporary", heroImage: "https://placehold.co/1200x400?text=Contemporary", productIds: [2, 3, 6] },
	{ id: 5, name: "Vintage", slug: "vintage", productCount: 9, status: "published", updatedAt: "2026-05-16", description: "Gaya vintage dengan sentuhan retro.", coverImage: "https://placehold.co/600x400?text=Vintage", heroImage: "https://placehold.co/1200x400?text=Vintage", productIds: [2, 3, 6] },
	{ id: 6, name: "Scandinavian", slug: "scandinavian", productCount: 14, status: "draft", updatedAt: "2026-05-20", description: "Desain Skandinavia yang minimalis.", coverImage: "https://placehold.co/600x400?text=Scandinavian", heroImage: "https://placehold.co/1200x400?text=Scandinavian", productIds: [2, 3, 6] },
	{ id: 7, name: "Industrial", slug: "industrial", productCount: 11, status: "published", updatedAt: "2026-04-18", description: "Gaya industrial yang kuat.", coverImage: "https://placehold.co/600x400?text=Industrial", heroImage: "https://placehold.co/1200x400?text=Industrial", productIds: [3, 4, 7] },
	{ id: 8, name: "Mediterranean", slug: "mediterranean", productCount: 8, status: "published", updatedAt: "2026-04-16", description: "Sentuhan Mediterania yang hangat.", coverImage: "https://placehold.co/600x400?text=Mediterranean", heroImage: "https://placehold.co/1200x400?text=Mediterranean", productIds: [3, 4, 7] },
	{ id: 9, name: "Bohemian", slug: "bohemian", productCount: 13, status: "draft", updatedAt: "2026-04-20", description: "Gaya bohemian yang unik dan kreatif.", coverImage: "https://placehold.co/600x400?text=Bohemian", heroImage: "https://placehold.co/1200x400?text=Bohemian", productIds: [3, 4, 7] },
	{ id: 10, name: "Art Deco", slug: "art-deco", productCount: 7, status: "published", updatedAt: "2026-03-18", description: "Gaya Art Deco yang elegan.", coverImage: "https://placehold.co/600x400?text=Art+Deco", heroImage: "https://placehold.co/1200x400?text=Art+Deco", productIds: [4, 5, 8] },
	{ id: 11, name: "Rustic", slug: "rustic", productCount: 19, status: "published", updatedAt: "2026-03-16", description: "Gaya rustic yang alami.", coverImage: "https://placehold.co/600x400?text=Rustic", heroImage: "https://placehold.co/1200x400?text=Rustic", productIds: [4, 5, 8] },
	{ id: 12, name: "Japanese Zen", slug: "japanese-zen", productCount: 10, status: "draft", updatedAt: "2026-03-20", description: "Desain Jepang yang tenang.", coverImage: "https://placehold.co/600x400?text=Japanese+Zen", heroImage: "https://placehold.co/1200x400?text=Japanese+Zen", productIds: [4, 5, 8] },
	{ id: 13, name: "Coastal", slug: "coastal", productCount: 15, status: "published", updatedAt: "2026-02-18", description: "Gaya pantai yang santai.", coverImage: "https://placehold.co/600x400?text=Coastal", heroImage: "https://placehold.co/1200x400?text=Coastal", productIds: [5, 6, 9] },
	{ id: 14, name: "Mid-Century Modern", slug: "mid-century-modern", productCount: 21, status: "published", updatedAt: "2026-02-16", description: "Desain mid-century yang ikonik.", coverImage: "https://placehold.co/600x400?text=Mid-Century+Modern", heroImage: "https://placehold.co/1200x400?text=Mid-Century+Modern", productIds: [5, 6, 9] },
	{ id: 15, name: "Tropical", slug: "tropical", productCount: 6, status: "draft", updatedAt: "2026-02-20", description: "Gaya tropis yang segar.", coverImage: "https://placehold.co/600x400?text=Tropical", heroImage: "https://placehold.co/1200x400?text=Tropical", productIds: [5, 6, 9] },
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

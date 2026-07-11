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
	{
		id: 1,
		name: "Modern Living",
		slug: "modern-living",
		productCount: 24,
		status: "published",
		updatedAt: "2026-06-18",
		description: "Furniture modern untuk hunian masa kini.",
		coverImage: "https://placehold.co/600x400?text=Modern+Living",
		heroImage: "https://placehold.co/1200x400?text=Modern+Living",
		productIds: [1, 2, 5],
	},
	{
		id: 2,
		name: "Minimalist",
		slug: "minimalist",
		productCount: 18,
		status: "published",
		updatedAt: "2026-06-16",
		description: "Design minimalis yang sederhana dan elegan.",
		coverImage: "https://placehold.co/600x400?text=Minimalist",
		heroImage: "https://placehold.co/1200x400?text=Minimalist",
		productIds: [1, 2, 5],
	},
	{
		id: 3,
		name: "Classic",
		slug: "classic",
		productCount: 12,
		status: "draft",
		updatedAt: "2026-06-20",
		description: "Koleksi klasik yang timeless.",
		coverImage: "https://placehold.co/600x400?text=Classic",
		heroImage: "https://placehold.co/1200x400?text=Classic",
		productIds: [1, 2, 5],
	},
	{
		id: 4,
		name: "Contemporary",
		slug: "contemporary",
		productCount: 16,
		status: "published",
		updatedAt: "2026-05-18",
		description: "Desain kontemporer yang modern.",
		coverImage: "https://placehold.co/600x400?text=Contemporary",
		heroImage: "https://placehold.co/1200x400?text=Contemporary",
		productIds: [2, 3, 6],
	},
	{
		id: 5,
		name: "Vintage",
		slug: "vintage",
		productCount: 9,
		status: "published",
		updatedAt: "2026-05-16",
		description: "Gaya vintage dengan sentuhan retro.",
		coverImage: "https://placehold.co/600x400?text=Vintage",
		heroImage: "https://placehold.co/1200x400?text=Vintage",
		productIds: [2, 3, 6],
	},
	{
		id: 6,
		name: "Scandinavian",
		slug: "scandinavian",
		productCount: 14,
		status: "draft",
		updatedAt: "2026-05-20",
		description: "Desain Skandinavia yang minimalis.",
		coverImage: "https://placehold.co/600x400?text=Scandinavian",
		heroImage: "https://placehold.co/1200x400?text=Scandinavian",
		productIds: [2, 3, 6],
	},
	{
		id: 7,
		name: "Industrial",
		slug: "industrial",
		productCount: 11,
		status: "published",
		updatedAt: "2026-04-18",
		description: "Gaya industrial yang kuat.",
		coverImage: "https://placehold.co/600x400?text=Industrial",
		heroImage: "https://placehold.co/1200x400?text=Industrial",
		productIds: [3, 4, 7],
	},
	{
		id: 8,
		name: "Mediterranean",
		slug: "mediterranean",
		productCount: 8,
		status: "published",
		updatedAt: "2026-04-16",
		description: "Sentuhan Mediterania yang hangat.",
		coverImage: "https://placehold.co/600x400?text=Mediterranean",
		heroImage: "https://placehold.co/1200x400?text=Mediterranean",
		productIds: [3, 4, 7],
	},
	{
		id: 9,
		name: "Bohemian",
		slug: "bohemian",
		productCount: 13,
		status: "draft",
		updatedAt: "2026-04-20",
		description: "Gaya bohemian yang unik dan kreatif.",
		coverImage: "https://placehold.co/600x400?text=Bohemian",
		heroImage: "https://placehold.co/1200x400?text=Bohemian",
		productIds: [3, 4, 7],
	},
	{
		id: 10,
		name: "Art Deco",
		slug: "art-deco",
		productCount: 7,
		status: "published",
		updatedAt: "2026-03-18",
		description: "Gaya Art Deco yang elegan.",
		coverImage: "https://placehold.co/600x400?text=Art+Deco",
		heroImage: "https://placehold.co/1200x400?text=Art+Deco",
		productIds: [4, 5, 8],
	},
	{
		id: 11,
		name: "Rustic",
		slug: "rustic",
		productCount: 19,
		status: "published",
		updatedAt: "2026-03-16",
		description: "Gaya rustic yang alami.",
		coverImage: "https://placehold.co/600x400?text=Rustic",
		heroImage: "https://placehold.co/1200x400?text=Rustic",
		productIds: [4, 5, 8],
	},
	{
		id: 12,
		name: "Japanese Zen",
		slug: "japanese-zen",
		productCount: 10,
		status: "draft",
		updatedAt: "2026-03-20",
		description: "Desain Jepang yang tenang.",
		coverImage: "https://placehold.co/600x400?text=Japanese+Zen",
		heroImage: "https://placehold.co/1200x400?text=Japanese+Zen",
		productIds: [4, 5, 8],
	},
	{
		id: 13,
		name: "Coastal",
		slug: "coastal",
		productCount: 15,
		status: "published",
		updatedAt: "2026-02-18",
		description: "Gaya pantai yang santai.",
		coverImage: "https://placehold.co/600x400?text=Coastal",
		heroImage: "https://placehold.co/1200x400?text=Coastal",
		productIds: [5, 6, 9],
	},
	{
		id: 14,
		name: "Mid-Century Modern",
		slug: "mid-century-modern",
		productCount: 21,
		status: "published",
		updatedAt: "2026-02-16",
		description: "Desain mid-century yang ikonik.",
		coverImage: "https://placehold.co/600x400?text=Mid-Century+Modern",
		heroImage: "https://placehold.co/1200x400?text=Mid-Century+Modern",
		productIds: [5, 6, 9],
	},
	{
		id: 15,
		name: "Tropical",
		slug: "tropical",
		productCount: 6,
		status: "draft",
		updatedAt: "2026-02-20",
		description: "Gaya tropis yang segar.",
		coverImage: "https://placehold.co/600x400?text=Tropical",
		heroImage: "https://placehold.co/1200x400?text=Tropical",
		productIds: [5, 6, 9],
	},
];

export type Category = {
	id: number;
	name: string;
	roomType: string;
	displayOrder: number;
	products: number;
	status: "published" | "draft";
	updatedAt: string;
};

export const dummyRoomTypes: string[] = [
	"Living Room",
	"Bedroom",
	"Dining Room",
	"Office",
];

export const dummyCategories: Category[] = [
	{
		id: 1,
		name: "Seating",
		roomType: "Living Room",
		displayOrder: 1,
		products: 45,
		status: "published",
		updatedAt: "2026-06-18",
	},
	{
		id: 2,
		name: "Tables",
		roomType: "Dining Room",
		displayOrder: 2,
		products: 32,
		status: "published",
		updatedAt: "2026-06-17",
	},
	{
		id: 3,
		name: "Storage",
		roomType: "Bedroom",
		displayOrder: 1,
		products: 28,
		status: "draft",
		updatedAt: "2026-06-16",
	},
	{
		id: 4,
		name: "Lighting",
		roomType: "Living Room",
		displayOrder: 2,
		products: 19,
		status: "published",
		updatedAt: "2026-06-15",
	},
	{
		id: 5,
		name: "Desks",
		roomType: "Office",
		displayOrder: 1,
		products: 12,
		status: "draft",
		updatedAt: "2026-06-14",
	},
	{
		id: 6,
		name: "Wardrobes",
		roomType: "Bedroom",
		displayOrder: 2,
		products: 8,
		status: "published",
		updatedAt: "2026-06-13",
	},
];

export type Color = {
	id: number;
	name: string;
	hex?: string;
	photo?: string;
	notes?: string;
};

export const dummyMedia: string[] = [
	"https://placehold.co/200x200/C19A6B/ffffff?text=Oak",
	"https://placehold.co/200x200/8B5A2B/ffffff?text=Walnut",
	"https://placehold.co/200x200/E8E8E8/333333?text=Marble",
	"https://placehold.co/200x200/B5A642/ffffff?text=Brass",
	"https://placehold.co/200x200/D2B48C/333333?text=Tan",
	"https://placehold.co/200x200/2F4F4F/ffffff?text=Slate",
	"https://placehold.co/200x200/F5DEB3/333333?text=Linen",
	"https://placehold.co/200x200/4A4A4A/ffffff?text=Charcoal",
];

export type MaterialType = {
	id: number;
	name: string;
	locked?: boolean;
	colors: Color[];
};

export const dummyColors: Color[] = [
	{ id: 1, name: "Black", hex: "#000000" },
	{ id: 2, name: "White", hex: "#FFFFFF" },
	{ id: 3, name: "Navy", hex: "#001F3F" },
	{ id: 4, name: "Beige", hex: "#F5DEB3" },
];

export const dummyMaterialTypes: MaterialType[] = [
	{
		id: 1,
		name: "Brand",
		locked: true,
		colors: [
			{ id: 1, name: "Khena Black", hex: "#1A1A1A" },
			{ id: 2, name: "Khena White", hex: "#F5F5F5" },
		],
	},
	{ id: 2, name: "Wood", colors: [{ id: 10, name: "Oak", hex: "#C19A6B" }] },
	{ id: 3, name: "Fabric", colors: [] },
	{
		id: 4,
		name: "Stone",
		colors: [{ id: 20, name: "Marble", hex: "#E8E8E8" }],
	},
	{ id: 5, name: "Metal", colors: [{ id: 30, name: "Brass", hex: "#B5A642" }] },
	{ id: 6, name: "Leather", colors: [{ id: 40, name: "Tan", hex: "#D2B48C" }] },
];

// ----- Media Library -----

export type MediaFileType = "image" | "video";

export type MediaFile = {
	id: number;
	name: string;
	url: string;
	type: MediaFileType;
	size: number; // dalam byte
	width?: number;
	height?: number;
	categoryId: number;
	folderId: number | null; // null = berada di akar kategori
	altText?: string;
	uploadedAt: string;
};

export type MediaFolder = {
	id: number;
	name: string;
	categoryId: number;
};

export type MediaCategory = {
	id: number;
	name: string;
};

export const dummyMediaCategories: MediaCategory[] = [
	{ id: 1, name: "Products" },
	{ id: 2, name: "Collections" },
	{ id: 3, name: "Banners" },
	{ id: 4, name: "Misc" },
];

export const dummyMediaFolders: MediaFolder[] = [
	{ id: 1, name: "Sofa", categoryId: 1 },
	{ id: 2, name: "Tables", categoryId: 1 },
	{ id: 3, name: "Lighting", categoryId: 1 },
	{ id: 4, name: "Modern Living", categoryId: 2 },
	{ id: 5, name: "Minimalist", categoryId: 2 },
];

export const dummyMediaFiles: MediaFile[] = [
	// Products › Sofa
	{
		id: 1,
		name: "sofa-hero.jpg",
		url: "https://placehold.co/600x400/C19A6B/ffffff?text=Sofa+Hero",
		type: "image",
		size: 1_240_000,
		width: 600,
		height: 400,
		categoryId: 1,
		folderId: 1,
		altText: "Modern sofa set in living room",
		uploadedAt: "2026-06-20",
	},
	{
		id: 2,
		name: "sofa-detail.jpg",
		url: "https://placehold.co/600x400/8B5A2B/ffffff?text=Sofa+Detail",
		type: "image",
		size: 860_000,
		width: 600,
		height: 400,
		categoryId: 1,
		folderId: 1,
		uploadedAt: "2026-06-19",
	},
	{
		id: 3,
		name: "sofa-360.mp4",
		url: "https://placehold.co/600x400/4A4A4A/ffffff?text=Sofa+360",
		type: "video",
		size: 8_400_000,
		width: 1280,
		height: 720,
		categoryId: 1,
		folderId: 1,
		uploadedAt: "2026-06-18",
	},
	// Products › Tables
	{
		id: 4,
		name: "dining-table.jpg",
		url: "https://placehold.co/600x400/D2B48C/333333?text=Dining+Table",
		type: "image",
		size: 1_020_000,
		width: 600,
		height: 400,
		categoryId: 1,
		folderId: 2,
		uploadedAt: "2026-06-17",
	},
	{
		id: 5,
		name: "coffee-table.jpg",
		url: "https://placehold.co/600x400/E8E8E8/333333?text=Coffee+Table",
		type: "image",
		size: 740_000,
		width: 600,
		height: 400,
		categoryId: 1,
		folderId: 2,
		uploadedAt: "2026-06-16",
	},
	// Products › Lighting
	{
		id: 6,
		name: "floor-lamp.jpg",
		url: "https://placehold.co/600x400/B5A642/ffffff?text=Floor+Lamp",
		type: "image",
		size: 520_000,
		width: 600,
		height: 400,
		categoryId: 1,
		folderId: 3,
		uploadedAt: "2026-06-15",
	},
	// Products › akar kategori (tanpa folder)
	{
		id: 7,
		name: "catalogue-cover.jpg",
		url: "https://placehold.co/600x400/2F4F4F/ffffff?text=Catalogue",
		type: "image",
		size: 1_480_000,
		width: 600,
		height: 400,
		categoryId: 1,
		folderId: null,
		uploadedAt: "2026-06-21",
	},
	{
		id: 8,
		name: "promo-clip.mp4",
		url: "https://placehold.co/600x400/1A1A1A/ffffff?text=Promo+Clip",
		type: "video",
		size: 12_300_000,
		width: 1920,
		height: 1080,
		categoryId: 1,
		folderId: null,
		uploadedAt: "2026-06-22",
	},
	// Collections › Modern Living
	{
		id: 9,
		name: "modern-living-hero.jpg",
		url: "https://placehold.co/600x400/C19A6B/ffffff?text=Modern+Living",
		type: "image",
		size: 1_650_000,
		width: 600,
		height: 400,
		categoryId: 2,
		folderId: 4,
		uploadedAt: "2026-06-14",
	},
	{
		id: 10,
		name: "modern-living-walkthrough.mp4",
		url: "https://placehold.co/600x400/8B5A2B/ffffff?text=Walkthrough",
		type: "video",
		size: 21_800_000,
		width: 1920,
		height: 1080,
		categoryId: 2,
		folderId: 4,
		uploadedAt: "2026-06-13",
	},
	// Collections › Minimalist
	{
		id: 11,
		name: "minimalist-hero.jpg",
		url: "https://placehold.co/600x400/F5DEB3/333333?text=Minimalist",
		type: "image",
		size: 980_000,
		width: 600,
		height: 400,
		categoryId: 2,
		folderId: 5,
		uploadedAt: "2026-06-12",
	},
	// Collections › akar kategori
	{
		id: 12,
		name: "collections-banner.jpg",
		url: "https://placehold.co/600x400/4A4A4A/ffffff?text=Collections",
		type: "image",
		size: 1_120_000,
		width: 600,
		height: 400,
		categoryId: 2,
		folderId: null,
		uploadedAt: "2026-06-11",
	},
	// Banners › akar kategori (tanpa folder sama sekali)
	{
		id: 13,
		name: "homepage-banner.jpg",
		url: "https://placehold.co/600x400/2F4F4F/ffffff?text=Homepage",
		type: "image",
		size: 2_040_000,
		width: 1920,
		height: 600,
		categoryId: 3,
		folderId: null,
		uploadedAt: "2026-06-10",
	},
	{
		id: 14,
		name: "sale-banner.jpg",
		url: "https://placehold.co/600x400/B5A642/ffffff?text=Sale",
		type: "image",
		size: 1_360_000,
		width: 1920,
		height: 600,
		categoryId: 3,
		folderId: null,
		uploadedAt: "2026-06-09",
	},
	{
		id: 15,
		name: "promo-banner.mp4",
		url: "https://placehold.co/600x400/1A1A1A/ffffff?text=Promo+Banner",
		type: "video",
		size: 9_600_000,
		width: 1920,
		height: 600,
		categoryId: 3,
		folderId: null,
		uploadedAt: "2026-06-08",
	},
	// NB: kategori "Misc" (id 4) sengaja dibiarkan kosong untuk menguji empty state.
];

// ----- Customers -----

export type CustomerSegment = "vip" | "loyal" | "new" | "regular";

export type Customer = {
	id: number;
	name: string;
	email: string;
	phone?: string;
	city?: string;
	avatarColor?: string; // warna avatar inisial (opsional)
	ordersCount: number;
	lifetimeValue: number; // dalam Rupiah, angka mentah (mis. 15000000)
	lastOrderAt: string | null; // ISO date, null kalau belum pernah order
	joinedAt: string; // ISO date
	segment: CustomerSegment;
	hasDataIssue?: boolean; // true → tampilkan flag di kolom nama
	notes?: string; // catatan internal (kolom Notes)
};

// Catatan: "bulan ini" mengacu pada Juli 2026 (lihat joinedAt segmen "new").
export const dummyCustomers: Customer[] = [
	{
		id: 1,
		name: "Andi Wijaya",
		email: "andi.wijaya@gmail.com",
		phone: "0812-3456-7890",
		city: "Jakarta",
		avatarColor: "grape",
		ordersCount: 24,
		lifetimeValue: 87_500_000,
		lastOrderAt: "2026-07-02",
		joinedAt: "2024-03-14",
		segment: "vip",
	},
	{
		id: 2,
		name: "Siti Rahayu",
		email: "siti.rahayu@gmail.com",
		phone: "0813-9876-5432",
		city: "Bandung",
		avatarColor: "grape",
		ordersCount: 19,
		lifetimeValue: 64_200_000,
		lastOrderAt: "2026-06-28",
		joinedAt: "2024-05-02",
		segment: "vip",
	},
	{
		id: 3,
		name: "Budi Santoso",
		email: "budi.santoso@yahoo.com",
		phone: "0821-1122-3344",
		city: "Surabaya",
		avatarColor: "blue",
		ordersCount: 8,
		lifetimeValue: 21_800_000,
		lastOrderAt: "2026-06-15",
		joinedAt: "2024-11-20",
		segment: "loyal",
	},
	{
		id: 4,
		name: "Dewi Lestari",
		email: "dewi.lestari@gmail.com",
		phone: "0856-7788-9900",
		city: "Yogyakarta",
		avatarColor: "blue",
		ordersCount: 6,
		lifetimeValue: 18_400_000,
		lastOrderAt: "2026-05-30",
		joinedAt: "2025-01-08",
		segment: "loyal",
	},
	{
		id: 5,
		name: "Eko Prasetyo",
		email: "eko.prasetyo@gmail.com",
		phone: "0878-2233-4455",
		city: "Semarang",
		avatarColor: "blue",
		ordersCount: 5,
		lifetimeValue: 14_900_000,
		lastOrderAt: "2026-06-10",
		joinedAt: "2025-02-17",
		segment: "loyal",
	},
	{
		id: 6,
		name: "Fitri Handayani",
		email: "fitri.h@gmail.com",
		phone: "0811-5566-7788",
		city: "Medan",
		avatarColor: "teal",
		ordersCount: 1,
		lifetimeValue: 2_300_000,
		lastOrderAt: "2026-07-05",
		joinedAt: "2026-07-01",
		segment: "new",
	},
	{
		id: 7,
		name: "Gilang Ramadhan",
		email: "gilang.r@gmail.com",
		city: "Jakarta",
		avatarColor: "teal",
		ordersCount: 0,
		lifetimeValue: 0,
		lastOrderAt: null,
		joinedAt: "2026-07-06",
		segment: "new",
	},
	{
		id: 8,
		name: "Hana Permata",
		email: "hana.permata@gmail.com",
		phone: "0857-9911-2233",
		city: "Denpasar",
		avatarColor: "teal",
		ordersCount: 1,
		lifetimeValue: 4_750_000,
		lastOrderAt: "2026-07-08",
		joinedAt: "2026-07-04",
		segment: "new",
	},
	{
		id: 9,
		name: "Irfan Maulana",
		email: "irfan.maulana@gmail.com",
		phone: "0812-6677-8899",
		city: "Bekasi",
		avatarColor: "gray",
		ordersCount: 3,
		lifetimeValue: 7_600_000,
		lastOrderAt: "2026-04-22",
		joinedAt: "2025-08-11",
		segment: "regular",
	},
	{
		id: 10,
		name: "Joko Susilo",
		email: "",
		phone: "0821-3344-5566",
		city: "Malang",
		avatarColor: "gray",
		ordersCount: 2,
		lifetimeValue: 5_100_000,
		lastOrderAt: "2026-03-19",
		joinedAt: "2025-09-27",
		segment: "regular",
		hasDataIssue: true, // email kosong
	},
	{
		id: 11,
		name: "Kartika Sari",
		email: "kartika.sari@gmail.com",
		city: "Palembang",
		avatarColor: "gray",
		ordersCount: 2,
		lifetimeValue: 4_400_000,
		lastOrderAt: null,
		joinedAt: "2025-10-30",
		segment: "regular",
		hasDataIssue: true, // tidak ada nomor telepon & belum pernah checkout meski tercatat order
	},
	{
		id: 12,
		name: "Lukman Hakim",
		email: "lukman.hakim@gmail.com",
		phone: "0813-7788-1122",
		city: "Makassar",
		avatarColor: "gray",
		ordersCount: 4,
		lifetimeValue: 9_250_000,
		lastOrderAt: "2026-05-12",
		joinedAt: "2025-06-05",
		segment: "regular",
	},
	{
		id: 13,
		name: "Maya Anggraini",
		email: "maya.anggraini@gmail.com",
		phone: "0857-2211-3344",
		city: "Bandung",
		avatarColor: "grape",
		ordersCount: 15,
		lifetimeValue: 52_700_000,
		lastOrderAt: "2026-07-01",
		joinedAt: "2024-07-19",
		segment: "vip",
	},
	{
		id: 14,
		name: "Nanda Pratama",
		email: "nanda.pratama@gmail.com",
		phone: "0878-4455-6677",
		city: "Bogor",
		avatarColor: "blue",
		ordersCount: 7,
		lifetimeValue: 16_300_000,
		lastOrderAt: "2026-06-20",
		joinedAt: "2025-03-03",
		segment: "loyal",
	},
];

// ----- Purchasing -----

export type PurchaseOrderStatus =
	| "draft"
	| "ordered"
	| "partial"
	| "received"
	| "cancelled";

export type Supplier = {
	id: number;
	name: string; // "Supplier name"
	contactPerson?: string; // "Contact person"
	phone?: string;
	email?: string;
	notes?: string;
};

export type PurchaseOrderItem = {
	productId: number;
	name: string; // snapshot nama produk saat ditambahkan
	sku: string; // snapshot SKU
	qty: number;
	unitCost: number; // Rupiah mentah, per unit
};

export type PurchaseOrder = {
	id: number;
	code: string; // kolom "PO", mis. "PO-0001"
	supplierId: number; // relasi ke Supplier.id
	date: string; // ISO date, mis. "2026-07-01" (= "Order date")
	items: number; // DIHITUNG dari lineItems (total qty) — dipertahankan utk tabel & stats
	total: number; // DIHITUNG dari lineItems (sum line total) — dipertahankan utk tabel & stats
	status: PurchaseOrderStatus;
	// --- field baru ---
	lineItems?: PurchaseOrderItem[]; // opsional agar data dummy lama tetap valid
	expectedDate?: string; // ISO date, "Expected"
	notes?: string;
	receivedAt?: string; // ISO date; diisi saat status menjadi "received"
};

// Sebagian supplier sengaja dibiarkan tidak lengkap (tanpa contactPerson/phone/email)
// untuk menguji tampilan "—" di tabel.
export const dummySuppliers: Supplier[] = [
	{
		id: 1,
		name: "Jati Makmur Furniture",
		contactPerson: "Bambang Sutrisno",
		phone: "0812-2233-4455",
		email: "sales@jatimakmur.co.id",
		notes: "Pemasok kayu jati solid, lead time 2 minggu.",
	},
	{
		id: 2,
		name: "Rotan Nusantara",
		contactPerson: "Dewi Anggraini",
		phone: "0813-5566-7788",
		email: "order@rotannusantara.com",
	},
	{
		id: 3,
		name: "Sinar Logam Industri",
		contactPerson: "Hendra Gunawan",
		phone: "0821-9988-7766",
	},
	{
		id: 4,
		name: "Kaca Prima Mandiri",
		email: "cs@kacaprima.co.id",
	},
	{
		id: 5,
		name: "Busa & Kain Sejahtera",
		contactPerson: "Rina Marlina",
		phone: "0857-1212-3434",
		email: "rina@busakainsejahtera.com",
		notes: "Minimum order 50 meter kain.",
	},
];

export const dummyPurchaseOrders: PurchaseOrder[] = [
	{
		id: 1,
		code: "PO-0001",
		supplierId: 1,
		date: "2026-07-01",
		items: 12,
		total: 48_500_000,
		status: "ordered",
	},
	{
		id: 2,
		code: "PO-0002",
		supplierId: 2,
		date: "2026-06-24",
		items: 30,
		total: 15_750_000,
		status: "partial",
	},
	{
		id: 3,
		code: "PO-0003",
		supplierId: 3,
		date: "2026-06-18",
		items: 8,
		total: 9_200_000,
		status: "received",
		lineItems: [
			{
				productId: 2,
				name: "Dining Table",
				sku: "TABLE-001",
				qty: 5,
				unitCost: 700,
			},
			{
				productId: 6,
				name: "Coffee Table",
				sku: "TABLE-002",
				qty: 3,
				unitCost: 200,
			},
		],
		receivedAt: "2026-06-18",
	},
	{
		id: 4,
		code: "PO-0004",
		supplierId: 5,
		date: "2026-07-05",
		items: 50,
		total: 22_000_000,
		status: "draft",
		expectedDate: "2026-07-20",
		lineItems: [
			{
				productId: 1,
				name: "Modern Sofa Set",
				sku: "SOFA-001",
				qty: 10,
				unitCost: 1500,
			},
			{
				productId: 8,
				name: "Recliner Chair",
				sku: "RECLINER-001",
				qty: 40,
				unitCost: 450,
			},
		],
	},
	{
		id: 5,
		code: "PO-0005",
		supplierId: 4,
		date: "2026-05-30",
		items: 6,
		total: 6_400_000,
		status: "cancelled",
	},
	{
		id: 6,
		code: "PO-0006",
		supplierId: 1,
		date: "2026-06-10",
		items: 18,
		total: 61_300_000,
		status: "received",
	},
	{
		id: 7,
		code: "PO-0007",
		supplierId: 2,
		date: "2026-07-07",
		items: 24,
		total: 13_900_000,
		status: "ordered",
	},
	{
		id: 8,
		code: "PO-0008",
		supplierId: 5,
		date: "2026-06-02",
		items: 40,
		total: 18_600_000,
		status: "partial",
	},
];

// ----- Discounts -----

export type DiscountType = "percentage" | "fixed" | "free_shipping";
export type DiscountStatus = "active" | "scheduled" | "expired";
export type DiscountScope = "all" | "collection" | "category" | "product";

export type Discount = {
	id: number;
	code: string; // "SUMMER10" — ditampilkan monospace
	type: DiscountType;
	value: number; // percentage: 10 (=10%), fixed: 50000 (Rp), free_shipping: 0
	scope: DiscountScope;
	scopeLabel?: string; // teks cakupan, mis. "Modern Living" / "All products"
	startDate: string; // ISO, mis. "2026-07-01"
	endDate: string; // ISO, mis. "2026-07-31"
	used: number; // jumlah pemakaian
	usageLimit?: number; // batas limit; kalau kosong → tak terbatas
	status: DiscountStatus;
};

// Tanggal dibuat relatif terhadap "hari ini" (~2026-07-11) supaya tiap status
// (active/scheduled/expired) dan indikator "expiring soon" ikut teruji.
export const dummyDiscounts: Discount[] = [
	{
		id: 1,
		code: "SUMMER10",
		type: "percentage",
		value: 10,
		scope: "all",
		scopeLabel: "All products",
		startDate: "2026-07-01",
		endDate: "2026-07-31",
		used: 42,
		usageLimit: 100,
		status: "active",
	},
	{
		id: 2,
		code: "WELCOME50K",
		type: "fixed",
		value: 50_000,
		scope: "all",
		scopeLabel: "All products",
		startDate: "2026-06-15",
		endDate: "2026-07-15",
		used: 128,
		status: "active",
	},
	{
		id: 3,
		code: "FREESHIPJUL",
		type: "free_shipping",
		value: 0,
		scope: "all",
		scopeLabel: "All products",
		startDate: "2026-07-05",
		endDate: "2026-07-14",
		used: 310,
		usageLimit: 500,
		status: "active",
	},
	{
		id: 4,
		code: "MODERN25",
		type: "percentage",
		value: 25,
		scope: "collection",
		scopeLabel: "Modern Living",
		startDate: "2026-08-01",
		endDate: "2026-08-07",
		used: 0,
		usageLimit: 200,
		status: "scheduled",
	},
	{
		id: 5,
		code: "BEDROOMSHIP",
		type: "free_shipping",
		value: 0,
		scope: "collection",
		scopeLabel: "Bedroom Sets",
		startDate: "2026-07-20",
		endDate: "2026-07-27",
		used: 0,
		status: "scheduled",
	},
	{
		id: 6,
		code: "NEWYEAR100K",
		type: "fixed",
		value: 100_000,
		scope: "category",
		scopeLabel: "Dining",
		startDate: "2025-12-25",
		endDate: "2026-01-05",
		used: 89,
		usageLimit: 150,
		status: "expired",
	},
	{
		id: 7,
		code: "CLEARANCE15",
		type: "percentage",
		value: 15,
		scope: "product",
		scopeLabel: "Recliner Chair",
		startDate: "2026-05-01",
		endDate: "2026-05-31",
		used: 54,
		usageLimit: 60,
		status: "expired",
	},
	{
		id: 8,
		code: "LOYAL20",
		type: "percentage",
		value: 20,
		scope: "all",
		scopeLabel: "All products",
		startDate: "2026-07-05",
		endDate: "2026-09-30",
		used: 12,
		status: "active",
	},
];

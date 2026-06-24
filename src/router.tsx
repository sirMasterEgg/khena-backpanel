import {
	createBrowserRouter,
	type RouteObject,
	RouterProvider,
} from "react-router";
import { AppLayout } from "@/components/AppLayout";
import { CategoriesList } from "@/pages/categories/CategoriesList";
import { CategoryEditor } from "@/pages/categories/CategoryEditor";
import { CollectionDetail } from "@/pages/collections/CollectionDetail";
import { CollectionEditor } from "@/pages/collections/CollectionEditor";
import { CollectionsList } from "@/pages/collections/CollectionsList";
import { Dashboard } from "@/pages/Dashboard";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ProductDetail } from "@/pages/products/ProductDetail";
import { ProductEditor } from "@/pages/products/ProductEditor";
import { ProductsList } from "@/pages/products/ProductsList";
import { SignIn } from "@/pages/SignIn";

const routes: RouteObject[] = [
	{
		path: "/sign-in",
		element: <SignIn />,
	},
	{
		path: "/",
		element: <AppLayout />,
		children: [
			{
				path: "/",
				element: <Dashboard />,
			},
			{
				path: "/products",
				element: <ProductsList />,
			},
			{
				path: "/products/new",
				element: <ProductEditor />,
			},
			{
				path: "/products/:id",
				element: <ProductDetail />,
			},
			{
				path: "/products/:id/edit",
				element: <ProductEditor />,
			},
			{
				path: "/pos",
				element: <PlaceholderPage title="Point of Sale" />,
			},
			{
				path: "/collections",
				element: <CollectionsList />,
			},
			{
				path: "/collections/new",
				element: <CollectionEditor />,
			},
			{
				path: "/collections/:id",
				element: <CollectionDetail />,
			},
			{
				path: "/collections/:id/edit",
				element: <CollectionEditor />,
			},
			{
				path: "/categories",
				element: <CategoriesList />,
			},
			{
				path: "/categories/new",
				element: <CategoryEditor />,
			},
			{
				path: "/categories/:id/edit",
				element: <CategoryEditor />,
			},
			{
				path: "/jobs",
				element: <PlaceholderPage title="Jobs" />,
			},
			{
				path: "/applications",
				element: <PlaceholderPage title="Applications" />,
			},
			{
				path: "/pages",
				element: <PlaceholderPage title="Pages" />,
			},
			{
				path: "/media",
				element: <PlaceholderPage title="Media Library" />,
			},
			{
				path: "/color",
				element: <PlaceholderPage title="Color" />,
			},
			{
				path: "/orders",
				element: <PlaceholderPage title="Orders" />,
			},
			{
				path: "/deliveries",
				element: <PlaceholderPage title="Deliveries" />,
			},
			{
				path: "/customers",
				element: <PlaceholderPage title="Customers" />,
			},
			{
				path: "/discounts",
				element: <PlaceholderPage title="Discounts" />,
			},
			{
				path: "/stocks",
				element: <PlaceholderPage title="Stocks" />,
			},
			{
				path: "/purchasing",
				element: <PlaceholderPage title="Purchasing" />,
			},
			{
				path: "/marketplaces",
				element: <PlaceholderPage title="Marketplaces" />,
			},
			{
				path: "/messages",
				element: <PlaceholderPage title="Contact Messages" />,
			},
			{
				path: "/newsletter",
				element: <PlaceholderPage title="Newsletter" />,
			},
			{
				path: "/settings/general",
				element: <PlaceholderPage title="General Settings" />,
			},
			{
				path: "/settings/payments",
				element: <PlaceholderPage title="Payment Settings" />,
			},
			{
				path: "/settings/integrations",
				element: <PlaceholderPage title="Integrations" />,
			},
			{
				path: "/settings/shipping",
				element: <PlaceholderPage title="Shipping & Returns" />,
			},
			{
				path: "/settings/users",
				element: <PlaceholderPage title="Users & Roles" />,
			},
		],
	},
];

const router = createBrowserRouter(routes);

export function Router() {
	return <RouterProvider router={router} />;
}

import {
	createBrowserRouter,
	type RouteObject,
	RouterProvider,
} from "react-router";
import { Home } from "@/pages/Home";

const routes: RouteObject[] = [
	{
		path: "/",
		element: <Home />,
	},
];

const router = createBrowserRouter(routes);

export function Router() {
	return <RouterProvider router={router} />;
}

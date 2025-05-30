import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import {
	CodeHighlightAdapterProvider,
	createShikiAdapter,
} from "@mantine/code-highlight";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHotkeys, useLocalStorage } from "@mantine/hooks";

import { Layout as Shell } from "~/components/Layout";

import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/notifications/styles.css";
import "katex/dist/katex.min.css";
import type { Frame } from "./components/Chats";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

async function loadShiki() {
	const { createHighlighter } = await import("shiki");
	const shiki = await createHighlighter({
		langAlias: {
			htm: "html",
		},
		langs: [
			"tsx",
			"scss",
			"html",
			"bash",
			"json",
			"javascript",
			"java",
			"python",
			"yml",
			"css",
			"xml",
			"php",
			"text",
			"markdown",
			"sql",
			"typescript",
			"tsx",
			"jsx",
			"vue-html",
			"vue",
		],
		themes: ["andromeeda", "github-light", "github-dark"],
	});

	return shiki;
}

const shikiAdapter = createShikiAdapter(loadShiki);

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

const queryClient = new QueryClient();

export default function App() {
	// const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	const [colorScheme, setColorScheme] = useLocalStorage<"light" | "dark">({
		key: "mantine-color-scheme",
		// defaultValue: prefersDark ? "dark" : "light",
		defaultValue: "dark",
		getInitialValueInEffect: true,
	});

	const toggleColorScheme = (value?: "light" | "dark") =>
		setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

	useHotkeys([["mod+J", () => toggleColorScheme()]]);

	return (
		<>
			<ColorSchemeScript />

			<MantineProvider
				withGlobalStyles
				withNormalizeCSS
				withCSSVariables
				defaultColorScheme={colorScheme}
				theme={{
					primaryColor: "blue",
					globalStyles: (theme) => ({
						body: {
							backgroundColor:
								theme.colorScheme === "dark"
									? theme.colors.dark[9]
									: theme.colors.gray[0],
						},
					}),
					components: {
						Modal: {
							defaultProps: {
								padding: "xl",
							},
							styles: {
								title: {
									fontSize: "1.2rem",
									fontWeight: 600,
								},
							},
						},
						ModalRoot: {
							defaultProps: {
								centered: true,
							},
						},
						Overlay: {
							defaultProps: {
								opacity: 0.6,
								blur: 6,
							},
						},
						// Input: {
						//   defaultProps: {
						//     variant: "filled",
						//   },
						// },
						InputWrapper: {
							styles: {
								label: {
									marginBottom: 4,
								},
							},
						},
						Code: {
							styles: (theme) => ({
								root: {
									fontSize: theme.fontSizes.sm,
									backgroundColor:
										theme.colorScheme == "dark"
											? theme.colors.dark[7]
											: theme.colors.gray[1],
								},
							}),
						},
					},
				}}
			>
				<CodeHighlightAdapterProvider adapter={shikiAdapter}>
					<Notifications />
					<QueryClientProvider client={queryClient}>
						<Outlet />
					</QueryClientProvider>
				</CodeHighlightAdapterProvider>
			</MantineProvider>
		</>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}

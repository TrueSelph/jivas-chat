import {
	ColorSchemeScript,
	// ColorScheme,
	// ColorSchemeProvider,
	MantineProvider,
} from "@mantine/core";
import { useHotkeys, useLocalStorage } from "@mantine/hooks";
import { Notifications } from "@mantine/notifications";
import {
	createHashHistory,
	ReactLocation,
	Router,
} from "@tanstack/react-location";
import { ChatRoute } from "../routes/ChatRoute";
import { IndexRoute } from "../routes/IndexRoute";
import { Layout } from "./Layout";
import {
	CodeHighlightAdapterProvider,
	createShikiAdapter,
} from "@mantine/code-highlight";
import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";
import "@mantine/notifications/styles.css";
import "katex/dist/katex.min.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

const history = createHashHistory();
const location = new ReactLocation({ history });

// Shiki requires async code to load the highlighter
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

export function App() {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

	const [colorScheme, setColorScheme] = useLocalStorage<"light" | "dark">({
		key: "mantine-color-scheme",
		defaultValue: prefersDark ? "dark" : "light",
		getInitialValueInEffect: true,
	});

	const toggleColorScheme = (value?: "light" | "dark") =>
		setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

	useHotkeys([["mod+J", () => toggleColorScheme()]]);

	return (
		<Router
			location={location}
			routes={[
				{ path: "/", element: <IndexRoute /> },
				{ path: "/chats/:chatId", element: <ChatRoute /> },
			]}
		>
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
						<Layout />
						<ReactQueryDevtools initialIsOpen={false} />
					</QueryClientProvider>
				</CodeHighlightAdapterProvider>
			</MantineProvider>
			{/* </ColorSchemeProvider> */}
		</Router>
	);
}

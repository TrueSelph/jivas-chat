import {
	ActionIcon,
	Box,
	Card,
	CopyButton,
	Flex,
	Group,
	Table,
	Text,
	Tooltip,
	useMantineColorScheme,
	useMantineTheme,
} from "@mantine/core";
import { CodeHighlight, InlineCodeHighlight } from "@mantine/code-highlight";

import rehypeMathjax from "rehype-mathjax";

import { IconCopy } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import { Message } from "../db";
import "../styles/markdown.scss";
import { CreatePromptModal } from "./CreatePromptModal";
import { LogoIcon } from "./Logo";
import { ScrollIntoView } from "./ScrollIntoView";
import { preprocessLaTeX } from "../utils/latex";

export function MessageItem({ message }: { message: Message }) {
	const { colorScheme } = useMantineColorScheme();
	const [content, setContent] = useState(message.content);
	const wordCount = useMemo(() => {
		var matches = message.content.match(/[\w\d\'\'-\(\)]+/gi);
		return matches ? matches.length : 0;
	}, [message.content]);

	useEffect(() => {
		setContent(preprocessLaTeX(message.content));
		console.log("rerendered");
	}, [message.content]);

	return (
		<Box
			miw={message.role === "user" ? "20%" : "100%"}
			maw={message.role === "user" ? "90%" : "100%"}
			style={{
				alignSelf: message.role === "user" ? "end" : "unset",
			}}
		>
			<ScrollIntoView>
				<Card
					c={
						message.role === "user"
							? colorScheme === "dark"
								? "#fff"
								: "#000"
							: undefined
					}
					bg={
						message.role === "user"
							? colorScheme === "dark"
								? "dark.4"
								: "gray.4"
							: "unset"
					}
					radius={"lg"}
					p="xs"
				>
					<Flex gap="sm">
						{message.role === "assistant" && (
							<LogoIcon style={{ height: 32 }} />
						)}
						<Box flex={1} className="markdown">
							<ReactMarkdown
								children={content}
								remarkPlugins={[remarkGfm, remarkMath]}
								rehypePlugins={[rehypeMathjax]}
								components={{
									table: ({ node }) => {
										// Recursive rendering function for table elements
										const renderTableNode = (node: any): JSX.Element | null => {
											if (!node || typeof node !== "object") return null;

											// Handle different node types
											if (node.type === "element") {
												if (node.tagName === "table") {
													return (
														<Table
															tabularNums
															verticalSpacing="sm"
															highlightOnHover
														>
															{node.children.map((child: any, index: number) =>
																renderTableNode({
																	...child,
																	key: `table-part-${index}`,
																}),
															)}
														</Table>
													);
												} else if (node.tagName === "thead") {
													return (
														<Table.Thead key={node.key}>
															{node.children.map((child: any, index: number) =>
																renderTableNode({
																	...child,
																	key: `thead-row-${index}`,
																}),
															)}
														</Table.Thead>
													);
												} else if (node.tagName === "tbody") {
													return (
														<Table.Tbody key={node.key}>
															{node.children.length > 0 ? (
																node.children.map((child: any, index: number) =>
																	renderTableNode({
																		...child,
																		key: `tbody-row-${index}`,
																	}),
																)
															) : (
																<Table.Tr>
																	<Table.Td>No data available</Table.Td>
																</Table.Tr>
															)}
														</Table.Tbody>
													);
												} else if (node.tagName === "tr") {
													return (
														<Table.Tr key={node.key}>
															{node.children.map((child: any, index: number) =>
																renderTableNode({
																	...child,
																	key: `tr-cell-${index}`,
																}),
															)}
														</Table.Tr>
													);
												} else if (node.tagName === "th") {
													return (
														<Table.Th key={node.key}>
															{renderTableCellContent(node.children)}
														</Table.Th>
													);
												} else if (node.tagName === "td") {
													return (
														<Table.Td key={node.key}>
															{renderTableCellContent(node.children)}
														</Table.Td>
													);
												}
											}
											return null;
										};

										// Helper function to extract and render cell content
										const renderTableCellContent = (
											children: any[],
										): string => {
											if (!children || !Array.isArray(children)) return "-";

											const extractContent = (node: any): string => {
												if (!node) return "";
												if (node.type === "text") return node.value;
												if (
													node.type === "element" &&
													Array.isArray(node.children)
												) {
													return node.children.map(extractContent).join("");
												}
												return "";
											};

											const content = children.map(extractContent).join("");
											return content || "-";
										};

										// Start the recursive rendering from the root node
										return renderTableNode(node);
									},
									code: ({ node, className, ...props }) => {
										const languageMatch = /language-(\w+)/.exec(
											className || "",
										);
										const language = languageMatch
											? languageMatch[1]
											: undefined;
										const inline = props.children?.split("\n")?.length === 1;

										if (!inline) {
											return (
												<CodeHighlight
													language={language}
													withExpandButton
													code={props.children || ""}
												/>
											);
										} else {
											return (
												<InlineCodeHighlight
													language={language}
													code={props.children || ""}
												/>
											);
										}
									},
								}}
							/>
							{message.role === "assistant" && (
								<Box>
									<Text size="sm" c="dimmed">
										{wordCount} words
									</Text>
								</Box>
							)}
						</Box>

						<Group style={{ alignSelf: "start" }} gap={1}>
							{/* <CreatePromptModal content={message.content} /> */}
							<CopyButton value={message.content}>
								{({ copied, copy }) => (
									<Tooltip label={copied ? "Copied" : "Copy"} position="left">
										<ActionIcon
											size="sm"
											variant="transparent"
											c="gray"
											onClick={copy}
										>
											<IconCopy opacity={0.5} size={14} />
										</ActionIcon>
									</Tooltip>
								)}
							</CopyButton>
						</Group>
					</Flex>
				</Card>
			</ScrollIntoView>
		</Box>
	);
}

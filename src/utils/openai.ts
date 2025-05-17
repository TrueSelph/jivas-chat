import { encode } from "gpt-token-utils";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { OpenAIExt } from "openai-ext";
import { db } from "../db";
import { config } from "./config";
import { QueryClient } from "@tanstack/react-query";
import { Interaction } from "../routes/ChatRoute";

function getClient(
	apiKey: string,
	apiType: string,
	apiAuth: string,
	basePath: string,
) {
	const configuration = new Configuration({
		...((apiType === "openai" ||
			(apiType === "custom" && apiAuth === "bearer-token")) && {
			apiKey: apiKey,
		}),
		...(apiType === "custom" && { basePath: basePath }),
	});
	return new OpenAIApi(configuration);
}

export async function streamInteract(
	chatId: string,
	utterance: string,
	setStreamContent: (content: string) => void,
	onEvent: (event: { session_id: string; content: string }) => void,
	queryClient: QueryClient,
) {
	const settings = JSON.parse(localStorage.getItem("settings") || "{}");

	try {
		// Make a POST request using fetch instead of EventSource
		const response = await fetch(`${settings?.jivasHost}/interact`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				agent_id: settings?.jivasAgent,
				utterance,
				session_id: chatId,
				tts: true,
				verbose: true,
				streaming: true,
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		// Create a reader to process the stream
		const reader = response
			.body!.pipeThrough(new TextDecoderStream())
			.getReader();
		let fullContent = "";

		// Process the stream
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			// Process each chunk of data
			const lines = value.split("\n").filter((line) => line.trim() !== "");
			for (const line of lines) {
				try {
					// Handle data prefixed with "data: "
					const message = line.replace(/^data: /, "");

					// Parse the message as JSON
					const data = JSON.parse(message);

					fullContent += data.content;

					onEvent(data);

					// Check if this is the final message based on metadata
					const isFinal = data.metadata?.finish_reason === "stop";
					console.log({ fullContent });

					// setStreamContent(fullContent);
					// setStreamContent(messageId, fullContent, isFinal);

					queryClient.setQueryData<Interaction[]>(
						["messages", data.session_id],
						(old) => {
							const newMessage: Interaction = {
								id: `stream-${data?.id}`,
								utterance,
								agent_id: "",
								channel: "",
								closed: false,
								data: {},
								context_data: {},
								tokens: 0,
								time_stamp: new Date().toISOString(),
								intents: [],
								directives: [],
								events: [],
								trail: [],
								functions: [],
								response: {
									message_type: "",
									session_id: chatId,
									tokens: 0,
									message: {
										message_type: "TEXT",
										content: fullContent,
										meta: {},
									},
								},
							};
							return [
								...(old || []).filter(
									(i) =>
										!i?.id.startsWith("stream") &&
										!!i?.response?.message?.content,
								),
								newMessage,
							];
						},
					);

					if (isFinal) {
						queryClient.refetchQueries({ queryKey: ["messages", chatId] });
						// 	setStreamContent(messageId, fullContent, true);
						// 	setTotalTokens(chatId, fullContent);
						// 	return fullContent;
					}
				} catch (error) {
					console.error("Error parsing SSE data:", error);
				}
			}
		}

		return fullContent;
	} catch (error) {
		console.error("SSE Error:", error);
		throw error;
	}
}

export async function createStreamChatCompletion(
	apiKey: string,
	messages: ChatCompletionRequestMessage[],
	chatId: string,
	messageId: string,
) {
	const settings = await db.settings.get("general");
	const model = settings?.openAiModel ?? config.defaultModel;

	return OpenAIExt.streamClientChatCompletion(
		{
			model,
			messages,
		},
		{
			apiKey: apiKey,
			handler: {
				onContent(content, isFinal) {
					setStreamContent(messageId, content, isFinal);
					if (isFinal) {
						setTotalTokens(chatId, content);
					}
				},
				onDone() {},
				onError(error) {
					console.error(error);
				},
			},
		},
	);
}

function setStreamContent(
	messageId: string,
	content: string,
	isFinal: boolean,
) {
	content = isFinal ? content : content + "█";
	// db.messages.update(messageId, { content: content });
}

function setTotalTokens(chatId: string, content: string) {
	let total_tokens = encode(content).length;
}

export async function createChatCompletion(
	apiKey: string,
	messages: ChatCompletionRequestMessage[],
) {
	const settings = await db.settings.get("general");
	const model = settings?.openAiModel ?? config.defaultModel;
	const type = settings?.openAiApiType ?? config.defaultType;
	const auth = settings?.openAiApiAuth ?? config.defaultAuth;
	const base = settings?.openAiApiBase ?? config.defaultBase;
	const version = settings?.openAiApiVersion ?? config.defaultVersion;

	const client = getClient(apiKey, type, auth, base);
	return client.createChatCompletion(
		{
			model,
			stream: false,
			messages,
		},
		{
			headers: {
				"Content-Type": "application/json",
				...(type === "custom" && auth === "api-key" && { "api-key": apiKey }),
			},
			params: {
				...(type === "custom" && { "api-version": version }),
			},
		},
	);
}

export async function checkOpenAIKey(apiKey: string) {
	return createChatCompletion(apiKey, [
		{
			role: "user",
			content: "hello",
		},
	]);
}

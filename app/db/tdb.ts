import { createStore } from "tinybase/store/with-schemas";
import { createQueries } from "tinybase/queries";

export const store = createStore().setTablesSchema({
	chats: {
		id: { type: "string" },
		description: { type: "string" },
		totalTokens: { type: "number" },
		createdAt: { type: "number" }, // Use number for Date (timestamp)
		pinned: { type: "boolean" },
	},
	messages: {
		id: { type: "string" },
		chatId: { type: "string" },
		role: { type: "string" }, // Union type mapped to string
		content: { type: "string" },
		createdAt: { type: "number" }, // Use number for Date (timestamp)
	},
	prompts: {
		id: { type: "string" },
		title: { type: "string" },
		content: { type: "string" },
		createdAt: { type: "number" }, // Use number for Date (timestamp)
	},
	settings: {
		id: { type: "string" },
		openAiApiKey: { type: "string" }, // Optionality handled by data presence
		openAiModel: { type: "string" },
		openAiApiType: { type: "string" }, // Union type mapped to string
		openAiApiAuth: { type: "string" }, // Union type mapped to string
		openAiApiBase: { type: "string" },
		openAiApiVersion: { type: "string" },
	},
});

const queries = createQueries(store);
queries.setQueryDefinition("query", "pets", (keywords) => {
	// TinyQL goes here
});

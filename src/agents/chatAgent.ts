import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import {
  Annotation,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StructuredToolInterface } from "@langchain/core/tools";
import { ChatAnthropic } from "@langchain/anthropic";
import { config } from "../utils/env.js";
import { ChatMessage, LLMConfig } from "../types/index.js";

// Simple base prompt for the agent
const BASE_PROMPT = `You are a helpful AI assistant that can use tools to answer user questions.
Always be helpful, concise, and provide accurate information.`;

/**
 * Get a chat model instance
 */
function getChatModel(modelName: string, verbose: boolean = false) {
  return new ChatAnthropic({
    modelName: modelName || "claude-3-opus-20240229",
    anthropicApiKey: config.ANTHROPIC_API_KEY,
    verbose: verbose,
  });
}

/**
 * Convert chat history to BaseMessages format
 */
function mapChatHistoryToBaseMessages(
  chatHistory: ChatMessage[]
): BaseMessage[] {
  return chatHistory.map((msg) => {
    if (msg.role === "user") {
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });
}

/**
 * Generate a chat response using a LangGraph agent
 */
export async function generateChat(
  input: string,
  tools: StructuredToolInterface[],
  chatHistory: ChatMessage[] = [],
  llmConfig: LLMConfig = { model: "claude-3-opus-20240229" }
): Promise<ReadableStream<string>> {
  // Get the chat model
  const chatModel = getChatModel(llmConfig.model, llmConfig.verbose);

  // Bind tools to the model if there are any
  const modelWithTools = tools.length ? chatModel.bindTools(tools) : chatModel;

  // The state interface for all the nodes in the graph
  const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
    }),
  });

  // Function that calls the model
  async function callModel(state: typeof StateAnnotation.State) {
    // Create a prompt template
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(BASE_PROMPT),
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
      ...state.messages,
    ]);

    // Create a chain with the prompt and model
    const chain = RunnableSequence.from([prompt, modelWithTools]);

    // Invoke the chain with the current state
    const response = await chain.invoke({
      input: input,
      chat_history: mapChatHistoryToBaseMessages(chatHistory),
    });

    return { messages: [response] };
  }

  // Function that routes the message to tools or end
  function routeMessage({ messages }: { messages: AIMessage[] }) {
    const lastMessage = messages[messages.length - 1] as AIMessage;

    // If there are tool calls, route to tools
    if (lastMessage.tool_calls?.length) {
      return "tools";
    }

    // Otherwise, end the conversation
    return "__end__";
  }

  console.log("Initializing LangGraph agent");

  // Initialize the graph
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addNode("tools", new ToolNode(tools))
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", routeMessage);

  // Compile the graph
  const agent = graph.compile();

  console.log("Starting agent execution");

  // Invoke the agent and return the stream
  const stream = await agent.stream(
    {
      messages: [],
    },
    {
      streamMode: "messages",
    }
  );

  return stream;
}

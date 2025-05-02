/**
 * Types for the chat system
 */

/**
 * Represents a message in the chat history
 */
export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  toolCalls?: ToolCall[];
}

/**
 * Represents a tool call within a message
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: string;
}

/**
 * Represents an MCP server configuration
 */
export interface MCPServer {
  name: string;
  version: string;
  url: string;
  key?: string;
}

/**
 * Configuration for the LLM
 */
export interface LLMConfig {
  model: string;
  verbose?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Types of chunks in streaming responses
 */
export type ChunkType =
  | "content"
  | "tool_call"
  | "tool_result"
  | "completion"
  | "start"
  | "message"
  | "text"
  | "data"
  | "error"
  | "end"
  | "unknown";

/**
 * Base interface for all parsed chunks
 */
export interface BaseParsedChunk {
  type: ChunkType;
  messageId?: string;
}

/**
 * Content chunk with message text
 */
export interface ContentChunk extends BaseParsedChunk {
  type: "content";
  content: string;
  messageId?: string;
}

/**
 * Tool call chunk when the agent is calling a tool
 */
export interface ToolCallChunk extends BaseParsedChunk {
  type: "tool_call";
  index: number;
  name: string;
  args: string;
  messageId?: string;
}

/**
 * Tool result chunk with the result of a tool execution
 */
export interface ToolResultChunk extends BaseParsedChunk {
  type: "tool_result";
  name: string;
  content: string;
  id?: string;
}

/**
 * Completion chunk indicating the message is complete
 */
export interface CompletionChunk extends BaseParsedChunk {
  type: "completion";
  reason: string;
  messageId?: string;
}

/**
 * Start chunk indicating a new message has started
 */
export interface StartChunk extends BaseParsedChunk {
  type: "start";
  messageId?: string;
}

/**
 * Error chunk for error handling
 */
export interface ErrorChunk extends BaseParsedChunk {
  type: "error";
  message: string;
  original?: string;
}

/**
 * End chunk for stream completion
 */
export interface EndChunk extends BaseParsedChunk {
  type: "end";
}

/**
 * Unknown chunk type for fallback handling
 */
export interface UnknownChunk extends BaseParsedChunk {
  type: "unknown";
  data: string;
  messageId?: string;
}

/**
 * Base interface for streaming chunks (original format)
 */
export interface BaseStreamChunk {
  type: ChunkType;
}

/**
 * Message chunk in streaming responses (original format)
 */
export interface MessageStreamChunk extends BaseStreamChunk {
  type: "message";
  content: string;
  toolCalls?: ToolCall[];
}

/**
 * Text chunk in streaming responses (original format)
 */
export interface TextStreamChunk extends BaseStreamChunk {
  type: "text";
  content: string;
}

/**
 * Data chunk in streaming responses (original format)
 */
export interface DataStreamChunk extends BaseStreamChunk {
  type: "data";
  content: string;
}

/**
 * Error chunk in streaming responses (original format)
 */
export interface ErrorStreamChunk extends BaseStreamChunk {
  type: "error";
  message: string;
}

/**
 * End chunk in streaming responses (original format)
 */
export interface EndStreamChunk extends BaseStreamChunk {
  type: "end";
}

/**
 * Union type for all stream chunk types (original format)
 */
export type StreamChunk =
  | MessageStreamChunk
  | TextStreamChunk
  | DataStreamChunk
  | ErrorStreamChunk
  | EndStreamChunk;

/**
 * Union type for all parsed chunk types (enhanced format)
 */
export type ParsedChunk =
  | ContentChunk
  | ToolCallChunk
  | ToolResultChunk
  | CompletionChunk
  | StartChunk
  | ErrorChunk
  | EndChunk
  | UnknownChunk;

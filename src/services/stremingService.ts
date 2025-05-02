import { ParsedChunk } from "../types/index.js";

/**
 * Parse streaming chunks from the LangGraph agent
 * @param chunk - The raw chunk from LangGraph stream
 * @returns A parsed chunk with standardized format
 */
export function parseStreamChunk(chunk: unknown): ParsedChunk {
  try {
    // Handle null or undefined chunks
    if (!chunk) {
      return {
        type: "error",
        message: "Received empty chunk",
      };
    }

    // Handle string chunks (plain text)
    if (typeof chunk === "string") {
      return {
        type: "content",
        content: chunk,
      };
    }

    // If chunk is an array, extract the main message object
    const messageChunk =
      Array.isArray(chunk) && chunk.length >= 1 ? chunk[0] : chunk;

    if (!messageChunk) {
      throw new Error("Invalid chunk structure");
    }

    // Handle tool results (ToolMessage)
    if (messageChunk.constructor?.name === "ToolMessage") {
      return {
        type: "tool_result",
        name: messageChunk.name || "unknown_tool",
        content: messageChunk.content || "",
        id: messageChunk.id || messageChunk.tool_call_id,
        messageId: messageChunk.id,
      };
    }

    // Handle tool calls
    if (messageChunk.tool_calls?.length) {
      const toolCall = messageChunk.tool_calls[0];
      return {
        type: "tool_call",
        index: toolCall.index || 0,
        name: toolCall.name || "unknown_tool",
        args:
          typeof toolCall.args === "string"
            ? toolCall.args
            : JSON.stringify(toolCall.args) || "",
        messageId: messageChunk.id,
      };
    }

    // Handle tool call chunks
    if (messageChunk.tool_call_chunks?.length) {
      const toolCall = messageChunk.tool_call_chunks[0];
      return {
        type: "tool_call",
        index: toolCall.index || 0,
        name: toolCall.name || "unknown_tool",
        args: toolCall.args || "",
        messageId: messageChunk.id,
      };
    }

    // Handle special input_json_delta format
    if (messageChunk.content && Array.isArray(messageChunk.content)) {
      const inputJsonItem = messageChunk.content.find(
        (item: any) => item?.type === "input_json_delta"
      );

      if (inputJsonItem) {
        return {
          type: "tool_call",
          index: inputJsonItem.index || 0,
          name: "unknown_tool",
          args: inputJsonItem.input || "",
          messageId: messageChunk.id,
        };
      }

      // Handle text content in array format
      const textItems = messageChunk.content.filter(
        (item: any) => item?.type === "text"
      );

      if (textItems.length > 0) {
        const textContent = textItems
          .map((item: any) => item.text || "")
          .join("");

        return {
          type: "content",
          content: textContent,
          messageId: messageChunk.id,
        };
      }

      // Empty content array with ID might be a start message
      if (
        messageChunk.content.length === 0 &&
        (messageChunk.id || messageChunk.additional_kwargs?.id)
      ) {
        return {
          type: "start",
          messageId: messageChunk.id || messageChunk.additional_kwargs?.id,
        };
      }
    }

    // Handle string content
    if (typeof messageChunk.content === "string") {
      return {
        type: "content",
        content: messageChunk.content,
        messageId: messageChunk.id,
      };
    }

    // Handle completion messages
    if (messageChunk.additional_kwargs?.stop_reason) {
      return {
        type: "completion",
        reason: messageChunk.additional_kwargs.stop_reason,
        messageId: messageChunk.id,
      };
    }

    // If we get here, handle it as an unknown chunk type
    return {
      type: "unknown",
      data: JSON.stringify(messageChunk),
      messageId: messageChunk.id || "unknown",
    };
  } catch (error: any) {
    console.error("Error parsing stream chunk:", error);
    return {
      type: "error",
      message: error.message,
      original:
        typeof chunk === "object" ? JSON.stringify(chunk) : String(chunk),
    };
  }
}

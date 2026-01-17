import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Agent, McpClient } from "@strands-agents/sdk";
import dotenv from "dotenv";

dotenv.config();

/**
 * x402 MCPサーバーを利用するためのMCPクライアントの設定
 */
const x402Tools = new McpClient({
  transport: new StdioClientTransport({
    command: "node",
    args: ["./../mcp/dist/index.js"],
    env: {
      PRIVATE_KEY: process.env.PRIVATE_KEY || "",
      RESOURCE_SERVER_URL: process.env.RESOURCE_SERVER_URL || "",
      ENDPOINT_PATH: process.env.ENDPOINT_PATH || "",
    },
  }),
});

/**
 * メイン関数
 */
const main = async () => {
  // First, test without tools to verify the model works
  console.log("=== Testing model without tools ===");
  const simpleAgent = new Agent({
    systemPrompt: "You are a helpful AI assistant.",
    model: "qwen.qwen3-32b-v1:0",
  });

  try {
    const simpleResult = await simpleAgent.invoke("こんにちは");
    console.log("Simple test result:", simpleResult);
  } catch (error) {
    console.error("Simple test failed:", error);
  }

  // Now test with tools
  console.log("\n=== Testing with x402 MCP tools ===");
  const agent = new Agent({
    systemPrompt: "You are a x402 AI Agent.",
    model: "qwen.qwen3-32b-v1:0",
    tools: [x402Tools],
  });

  try {
    const result = await agent.invoke("天気予報を教えて");
    console.log("Result with tools:", result);
  } catch (error) {
    console.error("Error with tools:", error);
  } finally {
    await x402Tools.disconnect();
  }
};

main();

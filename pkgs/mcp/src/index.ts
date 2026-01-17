import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { config } from "dotenv";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { withPaymentInterceptor } from "x402-axios";

config();

const privateKey = process.env.PRIVATE_KEY as Hex;
const baseURL = process.env.RESOURCE_SERVER_URL as string; // e.g. https://example.com
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /weather

if (!privateKey || !baseURL || !endpointPath) {
  throw new Error("Missing environment variables");
}

// ステーブルコインを支払うウォレットインスタンスを生成
const account = privateKeyToAccount(privateKey);
// x402を適用させるベースエンドポイントを指定してクライアントインスタンスを生成
const client = withPaymentInterceptor(axios.create({ baseURL }), account);

// Create an MCP server
const server = new McpServer({
  name: "x402 MCP Client",
  version: "1.0.0",
});

// Add get-weather tool
server.tool(
  "get-data-from-resource-server",
  "Get data from the resource server (in this example, the weather)",
  async () => {
    // 環境変数で渡されたエンドポイントを指定してAPIを実行する
    // ここでx402の支払い処理が自動的に行われる
    const res = await client.get(endpointPath);
    return {
      content: [{ type: "text", text: JSON.stringify(res.data) }],
    };
  },
);

const transport = new StdioServerTransport();

// Use async IIFE to handle top-level await
(async () => {
  try {
    await server.connect(transport);
  } catch (error) {
    console.error("Failed to connect server:", error);
    process.exit(1);
  }
})();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import serverlessExpress from "@vendia/serverless-express";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import axios from "axios";
import express from "express";
import type { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { withPaymentInterceptor } from "x402-axios";

// Environment variables
const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const RESOURCE_SERVER_URL = process.env.RESOURCE_SERVER_URL as string;

const privateKey = process.env.PRIVATE_KEY as Hex;
const baseURL = process.env.RESOURCE_SERVER_URL as string;
const endpointPath = process.env.ENDPOINT_PATH as string;

console.log("Lambda function started!");
console.log("Using RESOURCE_SERVER_URL:", RESOURCE_SERVER_URL);
console.log("Environment variables:", JSON.stringify(process.env, null, 2));

// ステーブルコインを支払うウォレットインスタンスを生成
const account = privateKeyToAccount(privateKey);
// x402を適用させるベースエンドポイントを指定してクライアントインスタンスを生成
const client = withPaymentInterceptor(axios.create({ baseURL }), account);

// Create an MCP server
const server = new McpServer({
  name: "x402 MCP Server",
  version: "1.0.0",
});

// Express app
const app = express();
app.use(express.json());

// リクエストログ用ミドルウェア
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  next();
});

/**
 * get Weather date tool
 */
server.tool(
  "get-data-from-resource-server",
  "Get data from the resource server (in this example, the weather)",
  async () => {
    try {
      // 環境変数で渡されたエンドポイントを指定してAPIを実行する
      // ここでx402の支払い処理が自動的に行われる
      const res = await client.get(endpointPath);
      return {
        content: [{ type: "text", text: JSON.stringify(res.data) }],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to fetch data from resource server:", errorMessage);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching data: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Create HTTP transport
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // Disable session management
});

// Routes
app.post("/mcp", async (req, res) => {
  console.log("MCP POST request received!");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request handling error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req, res) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.delete("/mcp", async (req, res) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// For AWS Lambda
let serverConnected = false;
const ensureServerConnection = async () => {
  if (!serverConnected) {
    await server.connect(transport);
    serverConnected = true;
  }
};

/**
 * Lambda handler メソッド
 * @param event APIGatewayProxyEvent
 * @param context Context
 * @returns APIGatewayProxyResult
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log("Lambda handler called!");
  console.log("Event:", JSON.stringify(event, null, 2));
  console.log("Context:", JSON.stringify(context, null, 2));

  try {
    await ensureServerConnection();
    const serverlessHandler = serverlessExpress({ app });
    return new Promise((resolve, reject) => {
      serverlessHandler(event, context, (error, result) => {
        if (error) {
          console.error("Serverless handler error:", error);
          reject(error);
        } else {
          console.log("Serverless handler success:", result);
          resolve(result as APIGatewayProxyResult);
        }
      });
    });
  } catch (error) {
    console.error("Lambda handler error:", error);
    throw error;
  }
};

server
  .connect(transport)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server setup failed:", error);
    process.exit(1);
  });

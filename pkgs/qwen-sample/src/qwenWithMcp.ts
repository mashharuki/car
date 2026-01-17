import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * MCPクライアントを初期化
 */
const initMcpClient = async () => {
  const client = new Client(
    {
      name: "qwen-mcp-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: ["./../mcp/dist/index.js"],
    env: {
      PRIVATE_KEY: process.env.PRIVATE_KEY || "",
      RESOURCE_SERVER_URL: process.env.RESOURCE_SERVER_URL || "",
      ENDPOINT_PATH: process.env.ENDPOINT_PATH || "",
    },
  });

  await client.connect(transport);
  return client;
};

/**
 * Qwen + MCPツールを使った会話
 */
const main = async () => {
  // MCPクライアントを初期化
  const mcpClient = await initMcpClient();

  // 利用可能なツールを取得
  const tools = await mcpClient.listTools();
  console.log(
    "Available MCP tools:",
    tools.tools.map((t) => t.name),
  );

  // Bedrock クライアントを初期化
  const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  // 会話履歴
  const messages = [
    {
      role: "user",
      content: [
        {
          text: "天気予報を教えて",
        },
      ],
    },
  ];

  // システムプロンプト
  const systemPrompts = [
    {
      text: "You are a helpful AI assistant with access to tools. When you need to get weather information, use the get-data-from-resource-server tool.",
    },
  ];

  // Bedrockのツールフォーマットに変換
  const bedrockTools = tools.tools.map((tool) => ({
    toolSpec: {
      name: tool.name,
      description: tool.description || "",
      inputSchema: {
        json: tool.inputSchema || { type: "object", properties: {} },
      },
    },
  }));

  let maxIterations = 5;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n=== Iteration ${iteration} ===`);

    // Bedrockにリクエスト
    const command = new ConverseCommand({
      modelId: "qwen.qwen3-32b-v1:0",
      messages: messages,
      system: systemPrompts,
      toolConfig: {
        tools: bedrockTools,
      },
    });

    const response = await bedrockClient.send(command);
    console.log("Response stopReason:", response.stopReason);

    // アシスタントのレスポンスを会話履歴に追加
    if (response.output?.message) {
      messages.push({
        role: "assistant",
        content: response.output.message.content || [],
      });
    }

    // ツール呼び出しの処理
    if (response.stopReason === "tool_use") {
      const toolUseBlocks = response.output?.message?.content?.filter(
        (block) => "toolUse" in block,
      );

      if (!toolUseBlocks || toolUseBlocks.length === 0) {
        console.log("No tool use blocks found");
        break;
      }

      // ツール実行結果を格納
      const toolResults: any[] = [];

      for (const block of toolUseBlocks) {
        if ("toolUse" in block && block.toolUse) {
          const toolUse = block.toolUse;
          console.log(`\n🔧 Calling tool: ${toolUse.name}`);
          console.log("Tool input:", JSON.stringify(toolUse.input, null, 2));

          try {
            // MCPツールを実行
            const result = await mcpClient.callTool({
              name: toolUse.name,
              arguments: toolUse.input || {},
            });

            console.log("✓ Tool completed");

            // ツール結果を抽出
            let toolResultText = "";
            if (result.content) {
              for (const content of result.content) {
                if (content.type === "text" && content.text) {
                  toolResultText += content.text;
                }
              }
            }

            console.log("Tool result:", toolResultText);

            toolResults.push({
              toolResult: {
                toolUseId: toolUse.toolUseId,
                content: [
                  {
                    text: toolResultText || "No result",
                  },
                ],
              },
            });
          } catch (error) {
            console.error("Tool execution error:", error);
            toolResults.push({
              toolResult: {
                toolUseId: toolUse.toolUseId,
                content: [
                  {
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  },
                ],
                status: "error",
              },
            });
          }
        }
      }

      // ツール実行結果を会話履歴に追加
      messages.push({
        role: "user",
        content: toolResults,
      });

      continue; // 次のイテレーションへ
    }

    // 会話終了
    if (response.stopReason === "end_turn") {
      console.log("\n=== Final Response ===");
      const finalContent = response.output?.message?.content || [];
      for (const block of finalContent) {
        if ("text" in block && block.text) {
          console.log(block.text);
        }
      }
      break;
    }

    // その他の終了理由
    console.log("Stopping due to:", response.stopReason);
    break;
  }

  // クリーンアップ
  await mcpClient.close();
};

main().catch(console.error);

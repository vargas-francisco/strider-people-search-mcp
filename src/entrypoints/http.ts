import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { loadConfig } from '../config.js';
import { createRuntime, Runtime } from '../runtime.js';
import { listResources, listPrompts, listTools } from '../registry.js';
import { createLogger } from '../logger.js';

export const extractBearer = (header: string | undefined): string | null => {
  if (!header) return null;
  const match = /^bearer\s+(.+)$/i.exec(header.trim());
  return match ? (match[1] ?? null) : null;
};

const buildServer = (runtime: Runtime): Server => {
  const tools = listTools();
  const resources = listResources();
  const prompts = listPrompts();

  const server = new Server(
    { name: 'strider-people-search', version: '0.1.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: z.toJSONSchema(t.inputSchema, { target: 'draft-7' }),
    })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = tools.find((t) => t.name === req.params.name);
    if (!tool) throw new Error(`unknown tool ${req.params.name}`);
    const result = await tool.handler(req.params.arguments ?? {}, runtime);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  });
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    })),
  }));
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const r = resources.find((x) => x.uri === req.params.uri);
    if (!r) throw new Error(`unknown resource ${req.params.uri}`);
    return { contents: [{ uri: r.uri, mimeType: r.mimeType, text: r.contents }] };
  });
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: prompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  }));
  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    const p = prompts.find((x) => x.name === req.params.name);
    if (!p) throw new Error(`unknown prompt ${req.params.name}`);
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: p.render((req.params.arguments ?? {}) as Record<string, string>),
          },
        },
      ],
    };
  });

  return server;
};

const main = async (): Promise<void> => {
  const config = loadConfig();
  const logger = createLogger({ logLevel: config.logLevel });
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, name: 'strider-people-search-mcp', version: '0.1.0' });
  });

  app.all('/mcp', async (req: Request, res: Response) => {
    const token = extractBearer(req.headers.authorization);
    if (!token) {
      res.status(401).json({
        error: 'auth_denied',
        message:
          'missing Authorization: Bearer <strider-auth0-jwt>. See docs://privacy for how to obtain one.',
      });
      return;
    }
    const runtime = createRuntime({ token, config });
    const server = buildServer(runtime);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.listen(config.httpPort, () => {
    logger.info({ port: config.httpPort }, 'mcp http listening');
  });
};

if (process.argv[1]?.includes('http.')) {
  main().catch((e) => {
    process.stderr.write(`fatal: ${(e as Error).stack ?? e}\n`);
    process.exit(1);
  });
}

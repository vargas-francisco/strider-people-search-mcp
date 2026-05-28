#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
import { resolveToken } from '../client/auth.js';
import { createRuntime } from '../runtime.js';
import { listTools, listResources, listPrompts } from '../registry.js';

const main = async (): Promise<void> => {
  const config = loadConfig();
  const token = await resolveToken({
    explicitToken: config.auth0Token,
    clientId: config.auth0ClientId,
    clientSecret: config.auth0ClientSecret,
    audience: config.auth0Audience,
    tokenUrl: config.auth0TokenUrl,
  });
  const runtime = createRuntime({ token, config });
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
    const resource = resources.find((r) => r.uri === req.params.uri);
    if (!resource) throw new Error(`unknown resource ${req.params.uri}`);
    return {
      contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.contents }],
    };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: prompts.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    const prompt = prompts.find((p) => p.name === req.params.name);
    if (!prompt) throw new Error(`unknown prompt ${req.params.name}`);
    const rendered = prompt.render((req.params.arguments ?? {}) as Record<string, string>);
    return {
      messages: [{ role: 'user', content: { type: 'text', text: rendered } }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // server keeps running until stdin closes
};

main().catch((e) => {
  process.stderr.write(`fatal: ${(e as Error).stack ?? e}\n`);
  process.exit(1);
});

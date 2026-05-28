import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { listTools } from '../../src/registry.js';

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface ModelInvocation {
  provider: 'claude' | 'openai';
  prompt: string;
  modelId?: string;
}

const toolDefs = (): { claude: Anthropic.Tool[]; openai: OpenAI.ChatCompletionTool[] } => {
  const tools = listTools();
  const claude: Anthropic.Tool[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: z.toJSONSchema(t.inputSchema, {
      target: 'draft-7',
    }) as unknown as Anthropic.Tool['input_schema'],
  }));
  const openai: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: z.toJSONSchema(t.inputSchema, { target: 'draft-7' }) as Record<string, unknown>,
    },
  }));
  return { claude, openai };
};

export const askClaude = async (
  prompt: string,
  modelId = 'claude-sonnet-4-5-20250929',
): Promise<ToolCall | null> => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { claude } = toolDefs();
  const res = await client.messages.create({
    model: modelId,
    max_tokens: 1024,
    tools: claude,
    messages: [{ role: 'user', content: prompt }],
  });
  for (const block of res.content) {
    if (block.type === 'tool_use') {
      return { name: block.name, input: block.input as Record<string, unknown> };
    }
  }
  return null;
};

export const askOpenAI = async (
  prompt: string,
  modelId = 'gpt-4.1',
): Promise<ToolCall | null> => {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { openai } = toolDefs();
  const res = await client.chat.completions.create({
    model: modelId,
    tools: openai,
    messages: [{ role: 'user', content: prompt }],
  });
  const choice = res.choices[0];
  const call = choice?.message.tool_calls?.[0];
  if (!call || call.type !== 'function') return null;
  return { name: call.function.name, input: JSON.parse(call.function.arguments) };
};

export const ask = async (inv: ModelInvocation): Promise<ToolCall | null> =>
  inv.provider === 'claude'
    ? askClaude(inv.prompt, inv.modelId)
    : askOpenAI(inv.prompt, inv.modelId);

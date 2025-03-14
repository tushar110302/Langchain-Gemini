import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv/config';
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 2,
})

// const input = 'Explain how AI works';
// const generate = async () => {
//     try {
//         const result = await llm.invoke(input)
//         console.log(result.content)

//     } catch (error) {
//         console.log(error)
//     }
// }

// generate()

const multiply = tool(
    async ({ a, b }) => {
      return a * b;
    },
    {
      name: "multiply",
      description: "multiplies two numbers together",
      schema: z.object({
        a: z.number("the first number"),
        b: z.number("the second number"),
      }),
    }
);
const add = tool(
    async ({ a, b }) => {
      return a + b;
    },
    {
      name: "add",
      description: "adds two numbers together",
      schema: z.object({
        a: z.number("the first number"),
        b: z.number("the second number"),
      }),
    }
);
const divide = tool(
    async ({ a, b }) => {
      return a / b;
    },
    {
      name: "divide",
      description: "divides two numbers together",
      schema: z.object({
        a: z.number("the first number"),
        b: z.number("the second number"),
      }),
    }
);
// Augment the LLM with tools
const tools = [add, multiply, divide];
const llmWithTools = llm.bindTools(tools);


async function llmCall(state) {
    // LLM decides whether to call a tool or not
    const result = await llmWithTools.invoke([
      {
        role: "system",
        content: "You are a helpful assistant tasked with performing arithmetic on a set of inputs."
      },
      ...state.messages
    ]);
  
    return {
      messages: [result]
    };
}

const toolNode = new ToolNode(tools);

// Conditional edge function to route to the tool node or end
function shouldContinue(state) {
    const messages = state.messages;
    const lastMessage = messages.at(-1);
  
    // If the LLM makes a tool call, then perform an action
    if (lastMessage?.tool_calls?.length) {
      return "Action";
    }
    // Otherwise, we stop (reply to the user)
    return "__end__";
}

const agentBuilder = new StateGraph(MessagesAnnotation)
    .addNode("llmCall", llmCall)
    .addNode("tools", toolNode)
    // Add edges to connect nodes
    .addEdge("__start__", "llmCall")
    .addConditionalEdges(
    "llmCall",
    shouldContinue,
    {
        // Name returned by shouldContinue : Name of next node to visit
        "Action": "tools",
        "__end__": "__end__",
    }
    )
    .addEdge("tools", "llmCall")
    .compile();

// Invoke
const messages = [{
    role: "user",
    content: "Add 64 and 36 then divide that by 2 and then multiply that by 3."
}];
const result = await agentBuilder.invoke({ messages });
console.log(result.messages);
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from 'dotenv/config'
const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY,
    maxRetries: 2,
})

const input = 'Explain how AI works';
const generate = async () => {
    try {
        const result = await llm.invoke(input)
        console.log(result.content)

    } catch (error) {
        console.log(error)
    }
}

generate()
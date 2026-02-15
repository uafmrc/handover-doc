import { ChatOllama } from '@langchain/ollama';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export type BrainModel = ChatOllama | ChatAnthropic | ChatOpenAI | ChatGoogleGenerativeAI;

export enum BrainTypeEnum {
    Anthropic = 'anthropic',
    Ollama = 'ollama',
    OpenAI = 'openai',
    Google = 'google'
}

export type BrainType = "anthropic" | "ollama" | "openai" | "google"
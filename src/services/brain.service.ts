import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { PROMPT_CODE_SNIPPET, PROMPT_SUMMARY } from '../helpers/prompt.helpers';
import { BrainModel, BrainType, BrainTypeEnum } from '../models/brain.model';
import { IConfig } from '../models/config.model';
import { IFileAnalysis } from '../models/file-analysis.model';
import { ILLMAnalysis } from '../models/llm-analysis.model';
import { DEFAULT_OLLAMA_HOST, DEFAULT_OLLAMA_MODEL } from '../models/ollama.model';
import { OllamaChecker } from './checker-ollama/ollama-manager';
import { i18n } from './i18n.service';

export class BrainService {
    private readonly brain:BrainModel;
    private readonly model: string;
    private readonly apiKey?: string;
    private readonly baseUrl?:string;
    private readonly outputLanguage:string = 'English';


    constructor(config:IConfig) {
        this.model = config.llmModel;
        this.apiKey = config.llmKey;
        this.outputLanguage = config.languageDoc.toLowerCase().startsWith('it') ? 'Italian' : 'English';
        this.baseUrl = config.llmBaseUrl;
        if(!config.llmModel) {
            throw new Error(i18n.t('brain.invalidModel'));
        }

        const new_brain = this.loadType(config.llmProvider);
        if(!new_brain) {
            throw new Error(i18n.t('brain.invalidType'));
        }
        this.brain = new_brain;
    }


    async analyzeFile(file: IFileAnalysis): Promise<ILLMAnalysis> {
        const prompt = this.buildAnalysisPrompt(file);

        try {
            this.brain.temperature = .3;
            const response = await this.brain.pipe(new StringOutputParser()).invoke([new HumanMessage(prompt)]);
            return this.parseAnalysisResponse(response, file.relativePath);
        } catch (error) {
            console.error(i18n.t('brain.analyzeError', { path: file.relativePath }), error);
            return this.getFallbackAnalysis(file);
        }
    }

    async generateProjectSummary(projectName: string, filesAnalysis: ILLMAnalysis[], architecture: any): Promise<string> {
        const prompt = PROMPT_SUMMARY(projectName, filesAnalysis, architecture, this.outputLanguage); 
    
        try {
            this.brain.temperature = .5;
            const response = await this.brain.pipe(new StringOutputParser()).invoke([new HumanMessage(prompt)]);
            return response ?? i18n.t('brain.summaryNotAvailable');
        } catch (error) {
            console.error(i18n.t('brain.genSummaryError'), error);
            return i18n.t('brain.genSummaryErrorMsg');
        }
    }

    async analyzeBatch(files: IFileAnalysis[], onProgress:Function): Promise<ILLMAnalysis[]> {
        const analyses: ILLMAnalysis[] = [];
        const batchSize = 10;

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(file => this.analyzeFile(file));
            
            const batchResults = await Promise.all(batchPromises);
            analyses.push(...batchResults);
            onProgress(Math.min(i + batchSize, files.length), files.length);

            if (i + batchSize < files.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return analyses;
    }

    async checkHealth(config:IConfig): Promise<boolean> {
        try {
            if(!(this.brain instanceof ChatOllama)) return true;
            const ollama = new OllamaChecker(config, { model: this.model ?? DEFAULT_OLLAMA_MODEL });
            await ollama.initialize(config);
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }


    private parseAnalysisResponse(response: string, filePath: string): ILLMAnalysis {
        try {
            const jsonMatch = /\{[\s\S]*\}/.exec(response);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    filePath,
                    summary: parsed.summary || i18n.t('brain.analysisNotAvailable'),
                    purpose: parsed.purpose || i18n.t('brain.purposeNotDetermined'),
                    keyFunctions: parsed.keyFunctions || [],
                    improvements: parsed.improvements || [],
                    dependencies: parsed.dependencies || i18n.t('brain.noDependencies'),
                    complexity: parsed.complexity || 'medium',
                    qualityScore: typeof parsed.qualityScore === 'number' ? parsed.qualityScore : 7
                };
            }
        } catch (error) {
            console.error(i18n.t('brain.parseError'), error);
        }

        return {
            filePath,
            summary: response.substring(0, 200),
            purpose: i18n.t('brain.autoAnalysisNotAvailable'),
            keyFunctions: [],
            improvements: [],
            dependencies: i18n.t('brain.notAnalyzed'),
            complexity: 'medium'
        };
    }

    private getFallbackAnalysis(file: IFileAnalysis): ILLMAnalysis {
        return {
            filePath: file.relativePath,
            summary: i18n.t('brain.fallbackSummary', { 
                language: file.language, 
                functions: file.functions.length, 
                classes: file.classes.length 
            }),
            purpose: i18n.t('brain.autoAnalysisNotAvailable'),
            keyFunctions: file.functions.slice(0, 3).map(f => ({
                name: f.name,
                explanation: i18n.t('brain.functionExplanation', { 
                    type: f.isAsync ? i18n.t('brain.async') : i18n.t('brain.sync'),
                    params: f.params.length
                }),
                usage: i18n.t('brain.manualDoc')
            })),
            improvements: [i18n.t('brain.fullAnalysisNotAvailable')],
            dependencies: i18n.t('brain.notAnalyzed'),
            complexity: 'medium'
        };
    }


    private buildAnalysisPrompt(file: IFileAnalysis): string {
        const functionsInfo = file.functions.map(f => 
        `- ${f.name}(${f.params.join(', ')})${f.isAsync ? ' [async]' : ''} - line ${f.line}`
        ).join('\n');

        const classesInfo = file.classes.map(c => 
        `- ${c.name} (${c.methods.length} methods, ${c.properties.length} properties) - line ${c.line}`
        ).join('\n');

        const importsInfo = file.imports.map(i => 
        `- from '${i.source}': ${i.imports.join(', ')}`
        ).join('\n');

        const codeSnippet = file.content;

        return PROMPT_CODE_SNIPPET(file, functionsInfo, classesInfo, importsInfo, codeSnippet, this.outputLanguage);
    }

    private loadType(llmType:BrainType) {
        switch(llmType) {
            case BrainTypeEnum.Ollama:
                return new ChatOllama({
                    streaming: false,
                    model: this.model,
                    baseUrl: this.baseUrl ?? DEFAULT_OLLAMA_HOST,
                    temperature: .3,
                    topP: .9
                });
            case BrainTypeEnum.OpenAI:
                return new ChatOpenAI({
                    streaming: false,
                    apiKey: this.apiKey,
                    modalities: ['text'],
                    model: this.model,
                    temperature: .3,
                    topP: .9
                });
            case BrainTypeEnum.Anthropic:
                return new ChatAnthropic({
                    streaming: false,
                    apiKey: this.apiKey,
                    model: this.model,
                    temperature: .3,
                    topP: .9
                });
            case BrainTypeEnum.Google:
                return new ChatGoogleGenerativeAI({
                    streaming: false,
                    apiKey: this.apiKey,
                    model: this.model,
                    temperature: .3,
                    topP: .9
                });
            default:
                return undefined;
        }
    }
}
import { IFileAnalysis } from "../models/file-analysis.model";
import { ILLMAnalysis } from "../models/llm-analysis.model";

export const PROMPT_SUMMARY = (projectName: string, filesAnalysis: ILLMAnalysis[], architecture: any, language:string) => `
Analyze this software project and generate an executive summary for the project handover.

Project: ${projectName}

Detected Architecture:
- Entry points: ${architecture.entryPoints.join(', ')}
- Patterns: ${architecture.patterns.join(', ')}
- Identified layers: ${architecture.layers.map((l: any) => l.name).join(', ')}

Create a thorough report that goes beyond a simple summary. Your output must include detailed sections for the following:

1. **Overall Project Purpose:** Explain the core functionality, business logic, and the main problem this software solves.
2. **Deep Dive into Architecture & Structure:** Detail how the application is structured. Explain the identified layers, how data flows between them, and how the entry points initialize the application.
3. **Technologies & Patterns Analysis:** Discuss the identified patterns and technologies. Explain *where* and *why* they are used within the codebase.
4. **Analysis of Core Components:** Based on the analyzed files, describe the most critical modules or components and their responsibilities.
5. **Key Considerations & Risks (Onboarding):** Highlight specific technical debt, complex logic, or critical areas that a new developer or incoming team must be aware of before touching the code.
6. **Maintenance & Scaling Recommendations:** Provide actionable advice for future maintenance, potential performance bottlenecks, and architectural improvements.

**Formatting & Style Instructions:**
- Write a comprehensive, multi-paragraph response for each section. Avoid brief or superficial bullet points.
- Use clean Markdown formatting (H2 and H3 headers, bold text for emphasis).

Write in ${language}, maintaining a highly professional, authoritative, yet accessible technical tone. Provide enough detail so that a new developer could use this document to start contributing immediately.
`;


export const PROMPT_CODE_SNIPPET = (file: IFileAnalysis, functionsInfo: string, classesInfo: string, importsInfo: string, codeSnippet: string, language:string)  => `
You are an expert Software Engineer generating technical handover documentation. Analyze the provided TypeScript/JavaScript file based on the metadata and code snippet below.

File: ${file.relativePath}
Language: ${file.language}
Lines of code: ${file.size}

Detected functions:
${functionsInfo || 'No exported functions'}

Detected classes:
${classesInfo || 'No classes'}

Imports:
${importsInfo || 'No imports'}

Code:
\`\`\`${file.language}
${codeSnippet}
\`\`\`

Provide a structured analysis strictly adhering to the following JSON schema. Do not deviate from this structure. If information for a specific field is unavailable, use null for strings or an empty array [] for lists. Do not invent information.

CRITICAL: All descriptive text values within the JSON must be written exclusively in ${language}. The JSON keys must remain exactly as specified below in English.

\`\`\`json
{{
    "summary": "Short description (2-3 sentences) of what this file does",
    "purpose": "Main purpose of the file within the overall project architecture",
    "keyFunctions": [
        {
            "name": "function_name",
            "explanation": "Technical explanation of what this function does and its importance",
            "usage": "Expected context of how and when it is used"
        }
    ],
    "improvements": ["Actionable refactoring suggestion 1", "Actionable refactoring suggestion 2"],
    "dependencies": "Description of the main external/internal dependencies and their architectural role",
    "complexity": "low" | "medium" | "high",
    "qualityScore": <number between 1 and 10>
}}
\`\`\`

CRITICAL INSTRUCTION: Output EXCLUSIVELY valid, raw JSON. Do NOT wrap the output in markdown code blocks (e.g., do not use \`\`\`json). Do NOT add any conversational text, greetings, or explanations before or after the JSON object.

`;
// These prompt templates are used for story generation

export const CHAPTER_OUTLINE_PROMPT = `
You're a narrative architect. Given the following story state, produce:

1. **Chapter Goals** (3 bullet points: ONLY what can happen in THIS SINGLE CHAPTER)
2. **Scene Beats** (EXACTLY 3 numbered beats for THIS CHAPTER ONLY; each ~1–2 sentences)
3. **Mini‐Synopsis** (1 short paragraph) that accurately links the user's decision to these beats

Title: {{title}}
World/Setting: {{worldName}}
World Description: {{worldDescription}}
Mood & Tropes: {{moodAndTropes}}
Premise: {{premise}}
{{#advancedOptions}}Advanced Options: {{advancedOptions}}{{/advancedOptions}}
Total Chapters: {{totalChapters}}
Current Chapter: {{chapterNumber}}
{{#previousText}}Previous Excerpt: {{previousText}}{{/previousText}}
{{#userDecision}}User Decision: {{userDecision}}{{/userDecision}}
{{#longTermMemory}}Long-term Memory (Earlier Chapters): {{longTermMemory}}{{/longTermMemory}}
{{#recentMemory}}Recent Memory (Previous Chapter): {{recentMemory}}{{/recentMemory}}
{{#userFeedback}}User Feedback (Use this to improve): {{userFeedback}}{{/userFeedback}}

CRITICAL CONSTRAINTS:
- Generate content ONLY for Chapter {{chapterNumber}} - not the entire story arc
- WRONG GOALS (too ambitious): "Character becomes richest person alive," "Character masters all technologies," "Character changes the world"
- RIGHT GOALS (chapter-appropriate): "Character discovers a hidden ability," "Character faces first challenge at school," "Character meets an important mentor"
- DO NOT outline the entire narrative arc - focus ONLY on immediate next developments
- For Chapter 1 specifically:
  * Introduce the main character - their personality, background, current situation
  * Establish the immediate setting - where they are, what it looks like, how it feels
  * Plant initial seeds of the premise - subtle hints, not major revelations
  * NO major accomplishments, breakthroughs, or world-changing events
  * DO NOT introduce the entire premise or give the character their full powers/abilities

CRITICAL PACING GUIDELINES:
- Early chapters (first 10%): Introduction, world-building, establishing characters
- Middle chapters: Gradually develop story, abilities, and relationships
- Later chapters: Build toward climax and resolution
- STRICTLY avoid introducing major developments too early
- Match pace to current chapter number ({{chapterNumber}}/{{totalChapters}})

Return your response in this JSON format ONLY (no additional text or explanation):

{
	"goals": ["<goal 1 for THIS CHAPTER ONLY>", "<goal 2 for THIS CHAPTER ONLY>", "<goal 3 for THIS CHAPTER ONLY>"],
	"beats": [
		{ "beat": 1, "description": "..." },
		{ "beat": 2, "description": "..." },
		{ "beat": 3, "description": "..." }
	],
	"synopsis": "..."
}

DO NOT include any formatting, explanation, or text outside of the JSON structure.
DO NOT outline the entire story arc - focus ONLY on what happens in THIS SPECIFIC CHAPTER.
`;

export const NARRATIVE_PROMPT = `
You're now the Chapter {{chapterNumber}} writer of a {{totalChapters}}-chapter story. Here's your outline:

Title: {{title}}
World/Setting: {{worldName}}
World Description: {{worldDescription}}
Mood & Tropes: {{moodAndTropes}}
Premise: {{premise}}
{{#advancedOptions}}Advanced Options: {{advancedOptions}}{{/advancedOptions}}
{{#previousText}}Context from previous section: {{previousText}}{{/previousText}}
{{#userDecision}}User's previous decision: {{userDecision}}{{/userDecision}}
{{#longTermMemory}}Long-term Memory (Earlier Chapters): {{longTermMemory}}{{/longTermMemory}}
{{#recentMemory}}Recent Memory (Previous Chapter): {{recentMemory}}{{/recentMemory}}
{{#userFeedback}}User Feedback (Use this to improve): {{userFeedback}}{{/userFeedback}}

Chapter Outline:
Goals: {{goals}}
Beats:
{{beats}}
Synopsis: {{synopsis}}

CRITICAL CONSTRAINTS:
- Write EXACTLY 1500-2000 words of rich, immersive story content
- Include DETAILED descriptions of environments, characters, emotions, and sensory details
- Follow the outline's goals and beats exactly
- Include meaningful character development and dialogue
- Balance atmosphere building with plot advancement
- Always treat the user as the main character (MC)
- Explore each beat in substantial detail with multiple paragraphs
- ALWAYS end with a direct decision point and question for the user
- The final paragraph MUST end with a direct question like "What do you do?", "What's your next move?", or "How do you respond?"
- NEVER end a chapter with just statements or observations - ALWAYS end with a question requiring a decision
- DO NOT provide any options or choices - let the user freely decide their next action
- DO NOT include any chapter titles, chapter numbers, headings, or formatting
- DO NOT use the word "chapter" unless it's part of the actual story dialogue/content
- DO NOT include meta-text like "Generating Narrative:" or instructions
- Return ONLY the narrative content with no extra text or explanations
- Start directly with the story content

EXAMPLES:
BAD ENDING (DO NOT DO THIS): "He knew that his life was about to change in ways he couldn't even begin to imagine. Little did he know, this was just the beginning of his journey."
GOOD ENDING (DO THIS): "The mysterious note sits in your hand, its contents potentially life-changing. The address is only a few blocks away. Do you go there now to confront whatever awaits, or take time to prepare yourself first? What do you do?"

WRITING STYLE:
- Use vivid, sensory language that puts the reader in the scene
- Vary sentence structure and length to create rhythm
- Include both action and reflection
- Use dialogue to reveal character and advance plot
- Create emotional resonance through character development
- Maintain consistent perspective (second-person)

PACING GUIDELINES:
- This is chapter {{chapterNumber}} out of {{totalChapters}} total chapters
- In the first 10% of chapters: Introduce characters, establish setting, begin building the world
- In the middle 80% of chapters: Gradually develop conflicts, relationships, and abilities
- In the final 10% of chapters: Build toward resolution and conclusion
- Be realistic about what can happen in a single chapter at this point in the story

Remember to properly pace this chapter given its position ({{chapterNumber}}/{{totalChapters}}) in the overall story arc.
You MUST write at least 1500 words for this chapter section. This is critical for reader immersion.
`;

export const DECISION_EVALUATION_PROMPT = `
Evaluate the following user decision in the context of the ongoing story:

Story Context: {{title}} set in {{worldName}}
Premise: {{premise}}
User Decision: {{userDecision}}

Analyze the decision and provide:
1. A brief assessment of why this decision is appropriate or problematic in the context of the story's premise and world
2. One of these judgments:
   - CONTINUE: The decision is valid and the story should continue
   - UNSAFE: The decision contains inappropriate, harmful, or offensive content
   - CONCLUDE: The decision naturally concludes this storyline (but doesn't end the entire saga)
   - CLARIFY: The decision is too vague or unclear to progress meaningfully

If UNSAFE or CONCLUDE, also provide a brief explanation of why this timeline ends.
If CLARIFY, suggest what additional details would help clarify the decision.

Format your response as:
JUDGMENT: [CONTINUE/UNSAFE/CONCLUDE/CLARIFY]
EXPLANATION: [Your explanation here]
`;

// Add a new prompt for memory summarization
export const MEMORY_SUMMARIZATION_PROMPT = `
Summarize the following story summaries into a concise, coherent memory of past events:

{{summaries}}

Create a single paragraph (150 words max) that captures the essential narrative details from these summaries.
Focus on main plot points, character development, and important decisions.
Write in past tense, third person perspective.
`;

// Helper function to fill in template with values
export function fillPromptTemplate(template: string, values: Record<string, string | undefined>): string {
	let filledTemplate = template;

	// Replace simple {{tag}} placeholders
	Object.entries(values).forEach(([key, value]) => {
		if (value !== undefined) {
			const regex = new RegExp(`{{${key}}}`, 'g');
			filledTemplate = filledTemplate.replace(regex, value);
		}
	});

	// Handle conditional blocks {{#tag}}content{{/tag}}
	Object.entries(values).forEach(([key, value]) => {
		if (!value) {
			// If value is empty/undefined, remove the conditional block
			const conditionalRegex = new RegExp(`{{#${key}}}.*?{{/${key}}}`, 'gs');
			filledTemplate = filledTemplate.replace(conditionalRegex, '');
		} else {
			// If value exists, remove just the tags
			const startTagRegex = new RegExp(`{{#${key}}}`, 'g');
			const endTagRegex = new RegExp(`{{/${key}}}`, 'g');
			filledTemplate = filledTemplate.replace(startTagRegex, '');
			filledTemplate = filledTemplate.replace(endTagRegex, '');
		}
	});

	return filledTemplate.trim();
}
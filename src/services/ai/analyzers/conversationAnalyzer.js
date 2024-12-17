const { Anthropic } = require('@anthropic-ai/sdk');
const logger = require('../../../utils/logger');
const { buildAnalysisPrompt } = require('../prompts/conversationPrompts');

class ConversationAnalyzer {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    async analyzeConversation(conversationHistory) {
        logger.info('Analyzing a conversation:');

        const response = await this.client.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 150,
            messages: [{ 
                role: 'user', 
                content: buildAnalysisPrompt(conversationHistory)
            }]
        });

        return {
            instructions: response.content[0].text.replace(/<instructions>/g, '').replace(/<\/instructions>/g, ''),
        };
    }
}

module.exports = new ConversationAnalyzer(); 
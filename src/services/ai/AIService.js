const { Anthropic } = require('@anthropic-ai/sdk');
const logger = require('../../utils/logger');
const toolDefinitions = require('./tools/toolDefinitions');
const toolHandler = require('./tools/toolHandler');
const conversationAnalyzer = require('./analyzers/conversationAnalyzer');
const { buildFirstContactPrompt, buildResponsePrompt } = require('./prompts/systemPrompts');

class AIService {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.tools = toolDefinitions;
    }

    async generateFirstContactMessage(customerInfo) {
        try {
            const systemPrompt = buildFirstContactPrompt(customerInfo);
            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 150,
                messages: [{ role: 'user', content: systemPrompt }]
            });

            return response.content[0]?.text;
        } catch (error) {
            logger.error('Error generating first response:', error);
            return `Hi ${customerInfo.name}! We received your repair request for your ${customerInfo.phoneModel} regarding ${customerInfo.issue}. Is this correct?`;
        }
    }

    async generateResponse(messageContent, customerInfo, instructions) {
        try {
            const messages = [{
                role: 'user',
                content: buildResponsePrompt(messageContent, customerInfo, instructions)
            }];

            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 200,
                tools: this.tools,
                messages: messages
            });

            return await toolHandler.handleResponse(response, messages);
        } catch (error) {
            logger.error('Error generating AI response:', error);
            return {
                content: "Sorry, I'm having trouble right now. Please call us at (555) 123-4567 for immediate assistance."
            };
        }
    }
}

module.exports = new AIService(); 
const { Anthropic } = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        this.storeInfo = `
            name: Mobile klinik,
            address: 1100 Boul maloney Ouest,
            phone: (555) 123-4567,
            website: www.mobileklinik.com,
            hours: Mon-wed 10AM-6PM, Thu 10AM-9PM, Fri 10AM-9PM, Sat 10AM-6PM, Sun 10AM-5PM,
            priceList: 
            - Screen repair:
            Iphone 8: $119
            Iphone 11: $139
            Iphone 12: $149
            Iphone 13: $159
            Iphone 14: $199

            samsung s series : 
            S20: $249
            S21: $249
            S22: $249
            S23: $289
            A51: $199
            A52: $219


            - Battery replacement:
            Iphone 8: $59
            Iphone 11: $99
            Iphone 12: $99
            Iphone 13: $129
            Iphone 14: $149

            samsung s series : 
            S20: $149
            S21: $149
            S22: $149
            S23: $199
            A51: $129
            A52: $149


            - Water damage repair:
            Not covered for any model 

            - Other repairs:
            Charger port repair:
            iphones : not covered
            Samsungs : 
            only s20, s21, s22, s23, a51, a52, at : 139$
        `;
    }

      /**
     * Generate first message to new lead
     */
      async generateFirstContactMessage(customerInfo) {
        try {
            const { name, phoneModel, issue } = customerInfo;

            const systemPrompt = `You are a phone repair store SMS assistant initiating first contact.

                                    Customer Information to Confirm:
                                    - Name: ${name}
                                    - Phone Model: ${phoneModel}
                                    - Issue: ${issue}

                                    KEY GUIDELINES:
                                    - Start with a warm greeting using ${name}'s name
                                    - Mention their ${phoneModel} and the reported ${issue}
                                    - Ask them to confirm if these details are correct
                                    - DO NOT mention price yet
                                    - Keep response under 160 characters
                                    - End with a clear yes/no question

                                    EXAMPLE FORMAT (but be more natural):
                                    "Hi [name]! We received your repair request for your [phone] regarding [issue]. Is this correct?"

                                 Generate a friendly, professional first message:`;

            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 150,
                messages: [{ role: 'user', content: systemPrompt }]
            });

            const cleanedResponse = response.content;

            logger.info('First ai outbound message generated successfully:', {
                originalLength: response.content[0]?.text?.length,
                cleanedLength: cleanedResponse.length
            });

            return cleanedResponse;

        } catch (error) {
            logger.error('Error generating first response:', error);
            return `Hi ${customerInfo.name}! We received your repair request for your ${customerInfo.phoneModel} regarding ${customerInfo.issue}. Is this correct?`;
        }
    }


    /**
     * Format conversation history for optimal context
     * @private
     */
    _formatHistory(conversationHistory) {
        return conversationHistory
            .slice(-3) // Keep only last 3 messages for context
            .map(msg => `${msg.direction === 'inbound' ? 'Customer' : 'Assistant'}: ${msg.content}`)
            .join('\n');
    }

    /**
     * Get system prompt based on conversation state
     * @private
     */
    _getSystemPrompt(formattedHistory,customerInfo) {
        const { name, phoneModel, issue } = customerInfo;
        `You are a phone repair store SMS assistant. Keep all responses under 160 characters and maintain a friendly, professional tone.`;

        `

You are initiating first contact with a potential customer.

Customer Information to Confirm:
- Name: ${name}
- Phone Model: ${phoneModel}
- Issue: ${issue}

KEY GUIDELINES:
- Start with a warm greeting using ${name}'s name
- Mention their ${phoneModel} and the reported ${issue}
- Ask them to confirm if these details are correct
- DO NOT mention price yet
- End with a clear yes/no question

EXAMPLE FORMAT (but be more natural):
"Hi [name]! We received your repair request for your [phone] regarding [issue]. Is this correct?"`,

    `

Customer needs to confirm or correct their information.

Current Information:
- Name: ${name}
- Phone Model: ${phoneModel}
- Issue: ${issue}

KEY GUIDELINES:
- If they say NO: Ask specifically what needs to be corrected
- If unclear: Ask for clarification about which detail is incorrect
- Keep focus on confirming details
- DO NOT mention pricing yet
- End with a question

EXAMPLE RESPONSES:
- For unclear response: "I want to make sure we have your details right. Can you confirm if your ${phoneModel} needs ${issue} repair?"
- For correction: "Please let me know which information needs to be corrected."`,

             `

Customer has confirmed their information. Time to provide pricing.

Confirmed Information:
- Phone Model: ${phoneModel}
- Issue: ${issue}
- Price Range: ALWAYS refer to the price list !!!

KEY GUIDELINES:
- Thank them for confirming
- Provide clear pricing information
- Ask if they'd like to schedule a repair
- Mention same-day service availability if relevant
- End with a question about scheduling

EXAMPLE FORMAT:
"Thanks for confirming! For ${phoneModel} ${issue}, our service cost is [price]. Would you like to schedule a repair?"`,

          `

Customer is interested in scheduling a repair.

Service Details:
- Service: ${issue} repair for ${phoneModel}
- Available Hours: Mon-Sat 9AM-7PM
- Same-day service available (+$30)

KEY GUIDELINES:
- Ask for preferred day and time
- Mention our available hours
- Offer same-day service option
- Keep scheduling options clear
- End with a specific question about timing

EXAMPLE FORMAT:
"We can repair your ${phoneModel} Mon-Sat, 9AM-7PM. Same-day service is also available. What day/time works best for you?"`,

            `

Customer indicated information needs correction.

Current Information:
- Phone Model: ${phoneModel}
- Issue: ${issue}

KEY GUIDELINES:
- Show understanding of the need for correction
- Ask specifically what needs to be updated
- Keep questions simple and clear
- Focus on one correction at a time
- End with a specific question

EXAMPLE FORMAT:
"I apologize for the confusion. Please let me know which information needs to be corrected: the phone model (${phoneModel}) or the issue (${issue})?"`,

         `

Customer has provided preferred appointment time.

Service Details:
- Service: ${issue} repair for ${phoneModel}
- Price: ALWAYS refer to the price list !!!

KEY GUIDELINES:
- Confirm the suggested appointment time
- Mention repair duration if known
- Ask for final confirmation
- Provide address if confirmed
- End with a clear yes/no question

EXAMPLE FORMAT:
"Would you like me to confirm your appointment for [suggested_time]? The repair should take about [duration]."`,

            `$

Appointment has been confirmed.

Appointment Details:
- Service: ${issue} repair for ${phoneModel}
- Location: [store_address]

KEY GUIDELINES:
- Thank them for choosing your service
- Confirm all appointment details
- Provide store address
- Include any preparation instructions
- End with a positive closing

EXAMPLE FORMAT:
"Great! Your appointment is confirmed for [time]. We're located at [address]. Please bring your ${phoneModel} and any relevant passwords."`,

         `

Here is the conversation history:
${formattedHistory}
Based on the conversation history, give an answer to the last incoming message`;
    }

  
    /**
     * Generate AI response based on conversation history
     */
    // needs improvement ! 
    async generateResponse(messageContent, conversationHistory = [], customerInfo) {
        try {
            const formattedHistory = this._formatHistory(conversationHistory);

            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 150,
                messages: [{ role: 'user', content: 
                    `You are a phone repair store SMS assistant. Your task is to respond to customer's inbound messages.
                    if customer is asking questions, answer them based on the conversation history ${formattedHistory} and your knowledge of the store that you can find in the ${this.storeInfo}.
                    be friendly and professional use ${customerInfo} to address customer and undersatand his problem.
                    your ultimate goal is to schedule a repair appointment for the customer.
                    note that you should follow these steps:
                    1. greet the customer (if not already done in the conversation history)
                    2. confirm their information (if not already done in the conversation history)
                    3. provide a quote (if not already done in the conversation history)
                    4. schedule an appointment (if not already done in the conversation history)
                    5. confirm the appointment (if not already done in the conversation history)
                    Keep all responses under 160 characters and maintain a friendly, professional tone.`}]
            });

            // Extract the text content from the response
            const cleanedResponse = response.content[0].text;

            logger.info('AI response generated:', {
                responseLength: cleanedResponse.length
            });

            return {
                content: cleanedResponse,
            };

        } catch (error) {
            logger.error('Error generating AI response:', error);
            return {
                content: "Sorry, I'm having trouble right now. Please call us at (555) 123-4567 for immediate assistance.",
            };
        }
    }
}

module.exports = new AIService();
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

        this.objectionHandlingGuide = `
            - Objection handling guide:
            Here are some tools you can use to handle objections:
            - You can offer our Telus and koodo discount wich is 200$ off any repair if they become new Telus or koodo customer. Plans starts at 30$ per month.
        `;

        this.tools = [
            {
                "name": "scheduleAppointment",
                "description": "Schedules a repair appointment for a customer given their phone number, phone model, issue, and preferred time.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "customer_phone": {
                            "type": "string",
                            "description": "Customer's phone number"
                        },
                        "phone_model": {
                            "type": "string",
                            "description": "Customer's phone model"
                        },
                        "issue": {
                            "type": "string",
                            "description": "Description of the repair needed"
                        },
                        "preferred_time": {
                            "type": "string",
                            "description": "Customer's preferred appointment time (ISO 8601 format)"
                        },
                        "store_location": {
                            "type": "string",
                            "description": "Store location identifier"
                        }
                    },
                    "required": ["customer_phone", "phone_model", "issue", "preferred_time"]
                }
            },
            {
                "name": "stopConvo",
                "description": "Stops the conversation and marks it as completed when the repair is out of scope or conversation needs to end",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "customer_phone": {
                            "type": "string",
                            "description": "Customer's phone number"
                        },
                        "reason": {
                            "type": "string",
                            "description": "Reason for stopping the conversation"
                        }
                    },
                    "required": ["customer_phone", "reason"]
                }
            },
            {
                "name": "requestHumanCallback",
                "description": "Requests a human callback for complex situations or when customer specifically asks for human assistance",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "customer_phone": {
                            "type": "string",
                            "description": "Customer's phone number"
                        },
                        "urgency": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                            "description": "Priority level of the callback request"
                        },
                        "reason": {
                            "type": "string",
                            "description": "Reason for requesting human callback"
                        }
                    },
                    "required": ["customer_phone", "urgency", "reason"]
                }
            },
            {
                "name": "updateInfo",
                "description": "Updates customer information when details need to be corrected or modified",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "customer_phone": {
                            "type": "string",
                            "description": "Customer's phone number"
                        },
                        "updates": {
                            "type": "object",
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "Updated customer name"
                                },
                                "phone_model": {
                                    "type": "string",
                                    "description": "Updated phone model"
                                },
                                "issue": {
                                    "type": "string",
                                    "description": "Updated repair issue"
                                }
                            },
                            "description": "Fields to update"
                        },
                        "reason": {
                            "type": "string",
                            "description": "Reason for the information update"
                        }
                    },
                    "required": ["customer_phone", "updates"]
                }
            },
            {
                "name": "updateAppointment",
                "description": "Updates an existing appointment time or details for a customer",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "customer_phone": {
                            "type": "string",
                            "description": "Customer's phone number"
                        },
                        "appointment_id": {
                            "type": "string",
                            "description": "ID of the appointment to update"
                        },
                        "new_time": {
                            "type": "string",
                            "description": "New appointment time (ISO 8601 format)"
                        },
                        "reason": {
                            "type": "string",
                            "description": "Reason for the appointment update"
                        }
                    },
                    "required": ["customer_phone", "new_time"]
                }
            }
        ];
    }

      /**
     * Generate first message to new lead
     */
      async generateFirstContactMessage(customerInfo) {
        try {
            const { name, phoneModel, issue } = customerInfo;

            const systemPrompt = `You are a phone repair store SMS assistant initiating first contact.

                                    Customer Information to Confirm:
                                    - Name: <name>{{${name}}}</name>
                                    - Phone Model: <phoneModel>{{${phoneModel}}}</phoneModel>
                                    - Issue: <issue>{{${issue}}}</issue>

                                    KEY GUIDELINES:
                                    - Start with a warm greeting using <name>{{${name}}}'s</name> name
                                    - Mention their <phoneModel>{{${phoneModel}}}</phoneModel> and the reported <issue>{{${issue}}}</issue>
                                    - Ask them to confirm if these details are correct
                                    - DO NOT mention price yet
                                    - Keep response under 160 characters
                                    - End with a clear yes/no question

                                    EXAMPLE FORMAT (but be more natural):
                                    "Hi {name}! We received your repair request for your {phone} regarding {issue}. Is this correct?"

                                 Generate a friendly, professional first message:`;

            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 150,
                messages: [{ role: 'user', content: systemPrompt }]
            });

            const cleanedResponse = response.content[0]?.text;

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

    async analyzeConversation(conversationHistory) {
        // STEP 1 : ANALYZE CONVERSATION HISTORY 
        // STEP 2 : RETURN RELEVANT INSTRUCTIONS BASED ON ANALYSIS

        logger.info('Analyzing a conversation:');

        const response = await this.client.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 150,
            messages: [{ role: 'user', content: 
                 `You are an expert sales assistant specialized in converting leads into customers. Your task is to analyze a conversation history and provide
                one direct instruction to our conversational ai so it can generate the best next answer possible to the lead.
                Give clear and concise instructions.
                KEY NOTES:
                1-The conversation history is going to be given to you as an array of objects with the message number, content and direction keys.
                  Content is the message and direction is inbound for the lead's messages and outbound for our replies.
                INSTRUCTIONS:
                Give your instruction in one and only one sentence.
                Here is how the conversation should flow:
                  1. We first greet the customer and ask them to confirm the informations we have about them (name, phone model and issue) 
                  at this point the customer is considered to be a lead.
                  2. Next, we provide a quote for the repair and ask the customer to confirm the quote.
                  note: We never provide a quote without a confirmation of the information first.
                  3.1 if the information is incorrect, ask them to confirm their name, phone model and issue
                  3.2 update the customer information in the database in consequence
                  3.3 if the repair is out of scope, inform the customer and stop the conversation flow
                  3.4 in the case of an objection refer to our objection handling guide here : <objectionHandlingGuide>{{${this.objectionHandlingGuide}}}</objectionHandlingGuide>
                  4. If the customer confirms the quote, we can schedule an appointment 
                  5. we should Always confirm the appointment detailswith the lead by a yes or no question  before creating it.

                  examples:
                  - "Customer informations seems incorrect, confirm cutomer's informations"
                  - "Customer is not interested, stop the conversation"
                  - "Customer has an objection, refer to our objection handling guide"
                  - "Customer wants to change his appointment time, update the appointment time"
                  - "Customer wants to schedule an appointment, schedule an appointment at his preferred time"
                 Here is the conversation history: 
                 <conversationHistory>{{${JSON.stringify(conversationHistory)}}}</conversationHistory>
                 Put your instructions in <instructions> XML tags.
                 `
             }]
        });

        return {
            instructions: response.content[0].text.replace(/<instructions>/g, '').replace(/<\/instructions>/g, ''),
        }
    }


    // this is what the ai will use to call the tools
    async processToolCall(toolName, toolInput) {
        switch(toolName) {
            case "scheduleAppointment":
                try {
                    // Simulate appointment scheduling
                    const appointment = {
                        id: `APT-${Date.now()}`,
                        ...toolInput,
                        status: "confirmed",
                        created_at: new Date().toISOString()
                    };
                    
                    // In a real implementation, you would:
                    // 1. Check actual store availability
                    // 2. Reserve the time slot
                    // 3. Create the appointment in your system
                    // 4. Send confirmation emails/SMS
                    
                    return {
                        success: true,
                        appointment_id: appointment.id,
                        scheduled_time: appointment.preferred_time,
                        message: "Appointment successfully scheduled at promenades mall"
                    };
                } catch (error) {
                    logger.error('Error scheduling appointment:', error);
                    return {
                        success: false,
                        error: "Failed to schedule appointment"
                    };
                }
                
            case "stopConvo":
                try {
                    // Simulate conversation stopping
                    return {
                        success: true,
                        message: "Conversation marked as completed",
                        reason: toolInput.reason
                    };
                } catch (error) {
                    logger.error('Error stopping conversation:', error);
                    return {
                        success: false,
                        error: "Failed to stop conversation"
                    };
                }
                
            case "requestHumanCallback":
                try {
                    // Simulate callback request
                    return {
                        success: true,
                        message: "Callback request registered",
                        callback_id: `CB-${Date.now()}`,
                        urgency: toolInput.urgency
                    };
                } catch (error) {
                    console.error('Error requesting callback:', error);
                    return {
                        success: false,
                        error: "Failed to request callback"
                    };
                }
                
            case "updateInfo":
                try {
                    // Simulate info update
                    return {
                        success: true,
                        message: "Customer information updated successfully",
                        updated_fields: Object.keys(toolInput.updates),
                        customer_phone: toolInput.customer_phone
                    };
                } catch (error) {
                    logger.error('Error updating customer information:', error);
                    return {
                        success: false,
                        error: "Failed to update customer information"
                    };
                }
                
            case "updateAppointment":
                try {
                    // Simulate appointment update
                    return {
                        success: true,
                        message: "Appointment successfully updated",
                        new_time: toolInput.new_time,
                        customer_phone: toolInput.customer_phone,
                        appointment_id: toolInput.appointment_id || `APT-${Date.now()}`
                    };
                } catch (error) {
                    logger.error('Error updating appointment:', error);
                    return {
                        success: false,
                        error: "Failed to update appointment"
                    };
                }
                
            default:
                return {
                    success: false,
                    error: "Unknown tool"
                };
        }
    }

    
    /**
     * Generate AI response based on conversation history
     */
    // needs improvement ! 
    async generateResponse(messageContent, customerInfo, instructions) {
        try {
           
            // STEP 1 : ANALYZE CONVERSATION HISTORY - 75% QUIET GOOD 
            // STEP 2 : GENERATE APPROPRIATE RESPONSE BASED ON ANALYSIS - WE CAN IMPROVE THE PROMPT QUALITY - TEST TO SEE
            // NOTES : WHAT ABOUT IRRELEVANT INCOMING MESSAGES ? OR OUT OF SCOPE REPAIRS ? EDGE CASES ?
            // OUT OF SCOPE REPAIRS SHOULD BE INDEXED AS EARLY AS POSSIBLE IN THE CONVERSATION FLOW SO WE CAN STOP THE FLOW => FUNCTION CALL HERE
            // IN THE CASE WE STOP THE CONVERSATION ? WHAT SHOULD HAPPEN IF THE LEAD SENDS A MESSAGE AFTERWARDS ?
            // WE SHOULD BE ABLE TO START THE FLOW AGAIN IF NEEDED. THAT WAY WE CAN EVEN STORE THE CONVERSATION HISTORY AND USE IT LATER FOR BETTER ANALYSES AND RESPONSES FOR EACH LEAD.
            // NOTES : HOW TO HANDLE FUNCTION CALLS ? EX : SCHEDULE AN APPOINTMENT, CANCEL AN APPOINTMENT, CHANGE INFORMATIONS, DATABASE UPDATES;

            // WE NEED TO LET THE AI KNOW IF THE LEAD ALREADY HAS AN APPOINTMENT OR NOT
            // a robust mechanisim to get all custumer informations + appointment details and use them accross responses
            // consistently ! 
            let messages = [{role: 'user', content: 
                `You are an assistant for a phone repair store. Your task is to interact with hot leads 
                    through messages based on the instructions given to you.
                    You are given specific intructions on what you should say or do next.
                    Here are all the informations you need to know about your store: 
                    <storeInfo>{{${this.storeInfo} }}</storeInfo>.
                    Here are the very important informations about the lead you need to always be aware of:
                    <customerInfo>{{${customerInfo}}}</customerInfo>
                    KEY NOTES:
                    If the lead wants to update his informations, use the updateInfo tool.
                    If the lead wants to cancel his appointment, use the stopConvo tool.
                    If the lead is not interested, use the stopConvo tool.
                    If the lead is interested but has an objection, refer to our objection handling guide here : <objectionHandlingGuide>{{${this.objectionHandlingGuide}}}</objectionHandlingGuide>
                    The last message you received is: 
                    <lastMessage>{{${messageContent}}}</lastMessage>
                    Reply to the last message with the following instructions:
                    <instructions>{{${instructions}}}</instructions>
                    Always be friendly and professional and use {{${customerInfo}}} to address the lead if needed.
                    address custumer with their name and DO NOT be robotic XML tags should never appear in your responses.
                    Keep all responses under 160 characters and maintain a friendly, professional tone.
                    
                    `}];

            const response = await this.client.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 200,
                tools: this.tools,
                messages: messages
            });

            logger.info('AI response:', response);

            // Handle tool calls if needed can be improved !
            if (response.stop_reason === "tool_use") {
                const toolUse = response.content.find(block => block.type === "tool_use");
                if (toolUse) {
                    logger.info('Tool use detected:', toolUse);
                    const toolResult = await this.processToolCall(toolUse.name, toolUse.input);
                    
                    // Add tool result to messages
                    messages.push(
                        { role: 'assistant', content: response.content },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'tool_result',
                                    tool_use_id: toolUse.id,
                                    content: JSON.stringify(toolResult)
                                }
                            ]
                        }
                    );

                    // Get final response after tool use
                    const finalResponse = await this.client.messages.create({
                        model: 'claude-3-sonnet-20240229',
                        max_tokens: 150,
                        tools: this.tools,
                        messages: messages
                    });

                    // Return consistent format
                    return {
                        content: finalResponse.content[0].text
                    };
                }
            }

            else {
                // if no tool call is needed, return the response as is
                return {
                    content: response.content[0]?.text
                };
            } 
            // Make sure we have valid content
            const cleanedResponse = response.content[0]?.text;
            if (!cleanedResponse) {
                throw new Error('No valid response content generated');
            }

            return {
                content: cleanedResponse
            };

        } catch (error) {
            logger.error('Error generating AI response:', error);
            return {
                content: "Sorry, I'm having trouble right now. Please call us at (555) 123-4567 for immediate assistance."
            };
        }
    }
}

module.exports = new AIService();
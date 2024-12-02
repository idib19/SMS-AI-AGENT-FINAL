const express = require('express');
const router = express.Router();
const twilioService = require('../services/twilioService');
const messageService = require('../services/messageService');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const { standardizePhoneNumber } = require('../utils/phoneUtils');

// First contact message endpoint
router.post('/trigger-message', async (req, res) => {
    try {
        const { phoneNumber, customerInfo } = req.body;
        const standardizedPhone = standardizePhoneNumber(phoneNumber);
        
        logger.info('📤 Triggering outbound message:', {
            to: standardizedPhone
        });

        // Generate AI message based on customer information
        const outboundMessage = await aiService.generateFirstContactMessage(customerInfo);

        // Send message via Twilio
        const twilioResponse = await twilioService.sendMessage(
            standardizedPhone,
            outboundMessage
        );

        // Save outbound message to database and customer info
        await messageService.saveMessage({
            phoneNumber: standardizedPhone,
            content: outboundMessage,
            direction: 'outbound',
            customerName: customerInfo?.name,
            phoneModel: customerInfo?.phoneModel,
            issueDescription: customerInfo?.issue
        });

        res.json({
            status: 'success',
            messageSid: twilioResponse.sid,
            content: outboundMessage,
            to: standardizedPhone
        });

    } catch (error) {
        logger.error('🔴 Error in trigger-outbound:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error sending outbound message',
            error: error.message
        });
    }
});


// SMS webhook endpoint for handling all incoming messages
router.post('/webhook', async (req, res) => {
    try {
        const { Body: messageContent, From: phoneNumber } = req.body;
        const standardizedPhone = standardizePhoneNumber(phoneNumber);
        
    
        logger.info('📩 Incoming message:', {
            from: standardizedPhone,
            content: messageContent
        });

        // Save incoming message
        const savedMessage = await messageService.saveMessage({
            phoneNumber: standardizedPhone,
            content: messageContent,
            direction: 'inbound'
        });

        // Get conversation history => JSON (WELL FORMATTED AND CLEAN JSON)
        const conversationHistory = await messageService.getConversationHistory(standardizedPhone);
        
        // get customer info
        const customerInfo = await messageService.getCustomerInfo(standardizedPhone);

        const { instructions } = await aiService.analyzeConversation(conversationHistory);
        // Generate AI response
        const aiResponse = await aiService.generateResponse(messageContent, conversationHistory, customerInfo, instructions);
        // Validate AI response before attempting to save
        if (!aiResponse || !aiResponse.content) {
            logger.error('Invalid AI response received:', aiResponse);
            throw new Error('Invalid AI response format');
        }


        try {
            await messageService.saveMessage({
                phoneNumber: standardizedPhone,
                content: aiResponse.content,
                direction: 'outbound'
            });
            logger.info('Successfully saved outbound message to MongoDB');
        } catch (error) {
            logger.error('Error saving outbound message:', error);
            logger.error('AI Response content that failed:', aiResponse.content);
            throw error;
        }

        // Send message via Twilio
        const twilioResponse = await twilioService.sendMessage(
            standardizedPhone,
            aiResponse.content
        );


        res.json({
            status: 'success',
            messageSid: twilioResponse.sid,
            content: aiResponse.content,
            to: standardizedPhone
        });

        

    } catch (error) {
        logger.error('🔴 Error in /webhook:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Optional: Add an endpoint to retrieve conversation history
router.get('/history/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const history = await messageService.getConversationHistory(phoneNumber);
        res.json(history);
    } catch (error) {
        logger.error('Error fetching history:', error);
        res.status(500).json({ error: 'Error fetching conversation history' });
    }
});

// Fallback webhook endpoint
router.post('/webhook/fallback', async (req, res) => {
    try {
        logger.warn('⚠️ Fallback webhook triggered:', req.body);
        
        // Send a simple response to acknowledge the message
        const fallbackResponse = twilioService.createTwiMLResponse(
            "We're experiencing technical difficulties. Please try again in a few minutes."
        );
        
        res.set('Content-Type', 'text/xml');
        res.send(fallbackResponse);
    } catch (error) {
        logger.error('🔴 Error in fallback webhook:', error);
        res.status(500).send('Error processing fallback message');
    }
});

// Status callback endpoint
router.post('/status', async (req, res) => {
    try {
        const { MessageStatus, MessageSid, From } = req.body;
        logger.info('📫 Message Status Update:', {
            status: MessageStatus,
            messageSid: MessageSid,
            from: From
        });
        
        res.sendStatus(200);
    } catch (error) {
        logger.error('Error handling status callback:', error);
        res.sendStatus(500);
    }
});


module.exports = router;
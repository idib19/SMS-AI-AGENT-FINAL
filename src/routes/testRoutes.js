const express = require('express');
const router = express.Router();
const messageService = require('../services/messageService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');
router.get('/conversation-history/:phoneNumber', async (req, res) => {
    try {
        const messages = await messageService.getConversationHistory(req.params.phoneNumber);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/conversation-analysis/:phoneNumber', async (req, res) => {
    try {
        const conversationHistory = await messageService.getConversationHistory(req.params.phoneNumber);
        logger.info(`Conversation history fetched for ${req.params.phoneNumber}:`, conversationHistory);
        const { instructions } = await aiService.analyzeConversation(conversationHistory);
        res.json({ instructions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

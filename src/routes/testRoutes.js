const express = require('express');
const router = express.Router();
const messageService = require('../services/messageService');

router.get('/conversation-history/:phoneNumber', async (req, res) => {
    try {
        const messages = await messageService.getConversationHistory(req.params.phoneNumber);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

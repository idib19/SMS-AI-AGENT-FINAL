const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/environment');
const logger = require('./utils/logger');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const webhookRoutes = require('./routes/webhookRoutes');
const healthRoutes = require('./routes/healthRoutes');
const testRoutes = require('./routes/testRoutes');
// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Or specific origins
//app.use(cors({
//    origin: ['https://your-frontend.com', 'http://localhost:3000'],
//    methods: ['GET', 'POST'],
//    allowedHeaders: ['Content-Type', 'Authorization']
//}));

// Routes
app.use('/sms', webhookRoutes);
app.use('/health', healthRoutes);
app.use('/test', testRoutes);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Something went wrong!',
        message: config.nodeEnv === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
});

module.exports = app;
# SMS AI Agent for Phone Repair Shops 🤖📱

An intelligent SMS automation system that helps phone repair shops convert leads and manage customer interactions using Claude AI. The system handles appointment scheduling, customer inquiries, and lead qualification automatically while maintaining a natural, professional conversation flow.

## 🌟 Key Features

- **Intelligent Conversations**: Leverages Claude AI to maintain natural, context-aware customer interactions
- **Appointment Scheduling**: Automatically schedules repairs based on availability
- **Lead Qualification**: Identifies and qualifies potential customers
- **Customer Information Management**: Stores and retrieves customer data and conversation history
- **Multi-State Conversation Handling**: Manages complex conversation flows with proper state management
- **Error Handling**: Robust handling of edge cases and graceful degradation
- **Human Handoff**: Smart escalation to human agents when needed

## 🛠 Technical Stack

- **Backend**: Node.js with Express
- **AI**: Anthropic's Claude 3 API
- **Database**: MongoDB for conversation and customer data storage
- **SMS Gateway**: Twilio for message handling
- **State Management**: Custom conversation state tracking
- **Error Handling**: Comprehensive error management system

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB instance
- Twilio account with SMS capabilities
- Anthropic API key
- Environment variables configured

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sms-ai-agent.git
cd sms-ai-agent
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
MONGODB_URI=your_mongodb_uri
ANTHROPIC_API_KEY=your_anthropic_key
PORT=3000
```

4. **Start the server**
```bash
npm start
```

## 💡 Usage

### Basic Setup

```javascript
const SMSAgent = require('./path/to/SMSAgent');

const agent = new SMSAgent(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
    process.env.TWILIO_PHONE_NUMBER,
    process.env.MONGODB_URI
);
```

### API Endpoints
1. Trigger Initial Contact
Initiates the first contact with a potential customer.

```javascript
POST /api/trigger-message

// Request Body
{
    "phoneNumber": "+1234567890",
    "customerInfo": {
        "name": "John Doe",
        "phoneModel": "iPhone 13 Pro",
        "issue": "Cracked screen",
        "email": "john@example.com"
    }
}

// Success Response
{
    "status": "success",
    "messageSid": "SM123...",
    "content": "Hi John! We received your repair request for iPhone 13 Pro screen repair...",
    "to": "+1234567890"
}
```
2. Handle Incoming Messages
Webhook endpoint for processing all subsequent messages in the conversation.
```javascript
POST /api/webhook

// Request Body (Twilio Webhook Format)
{
    "Body": "Yes, I'd like to schedule an appointment",
    "From": "+1234567890",
    "To": "+0987654321",
    "MessageSid": "SM123..."
}

// Success Response
{
    "status": "success",
    "messageSid": "SM124...",
    "content": "Great! We have availability tomorrow at 2 PM or 4 PM. Which time works better?",
    "to": "+1234567890"
}
```


## 🔄 Conversation Flow

1. **Initial Contact**
   - System receives customer information and triggers initial message
   - AI generates appropriate greeting and information gathering

2. **Information Collection** 
   - System collects necessary details about the repair
   - Validates phone model and issue description

3. **Quote Provision**
   - Provides repair cost estimation
   - Handles price-related queries

4. **Appointment Scheduling**
   - Checks availability
   - Books appointment
   - Sends confirmation

5. **Follow-up**
   - Handles post-booking queries
   - Manages appointment modifications

## 🛡️ Error Handling

The system includes robust error handling for:
- Invalid phone models
- Unclear repair descriptions
- System integration issues
- Message delivery failures
- Database connectivity problems
- API rate limiting

## 🤝 Contribution ?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 📞 Support

For support, please email idib2025@gmail.com or create an issue in the repository.

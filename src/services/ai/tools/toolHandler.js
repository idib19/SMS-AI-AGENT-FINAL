const logger = require('../../../utils/logger');

class ToolHandler {
    async handleResponse(response, messages) {
        if (response.stop_reason === "tool_use") {
            return await this.handleToolUse(response, messages);
        }
        return { content: response.content[0]?.text };
    }

    async handleToolUse(response, messages) {
        const toolUse = response.content.find(block => block.type === "tool_use");
        if (toolUse) {
            const toolResult = await this.processToolCall(toolUse.name, toolUse.input);
            messages.push({
                role: "assistant",
                content: `Tool ${toolUse.name} was called with result: ${JSON.stringify(toolResult)}`
            });
            
            return {
                content: toolResult.message || "Tool execution completed",
                toolResult: toolResult
            };
        }
        return { content: "No tool use found in response" };
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
}

module.exports = new ToolHandler(); 
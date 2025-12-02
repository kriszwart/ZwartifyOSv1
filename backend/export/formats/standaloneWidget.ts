/**
 * Standalone Widget Generator
 * 
 * Generates a self-contained HTML/JS widget that can be embedded on any website
 */

import { AgentDefinition } from '../../db/types'
import { ExportResult } from '../agentExporter'

export async function exportAsWidget(
  agent: AgentDefinition,
  apiUrl: string
): Promise<ExportResult> {
  const widgetHtml = generateWidgetHTML(agent, apiUrl)
  const widgetJs = generateWidgetJS(agent, apiUrl)
  
  // Combine HTML and JS into a single embeddable file
  const combinedWidget = generateCombinedWidget(agent, apiUrl, widgetHtml, widgetJs)
  
  return {
    format: 'widget',
    content: combinedWidget,
    mimeType: 'text/html',
    filename: `zwartify-widget-${agent.id}.html`,
    embedCode: `<script src="${apiUrl}/widget.js"></script>
<script>
  ZwartifyWidget.init({
    agentId: '${agent.id}',
    containerId: 'zwartify-widget-${agent.id}'
  });
</script>
<div id="zwartify-widget-${agent.id}"></div>`,
    installInstructions: `1. Copy the embed code provided
2. Paste it into your HTML where you want the agent to appear
3. The widget will automatically load and connect to the agent
4. Customize styling by adding CSS targeting #zwartify-widget-${agent.id}`
  }
}

function generateWidgetHTML(agent: AgentDefinition, apiUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${agent.name} - Zwartify Agent</title>
    <style>
        ${generateWidgetCSS()}
    </style>
</head>
<body>
    <div id="zwartify-widget-container" class="zwartify-widget">
        <div class="zwartify-header">
            <h3>${agent.name}</h3>
            <button class="zwartify-close" onclick="this.closest('.zwartify-widget').style.display='none'">×</button>
        </div>
        <div class="zwartify-messages" id="zwartify-messages"></div>
        <div class="zwartify-input-area">
            <input type="text" id="zwartify-input" placeholder="Type your message..." />
            <button id="zwartify-send">Send</button>
        </div>
    </div>
    <script>
        ${generateWidgetJS(agent, apiUrl)}
    </script>
</body>
</html>`
}

function generateWidgetJS(agent: AgentDefinition, apiUrl: string): string {
  return `
(function() {
    const agentId = '${agent.id}';
    const apiUrl = '${apiUrl}';
    
    const messagesContainer = document.getElementById('zwartify-messages');
    const inputField = document.getElementById('zwartify-input');
    const sendButton = document.getElementById('zwartify-send');
    
    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = \`zwartify-message zwartify-\${role}\`;
        messageDiv.textContent = content;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    async function sendMessage() {
        const input = inputField.value.trim();
        if (!input) return;
        
        addMessage('user', input);
        inputField.value = '';
        sendButton.disabled = true;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'zwartify-message zwartify-assistant zwartify-loading';
        loadingDiv.textContent = 'Thinking...';
        messagesContainer.appendChild(loadingDiv);
        
        try {
            const response = await fetch(\`\${apiUrl}/stream\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input, agentId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            messagesContainer.removeChild(loadingDiv);
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            const assistantDiv = document.createElement('div');
            assistantDiv.className = 'zwartify-message zwartify-assistant';
            messagesContainer.appendChild(assistantDiv);
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\\n\\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'text' && data.content) {
                                assistantDiv.textContent += data.content;
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE:', e);
                        }
                    }
                }
            }
        } catch (error) {
            messagesContainer.removeChild(loadingDiv);
            addMessage('assistant', 'Sorry, an error occurred. Please try again.');
            console.error('Error:', error);
        } finally {
            sendButton.disabled = false;
            inputField.focus();
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Initialize
    inputField.focus();
})();
`
}

function generateWidgetCSS(): string {
  return `
.zwartify-widget {
    display: flex;
    flex-direction: column;
    height: 600px;
    max-width: 100%;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.zwartify-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #f5f5f5;
}

.zwartify-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.zwartify-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 1;
}

.zwartify-close:hover {
    color: #000;
}

.zwartify-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.zwartify-message {
    padding: 10px 14px;
    border-radius: 12px;
    max-width: 80%;
    word-wrap: break-word;
}

.zwartify-message.zwartify-user {
    align-self: flex-end;
    background: #007bff;
    color: white;
}

.zwartify-message.zwartify-assistant {
    align-self: flex-start;
    background: #f0f0f0;
    color: #333;
}

.zwartify-message.zwartify-loading {
    opacity: 0.6;
    font-style: italic;
}

.zwartify-input-area {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #e0e0e0;
    background: #fafafa;
}

.zwartify-input-area input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 14px;
    outline: none;
}

.zwartify-input-area input:focus {
    border-color: #007bff;
}

.zwartify-input-area button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
}

.zwartify-input-area button:hover:not(:disabled) {
    background: #0056b3;
}

.zwartify-input-area button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
`
}

function generateCombinedWidget(
  agent: AgentDefinition,
  apiUrl: string,
  html: string,
  js: string
): string {
  // For standalone HTML file, return the already-generated HTML
  // The HTML already contains the JS embedded, so just return it
  return html
}


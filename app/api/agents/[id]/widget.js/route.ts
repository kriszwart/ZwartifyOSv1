import { NextRequest, NextResponse } from "next/server"
import { getAgent } from "../../../../../backend/agents/agentRegistry"
import { exportAsWidget } from "../../../../../backend/export/formats/standaloneWidget"

export const dynamic = 'force-dynamic'

/**
 * GET /api/agents/[id]/widget.js
 * 
 * Generate widget JavaScript for embedding the agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agent = await getAgent(id)
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   request.headers.get('origin') || 
                   'http://localhost:3000'
    const apiUrl = `${baseUrl}/api/agents/${id}`
    
    // Generate widget JavaScript
    const widgetJs = generateWidgetScript(agent, apiUrl)
    
    return new NextResponse(widgetJs, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating widget script:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate widget script' },
      { status: 500 }
    )
  }
}

function generateWidgetScript(agent: any, apiUrl: string): string {
  return `
(function() {
  'use strict';
  
  const ZwartifyWidget = {
    config: {
      agentId: '${agent.id}',
      apiUrl: '${apiUrl}',
      agentName: '${agent.name}',
    },
    
    init: function(options) {
      const config = { ...this.config, ...options };
      const containerId = config.containerId || 'zwartify-widget-' + config.agentId;
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.error('ZwartifyWidget: Container not found:', containerId);
        return;
      }
      
      this.render(container, config);
    },
    
    render: function(container, config) {
      container.innerHTML = \`
        <div class="zwartify-widget" style="display: flex; flex-direction: column; height: 600px; max-width: 100%; border: 1px solid #e0e0e0; border-radius: 8px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div class="zwartify-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">\${config.agentName}</h3>
          </div>
          <div class="zwartify-messages" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;"></div>
          <div class="zwartify-input-area" style="display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e0e0e0; background: #fafafa;">
            <input type="text" class="zwartify-input" placeholder="Type your message..." style="flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none;" />
            <button class="zwartify-send" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 500;">Send</button>
          </div>
        </div>
      \`;
      
      this.attachEventListeners(container, config);
    },
    
    attachEventListeners: function(container, config) {
      const messagesContainer = container.querySelector('.zwartify-messages');
      const inputField = container.querySelector('.zwartify-input');
      const sendButton = container.querySelector('.zwartify-send');
      
      const addMessage = (role, content) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'zwartify-message zwartify-' + role;
        messageDiv.textContent = content;
        messageDiv.style.cssText = role === 'user' 
          ? 'align-self: flex-end; background: #007bff; color: white; padding: 10px 14px; border-radius: 12px; max-width: 80%; word-wrap: break-word;'
          : 'align-self: flex-start; background: #f0f0f0; color: #333; padding: 10px 14px; border-radius: 12px; max-width: 80%; word-wrap: break-word;';
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      };
      
      const sendMessage = async () => {
        const input = inputField.value.trim();
        if (!input) return;
        
        addMessage('user', input);
        inputField.value = '';
        sendButton.disabled = true;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'zwartify-message zwartify-assistant zwartify-loading';
        loadingDiv.textContent = 'Thinking...';
        loadingDiv.style.cssText = 'align-self: flex-start; background: #f0f0f0; color: #333; padding: 10px 14px; border-radius: 12px; max-width: 80%; opacity: 0.6; font-style: italic;';
        messagesContainer.appendChild(loadingDiv);
        
        try {
          const response = await fetch(config.apiUrl + '/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, agentId: config.agentId })
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
          assistantDiv.style.cssText = 'align-self: flex-start; background: #f0f0f0; color: #333; padding: 10px 14px; border-radius: 12px; max-width: 80%; word-wrap: break-word;';
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
      };
      
      sendButton.addEventListener('click', sendMessage);
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
      
      inputField.focus();
    }
  };
  
  // Expose globally
  if (typeof window !== 'undefined') {
    window.ZwartifyWidget = ZwartifyWidget;
  }
  
  // Auto-initialize if container exists
  if (typeof document !== 'undefined') {
    const containers = document.querySelectorAll('[data-zwartify-agent-id]');
    containers.forEach(container => {
      const agentId = container.getAttribute('data-zwartify-agent-id');
      ZwartifyWidget.init({
        agentId: agentId,
        containerId: container.id || 'zwartify-widget-' + agentId
      });
    });
  }
})();
`
}





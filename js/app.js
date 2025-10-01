// ASHER - AI Provider Testing Lab
// Simultaneous A/B/C/D Testing

const API_BASE = 'http://localhost:8001';

// Theme Management
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('dark-btn').classList.add('active');
        document.getElementById('light-btn').classList.remove('active');
        localStorage.setItem('asher-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('light-btn').classList.add('active');
        document.getElementById('dark-btn').classList.remove('active');
        localStorage.setItem('asher-theme', 'light');
    }
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('asher-theme') || 'dark';
    setTheme(savedTheme);
}

// State management
let referenceDocuments = [];
let conversationHistory = {};

// Initialize conversation history for all providers
function initializeConversationHistory() {
    Object.keys(PROVIDER_MAP).forEach(providerId => {
        if (!conversationHistory[providerId]) {
            conversationHistory[providerId] = [];
        }
    });
}

// Provider mapping - Maps provider IDs to UI elements
const PROVIDER_MAP = {
    'openai-gpt4.1': {
        id: 'openai-gpt4.1',
        name: 'OpenAI GPT-4.1',
        messagesId: 'messages-openai',
        tokensId: 'openai-tokens',
        timeId: 'openai-time'
    },
    'openai-gpt4o': {
        id: 'openai-gpt4o',
        name: 'OpenAI GPT-4o',
        messagesId: 'messages-openai',
        tokensId: 'openai-tokens',
        timeId: 'openai-time'
    },
    'openai-o3': {
        id: 'openai-o3',
        name: 'OpenAI o3',
        messagesId: 'messages-openai',
        tokensId: 'openai-tokens',
        timeId: 'openai-time'
    },
    'openai-o4-mini': {
        id: 'openai-o4-mini',
        name: 'OpenAI o4-mini',
        messagesId: 'messages-openai',
        tokensId: 'openai-tokens',
        timeId: 'openai-time'
    },
    'claude-sonnet-4.5': {
        id: 'claude-sonnet-4.5',
        name: 'Claude Sonnet 4.5',
        messagesId: 'messages-claude',
        tokensId: 'claude-tokens',
        timeId: 'claude-time'
    },
    'claude-opus-4.1': {
        id: 'claude-opus-4.1',
        name: 'Claude Opus 4.1',
        messagesId: 'messages-claude',
        tokensId: 'claude-tokens',
        timeId: 'claude-time'
    },
    'claude-sonnet-4': {
        id: 'claude-sonnet-4',
        name: 'Claude Sonnet 4',
        messagesId: 'messages-claude',
        tokensId: 'claude-tokens',
        timeId: 'claude-time'
    },
    'gemini-2.5-flash': {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        messagesId: 'messages-gemini',
        tokensId: 'gemini-tokens',
        timeId: 'gemini-time'
    },
    'gemini-2.5-pro': {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        messagesId: 'messages-gemini',
        tokensId: 'gemini-tokens',
        timeId: 'gemini-time'
    },
    'grok-4': {
        id: 'grok-4',
        name: 'xAI Grok 4',
        messagesId: 'messages-grok',
        tokensId: 'grok-tokens',
        timeId: 'grok-time'
    },
    'grok-3': {
        id: 'grok-3',
        name: 'xAI Grok 3',
        messagesId: 'messages-grok',
        tokensId: 'grok-tokens',
        timeId: 'grok-time'
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initializeConversationHistory();
    loadProviderStatus();
    setupEnterKeyHandler();
});

// Setup Enter key handler for textarea
function setupEnterKeyHandler() {
    const textarea = document.getElementById('test-message');
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToAllProviders();
        }
    });
}

// Load provider status
async function loadProviderStatus() {
    const statusContainer = document.getElementById('provider-status');

    try {
        const response = await fetch(`${API_BASE}/providers`);
        const data = await response.json();

        let html = '';
        data.providers.forEach(provider => {
            // Only show the 4 main providers we're testing
            const mainProviders = ['openai-gpt4', 'claude-sonnet', 'gemini-flash', 'grok'];
            if (mainProviders.includes(provider.id)) {
                const statusClass = provider.available ? 'available' : 'unavailable';
                const statusText = provider.available ? 'Ready' : 'No API Key';

                html += `
                    <div class="status-item">
                        <span class="status-provider">${provider.name}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                `;
            }
        });

        statusContainer.innerHTML = html || '<div class="status-loading">No providers available</div>';

    } catch (error) {
        console.error('Error loading provider status:', error);
        statusContainer.innerHTML = '<div class="status-loading">Error loading status</div>';
    }
}

// Reference document management
function addReferenceDocument() {
    const docId = Date.now();
    const doc = {
        id: docId,
        title: `Document ${referenceDocuments.length + 1}`,
        content: ''
    };

    referenceDocuments.push(doc);
    renderReferenceDocuments();
}

function removeReferenceDocument(docId) {
    referenceDocuments = referenceDocuments.filter(doc => doc.id !== docId);
    renderReferenceDocuments();
}

function updateDocumentTitle(docId, title) {
    const doc = referenceDocuments.find(d => d.id === docId);
    if (doc) {
        doc.title = title;
    }
}

function updateDocumentContent(docId, content) {
    const doc = referenceDocuments.find(d => d.id === docId);
    if (doc) {
        doc.content = content;
    }
}

function renderReferenceDocuments() {
    const container = document.getElementById('reference-documents');
    const countElement = document.getElementById('ref-count');

    countElement.textContent = `${referenceDocuments.length} document${referenceDocuments.length !== 1 ? 's' : ''}`;

    if (referenceDocuments.length === 0) {
        container.innerHTML = '<div class="empty-references">No reference documents added</div>';
        return;
    }

    let html = '';
    referenceDocuments.forEach(doc => {
        html += `
            <div class="reference-item" data-id="${doc.id}">
                <div class="reference-item-header">
                    <input
                        type="text"
                        value="${doc.title}"
                        placeholder="Document title..."
                        onchange="updateDocumentTitle(${doc.id}, this.value)"
                    >
                    <button class="remove-doc-btn" onclick="removeReferenceDocument(${doc.id})">✕</button>
                </div>
                <textarea
                    placeholder="Paste reference content here..."
                    onchange="updateDocumentContent(${doc.id}, this.value)"
                >${doc.content}</textarea>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Get active providers
function getActiveProviders() {
    const providers = [];

    if (document.getElementById('provider-openai').checked) providers.push('openai-gpt4');
    if (document.getElementById('provider-claude').checked) providers.push('claude-sonnet');
    if (document.getElementById('provider-gemini').checked) providers.push('gemini-flash');
    if (document.getElementById('provider-grok').checked) providers.push('grok');

    return providers;
}

// Build context from system prompt and reference documents
function buildContext() {
    const systemPrompt = document.getElementById('system-prompt').value.trim();

    let context = systemPrompt;

    // Add reference documents
    if (referenceDocuments.length > 0) {
        context += '\n\n=== REFERENCE DOCUMENTS ===\n\n';

        referenceDocuments.forEach(doc => {
            if (doc.content.trim()) {
                context += `--- ${doc.title} ---\n${doc.content}\n\n`;
            }
        });
    }

    return context;
}

// Add message to chat panel
function addMessage(providerId, role, content, isError = false) {
    const provider = PROVIDER_MAP[providerId];
    if (!provider) return;

    const messagesContainer = document.getElementById(provider.messagesId);

    // Remove empty state if exists
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble ${role}${isError ? ' error' : ''}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageDiv;
}

// Add loading indicator
function addLoadingIndicator(providerId) {
    const provider = PROVIDER_MAP[providerId];
    if (!provider) return null;

    const messagesContainer = document.getElementById(provider.messagesId);

    // Remove empty state if exists
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message-bubble loading';
    loadingDiv.innerHTML = '<div class="message-content">Thinking...</div>';

    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return loadingDiv;
}

// Update stats
function updateStats(providerId, tokens, timeMs) {
    const provider = PROVIDER_MAP[providerId];
    if (!provider) return;

    const tokensElement = document.getElementById(provider.tokensId);
    const timeElement = document.getElementById(provider.timeId);

    if (tokensElement) {
        tokensElement.textContent = `${tokens} tokens`;
    }

    if (timeElement) {
        timeElement.textContent = `${timeMs}ms`;
    }
}

// Send message to a single provider
async function sendToProvider(providerId, message, systemContext) {
    const startTime = Date.now();
    const loadingIndicator = addLoadingIndicator(providerId);

    try {
        const response = await fetch(`${API_BASE}/asher/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider: providerId,
                message: message,
                system_prompt: systemContext,
                conversation_history: conversationHistory[providerId] || []
            })
        });

        const data = await response.json();
        const timeMs = Date.now() - startTime;

        // Remove loading indicator
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        if (!response.ok) {
            throw new Error(data.detail || data.error || 'Request failed');
        }

        // Add assistant response
        addMessage(providerId, 'assistant', data.reply);

        // Update conversation history
        if (!conversationHistory[providerId]) {
            conversationHistory[providerId] = [];
        }
        conversationHistory[providerId].push(
            { role: 'user', content: message },
            { role: 'assistant', content: data.reply }
        );

        // Update stats
        const estimatedTokens = Math.ceil((message.length + data.reply.length) / 4);
        updateStats(providerId, estimatedTokens, timeMs);

        return data;

    } catch (error) {
        console.error(`Error with ${providerId}:`, error);

        // Remove loading indicator
        if (loadingIndicator) {
            loadingIndicator.remove();
        }

        // Show error message
        addMessage(providerId, 'assistant', `Error: ${error.message}`, true);

        const timeMs = Date.now() - startTime;
        updateStats(providerId, 0, timeMs);

        throw error;
    }
}

// Send to all active providers simultaneously
async function sendToAllProviders() {
    const message = document.getElementById('test-message').value.trim();

    if (!message) {
        alert('Please enter a test message');
        return;
    }

    const activeProviders = getActiveProviders();

    if (activeProviders.length === 0) {
        alert('Please select at least one provider');
        return;
    }

    // Build context from system prompt and reference documents
    const systemContext = buildContext();

    // Disable send button
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    // Add user message to all active provider panels
    activeProviders.forEach(providerId => {
        addMessage(providerId, 'user', message);
    });

    // Clear input
    document.getElementById('test-message').value = '';

    // Send to all providers in parallel
    const promises = activeProviders.map(providerId =>
        sendToProvider(providerId, message, systemContext).catch(err => {
            console.error(`Provider ${providerId} failed:`, err);
            return null;
        })
    );

    await Promise.all(promises);

    // Re-enable send button
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send to All Providers';

    console.log('✅ All providers responded');
}

// Clear all chats
function clearAllChats() {
    if (!confirm('Clear all chat history? This cannot be undone.')) {
        return;
    }

    // Reset conversation history
    Object.keys(conversationHistory).forEach(key => {
        conversationHistory[key] = [];
    });

    // Clear all message containers
    Object.values(PROVIDER_MAP).forEach(provider => {
        const messagesContainer = document.getElementById(provider.messagesId);
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <p>💬 ${provider.name} responses will appear here</p>
            </div>
        `;

        // Reset stats
        document.getElementById(provider.tokensId).textContent = '0 tokens';
        document.getElementById(provider.timeId).textContent = '0ms';
    });

    console.log('🧹 All chats cleared');
}

// Export results
function exportResults() {
    const systemPrompt = document.getElementById('system-prompt').value;
    const activeProviders = getActiveProviders();

    const exportData = {
        timestamp: new Date().toISOString(),
        configuration: {
            system_prompt: systemPrompt,
            reference_documents: referenceDocuments,
            active_providers: activeProviders
        },
        conversations: {}
    };

    // Export conversation history for each provider
    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            exportData.conversations[providerId] = conversationHistory[providerId];
        }
    });

    // Create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asher-test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Results exported');
}

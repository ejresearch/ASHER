// ASHER - AI Provider Testing Lab
// Simultaneous A/B/C/D Testing

const API_BASE = 'http://localhost:8001';

// Theme Management - Apple Style Toggle
function toggleTheme() {
    const themeSwitch = document.getElementById('theme-switch');
    const isDark = document.documentElement.hasAttribute('data-theme');

    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        themeSwitch.classList.remove('active');
        localStorage.setItem('asher-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.classList.add('active');
        localStorage.setItem('asher-theme', 'dark');
    }
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('asher-theme') || 'dark';
    const themeSwitch = document.getElementById('theme-switch');

    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.classList.add('active');
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeSwitch.classList.remove('active');
    }
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

// State for API key modal
let currentProviderId = null;
const API_KEY_MAP = {
    'openai-gpt4.1': 'OPENAI_API_KEY',
    'claude-sonnet-4.5': 'ANTHROPIC_API_KEY',
    'gemini-2.5-flash': 'GOOGLE_API_KEY',
    'grok-4': 'XAI_API_KEY'
};

// Load provider status with checkboxes
async function loadProviderStatus() {
    const statusContainer = document.getElementById('provider-status');

    try {
        const response = await fetch(`${API_BASE}/providers`);
        const data = await response.json();

        let html = '';
        const mainProviders = [
            { id: 'openai-gpt4.1', checkboxId: 'provider-openai' },
            { id: 'claude-sonnet-4.5', checkboxId: 'provider-claude' },
            { id: 'gemini-2.5-flash', checkboxId: 'provider-gemini' },
            { id: 'grok-4', checkboxId: 'provider-grok' }
        ];

        mainProviders.forEach(({ id, checkboxId }) => {
            const provider = data.providers.find(p => p.id === id);
            if (provider) {
                const statusClass = provider.available ? 'available' : 'unavailable';
                const statusText = provider.available ? '✓' : '✗';

                html += `
                    <div class="provider-checkbox">
                        <input type="checkbox" id="${checkboxId}" value="${id}" ${provider.available ? 'checked' : ''}>
                        <span class="provider-name">${provider.name}</span>
                        <button class="config-icon" onclick="openApiKeyModal('${id}')" title="Configure API Key">⚙️</button>
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

// Model options for each provider
const PROVIDER_MODELS = {
    'openai': [
        { id: 'openai-gpt4.1', name: 'GPT-4.1' },
        { id: 'openai-gpt4o', name: 'GPT-4o' },
        { id: 'openai-o3', name: 'o3' },
        { id: 'openai-o4-mini', name: 'o4-mini' }
    ],
    'claude': [
        { id: 'claude-sonnet-4.5', name: 'Sonnet 4.5' },
        { id: 'claude-opus-4.1', name: 'Opus 4.1' },
        { id: 'claude-sonnet-4', name: 'Sonnet 4' }
    ],
    'gemini': [
        { id: 'gemini-2.5-pro', name: '2.5 Pro' },
        { id: 'gemini-2.5-flash', name: '2.5 Flash' }
    ],
    'grok': [
        { id: 'grok-4', name: 'Grok 4' },
        { id: 'grok-3', name: 'Grok 3' }
    ]
};

// API Key Modal Functions
function openApiKeyModal(providerId) {
    currentProviderId = providerId;
    const modal = document.getElementById('api-key-modal');
    const title = document.getElementById('modal-title');
    const label = document.getElementById('modal-label');
    const input = document.getElementById('api-key-input');
    const modelSelect = document.getElementById('model-select');

    const providerNames = {
        'openai-gpt4.1': 'OpenAI',
        'claude-sonnet-4.5': 'Anthropic Claude',
        'gemini-2.5-flash': 'Google Gemini',
        'grok-4': 'xAI Grok'
    };

    // Determine provider family (openai, claude, gemini, grok)
    const providerFamily = providerId.split('-')[0];

    title.textContent = `Configure ${providerNames[providerId]}`;
    label.textContent = `${providerNames[providerId]} API Key`;

    // Populate model dropdown
    const models = PROVIDER_MODELS[providerFamily] || [];
    modelSelect.innerHTML = models.map(model =>
        `<option value="${model.id}" ${model.id === providerId ? 'selected' : ''}>${model.name}</option>`
    ).join('');

    // Load existing key from localStorage
    const keyName = API_KEY_MAP[providerId];
    const existingKey = localStorage.getItem(keyName) || '';
    input.value = existingKey;

    modal.style.display = 'flex';
}

function closeApiKeyModal() {
    document.getElementById('api-key-modal').style.display = 'none';
    document.getElementById('api-key-input').value = '';
    currentProviderId = null;
}

function saveApiKey() {
    const input = document.getElementById('api-key-input');
    const modelSelect = document.getElementById('model-select');
    const apiKey = input.value.trim();
    const selectedModel = modelSelect.value;

    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }

    // Save API key
    const keyName = API_KEY_MAP[currentProviderId];
    localStorage.setItem(keyName, apiKey);

    // Save selected model preference
    const providerFamily = currentProviderId.split('-')[0];
    localStorage.setItem(`${providerFamily}_selected_model`, selectedModel);

    alert('Settings saved! Note: Keys are stored locally in your browser. You\'ll need to reload the page for changes to take effect.');

    closeApiKeyModal();
    // Optionally reload provider status
    loadProviderStatus();
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

// Upload document file
async function uploadDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.pdf,.docx,.doc,.md,.markdown,.html,.htm,.csv,.json,.jsonl';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload/document`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed');
            }

            // Create new document with uploaded content
            const docId = Date.now();
            const doc = {
                id: docId,
                title: data.filename,
                content: data.content
            };

            referenceDocuments.push(doc);
            renderReferenceDocuments();

            console.log(`📄 Uploaded: ${data.filename} (${data.file_type})`);

        } catch (error) {
            console.error('Upload error:', error);
            alert(`Failed to upload file: ${error.message}`);
        }
    };

    input.click();
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

    if (document.getElementById('provider-openai').checked) providers.push('openai-gpt4.1');
    if (document.getElementById('provider-claude').checked) providers.push('claude-sonnet-4.5');
    if (document.getElementById('provider-gemini').checked) providers.push('gemini-2.5-flash');
    if (document.getElementById('provider-grok').checked) providers.push('grok-4');

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

// Toggle panel fullscreen
function togglePanelExpand(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.toggle('expanded');
}

// Export results as JSON
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
    a.download = `asher-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 JSON exported');
}

// Export as plain text
function exportAsPlainText() {
    const systemPrompt = document.getElementById('system-prompt').value;
    let text = `ASHER Test Results\n`;
    text += `Date: ${new Date().toLocaleString()}\n`;
    text += `${'='.repeat(80)}\n\n`;

    if (systemPrompt) {
        text += `SYSTEM PROMPT:\n${systemPrompt}\n\n`;
    }

    if (referenceDocuments.length > 0) {
        text += `REFERENCE DOCUMENTS:\n`;
        referenceDocuments.forEach(doc => {
            text += `\n--- ${doc.title} ---\n${doc.content}\n`;
        });
        text += `\n`;
    }

    text += `CONVERSATIONS:\n${'='.repeat(80)}\n\n`;

    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            const provider = PROVIDER_MAP[providerId];
            text += `\n### ${provider.name} ###\n\n`;

            conversationHistory[providerId].forEach(msg => {
                text += `[${msg.role.toUpperCase()}]\n${msg.content}\n\n`;
            });
        }
    });

    downloadFile(text, `asher-results-${Date.now()}.txt`, 'text/plain');
    console.log('📥 Plain text exported');
}

// Export as Markdown
function exportAsMarkdown() {
    const systemPrompt = document.getElementById('system-prompt').value;
    let md = `# ASHER Test Results\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n`;
    md += `---\n\n`;

    if (systemPrompt) {
        md += `## System Prompt\n\n\`\`\`\n${systemPrompt}\n\`\`\`\n\n`;
    }

    if (referenceDocuments.length > 0) {
        md += `## Reference Documents\n\n`;
        referenceDocuments.forEach(doc => {
            md += `### ${doc.title}\n\n\`\`\`\n${doc.content}\n\`\`\`\n\n`;
        });
    }

    md += `## Conversations\n\n`;

    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            const provider = PROVIDER_MAP[providerId];
            md += `### ${provider.name}\n\n`;

            conversationHistory[providerId].forEach(msg => {
                if (msg.role === 'user') {
                    md += `**User:**\n\n${msg.content}\n\n`;
                } else {
                    md += `**Assistant:**\n\n${msg.content}\n\n`;
                }
                md += `---\n\n`;
            });
        }
    });

    downloadFile(md, `asher-results-${Date.now()}.md`, 'text/markdown');
    console.log('📥 Markdown exported');
}

// Helper to download file
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

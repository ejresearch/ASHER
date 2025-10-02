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
let conversationEvents = {}; // Track system prompt and document changes
let currentSystemContext = null; // Track current system context
let savedConversations = []; // Saved conversation history
let isColumnsLayout = false;
let isSyncScrollEnabled = false;
let isConfigPanelOpen = false;

// Initialize conversation history for all providers
function initializeConversationHistory() {
    Object.keys(PROVIDER_MAP).forEach(providerId => {
        if (!conversationHistory[providerId]) {
            conversationHistory[providerId] = [];
        }
        if (!conversationEvents[providerId]) {
            conversationEvents[providerId] = [];
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
    loadLayoutPreference();
    loadSyncScrollPreference();
    loadConfigPanelState();
    loadReferenceDocuments();
    loadSavedConversations();
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

// Save reference documents to localStorage
function saveReferenceDocuments() {
    try {
        localStorage.setItem('asher-reference-docs', JSON.stringify(referenceDocuments));
    } catch (e) {
        console.error('Failed to save reference documents:', e);
        alert('Warning: Could not save reference documents. Storage may be full.');
    }
}

// Load reference documents from localStorage
function loadReferenceDocuments() {
    try {
        const saved = localStorage.getItem('asher-reference-docs');
        if (saved) {
            referenceDocuments = JSON.parse(saved);
            renderReferenceDocuments();
            console.log(`📚 Loaded ${referenceDocuments.length} reference documents from storage`);
        }
    } catch (e) {
        console.error('Failed to load reference documents:', e);
    }
}

// Save current conversation
function saveCurrentConversation() {
    // Check if there's any conversation to save
    const hasContent = Object.values(conversationHistory).some(history => history.length > 0);

    if (!hasContent) {
        alert('No conversation to save. Start chatting first!');
        return;
    }

    const name = prompt('Enter a name for this conversation:');
    if (!name || !name.trim()) return;

    const conversation = {
        id: Date.now(),
        name: name.trim(),
        timestamp: new Date().toISOString(),
        systemPrompt: document.getElementById('system-prompt').value,
        referenceDocuments: JSON.parse(JSON.stringify(referenceDocuments)),
        conversationHistory: JSON.parse(JSON.stringify(conversationHistory)),
        conversationEvents: JSON.parse(JSON.stringify(conversationEvents))
    };

    savedConversations.push(conversation);
    saveSavedConversations();
    renderSavedConversations();

    console.log(`💾 Saved conversation: ${name}`);
}

// Load a saved conversation
function loadConversation(conversationId) {
    const conversation = savedConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    if (!confirm(`Load conversation "${conversation.name}"? This will replace your current conversation.`)) {
        return;
    }

    // Restore system prompt
    document.getElementById('system-prompt').value = conversation.systemPrompt;

    // Restore reference documents
    referenceDocuments = JSON.parse(JSON.stringify(conversation.referenceDocuments));
    renderReferenceDocuments();

    // Restore conversation history
    conversationHistory = JSON.parse(JSON.stringify(conversation.conversationHistory));
    conversationEvents = JSON.parse(JSON.stringify(conversation.conversationEvents));

    // Render all conversations
    Object.keys(conversationHistory).forEach(providerId => {
        const provider = PROVIDER_MAP[providerId];
        if (!provider) return;

        const messagesContainer = document.getElementById(provider.messagesId);
        messagesContainer.innerHTML = '';

        // Render messages
        conversationHistory[providerId].forEach(msg => {
            addMessage(providerId, msg.role, msg.content);
        });

        // If no messages, show empty state
        if (conversationHistory[providerId].length === 0) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <p>💬 ${provider.name} responses will appear here</p>
                </div>
            `;
        }
    });

    console.log(`📂 Loaded conversation: ${conversation.name}`);
}

// Delete a saved conversation
function deleteConversation(conversationId) {
    const conversation = savedConversations.find(c => c.id === conversationId);
    if (!conversation) return;

    if (!confirm(`Delete conversation "${conversation.name}"?`)) {
        return;
    }

    savedConversations = savedConversations.filter(c => c.id !== conversationId);
    saveSavedConversations();
    renderSavedConversations();

    console.log(`🗑️ Deleted conversation: ${conversation.name}`);
}

// Save conversations to localStorage
function saveSavedConversations() {
    try {
        localStorage.setItem('asher-saved-conversations', JSON.stringify(savedConversations));
    } catch (e) {
        console.error('Failed to save conversations:', e);
        alert('Warning: Could not save conversations. Storage may be full.');
    }
}

// Load saved conversations from localStorage
function loadSavedConversations() {
    try {
        const saved = localStorage.getItem('asher-saved-conversations');
        if (saved) {
            savedConversations = JSON.parse(saved);
            renderSavedConversations();
            console.log(`📚 Loaded ${savedConversations.length} saved conversations`);
        }
    } catch (e) {
        console.error('Failed to load saved conversations:', e);
    }
}

// Render saved conversations list
function renderSavedConversations() {
    const container = document.getElementById('saved-conversations');

    if (savedConversations.length === 0) {
        container.innerHTML = '<div class="empty-references">No saved conversations</div>';
        return;
    }

    let html = '';
    // Sort by timestamp, newest first
    const sorted = [...savedConversations].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sorted.forEach(conv => {
        const date = new Date(conv.timestamp).toLocaleDateString();
        const time = new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        html += `
            <div class="saved-conversation-item">
                <div class="saved-conv-info">
                    <div class="saved-conv-name">${conv.name}</div>
                    <div class="saved-conv-meta">${date} at ${time}</div>
                </div>
                <div class="saved-conv-actions">
                    <button class="saved-conv-load-btn" onclick="loadConversation(${conv.id})" title="Load">📂</button>
                    <button class="saved-conv-delete-btn" onclick="deleteConversation(${conv.id})" title="Delete">✕</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Reference document management
function addReferenceDocument() {
    const docId = Date.now();
    const doc = {
        id: docId,
        title: `Document ${referenceDocuments.length + 1}`,
        content: '',
        type: 'text',
        size: 0,
        enabled: true
    };

    referenceDocuments.push(doc);
    renderReferenceDocuments();
    saveReferenceDocuments();
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
                content: data.content,
                type: data.file_type || 'file',
                size: data.content.length,
                enabled: true
            };

            referenceDocuments.push(doc);
            renderReferenceDocuments();
            saveReferenceDocuments();

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
    saveReferenceDocuments();
}

function updateDocumentContent(docId, content) {
    const doc = referenceDocuments.find(d => d.id === docId);
    if (doc) {
        doc.content = content;
        doc.size = content.length;
        saveReferenceDocuments();
    }
}

function toggleDocumentEnabled(docId) {
    const doc = referenceDocuments.find(d => d.id === docId);
    if (doc) {
        doc.enabled = !doc.enabled;
        renderReferenceDocuments();
        saveReferenceDocuments();
    }
}

function toggleDocumentExpand(docId) {
    const contentArea = document.getElementById(`doc-content-${docId}`);
    const expandBtn = document.getElementById(`expand-btn-${docId}`);

    if (contentArea.style.display === 'none') {
        contentArea.style.display = 'block';
        expandBtn.textContent = '▼';
    } else {
        contentArea.style.display = 'none';
        expandBtn.textContent = '▶';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

function getFileIcon(type) {
    const iconMap = {
        'pdf': '📕',
        'text': '📝',
        'markdown': '📝',
        'html': '🌐',
        'json': '{ }',
        'csv': '📊',
        'docx': '📘',
        'doc': '📘'
    };

    return iconMap[type] || '📄';
}

function renderReferenceDocuments() {
    const container = document.getElementById('reference-documents');
    const countElement = document.getElementById('ref-count');

    const enabledCount = referenceDocuments.filter(d => d.enabled).length;
    countElement.textContent = `${referenceDocuments.length} document${referenceDocuments.length !== 1 ? 's' : ''} (${enabledCount} enabled)`;

    if (referenceDocuments.length === 0) {
        container.innerHTML = '<div class="empty-references">No reference documents added</div>';
        return;
    }

    let html = '';
    referenceDocuments.forEach(doc => {
        const icon = getFileIcon(doc.type);
        const size = formatFileSize(doc.size);
        const isTextDoc = doc.type === 'text';
        const enabledClass = doc.enabled ? '' : 'doc-disabled';

        html += `
            <div class="doc-item ${enabledClass}" data-id="${doc.id}">
                <div class="doc-item-header">
                    <input
                        type="checkbox"
                        class="doc-checkbox"
                        ${doc.enabled ? 'checked' : ''}
                        onchange="toggleDocumentEnabled(${doc.id})"
                        title="Enable/Disable"
                    >
                    <span class="doc-icon">${icon}</span>
                    <div class="doc-info">
                        <div class="doc-title">${doc.title}</div>
                        <div class="doc-meta">${size}${doc.content ? ' • ' + doc.content.split(/\s+/).length + ' words' : ''}</div>
                    </div>
                    <div class="doc-actions">
                        ${isTextDoc ? `<button class="doc-expand-btn" id="expand-btn-${doc.id}" onclick="toggleDocumentExpand(${doc.id})" title="Show/Hide Content">▶</button>` : ''}
                        <button class="doc-remove-btn" onclick="removeReferenceDocument(${doc.id})" title="Remove">✕</button>
                    </div>
                </div>
                ${isTextDoc ? `
                <div class="doc-content-area" id="doc-content-${doc.id}" style="display: none;">
                    <textarea
                        placeholder="Enter text content..."
                        onchange="updateDocumentContent(${doc.id}, this.value)"
                    >${doc.content}</textarea>
                </div>
                ` : ''}
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

    // Add reference documents (only enabled ones)
    const enabledDocs = referenceDocuments.filter(doc => doc.enabled);
    if (enabledDocs.length > 0) {
        context += '\n\n=== REFERENCE DOCUMENTS ===\n\n';

        enabledDocs.forEach(doc => {
            if (doc.content.trim()) {
                context += `--- ${doc.title} ---\n${doc.content}\n\n`;
            }
        });
    }

    return context;
}

// Detect if context has changed
function detectContextChanges(activeProviders) {
    const newContext = buildContext();

    // Check if context changed
    if (currentSystemContext !== null && currentSystemContext !== newContext) {
        const timestamp = new Date().toISOString();
        const changeEvent = {
            type: 'context_change',
            timestamp: timestamp,
            message: 'System prompt or reference documents changed'
        };

        // Log the change for all active providers
        activeProviders.forEach(providerId => {
            if (!conversationEvents[providerId]) {
                conversationEvents[providerId] = [];
            }
            conversationEvents[providerId].push(changeEvent);

            // Add visual indicator to chat
            addContextChangeIndicator(providerId, changeEvent.message);
        });
    }

    currentSystemContext = newContext;
}

// Add context change indicator to chat
function addContextChangeIndicator(providerId, message) {
    const provider = PROVIDER_MAP[providerId];
    if (!provider) return;

    const messagesContainer = document.getElementById(provider.messagesId);

    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'context-change-indicator';
    indicatorDiv.innerHTML = `
        <div class="context-change-content">
            <span class="context-change-icon">⚙️</span>
            <span class="context-change-text">${message}</span>
        </div>
    `;

    messagesContainer.appendChild(indicatorDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

    if (tokensElement) {
        tokensElement.textContent = `${tokens} tokens`;
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

    // Detect context changes before sending
    detectContextChanges(activeProviders);

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

    // Reset conversation history and events
    Object.keys(conversationHistory).forEach(key => {
        conversationHistory[key] = [];
    });
    Object.keys(conversationEvents).forEach(key => {
        conversationEvents[key] = [];
    });

    // Reset current context
    currentSystemContext = null;

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
    });

    console.log('🧹 All chats cleared');
}

// Toggle panel fullscreen
function togglePanelExpand(panelId) {
    const panel = document.getElementById(panelId);
    panel.classList.toggle('expanded');
}

// Toggle layout between quad split and 4 columns
function toggleLayout() {
    const chatGrid = document.querySelector('.chat-grid');
    const toggleBtn = document.getElementById('layout-toggle');

    isColumnsLayout = !isColumnsLayout;

    if (isColumnsLayout) {
        chatGrid.classList.add('columns-layout');
        toggleBtn.textContent = 'Switch to Quad Split';
    } else {
        chatGrid.classList.remove('columns-layout');
        toggleBtn.textContent = 'Switch to 4 Columns';
    }

    localStorage.setItem('asher-layout', isColumnsLayout ? 'columns' : 'quad');
}

// Load saved layout preference
function loadLayoutPreference() {
    const savedLayout = localStorage.getItem('asher-layout');
    if (savedLayout === 'columns') {
        const chatGrid = document.querySelector('.chat-grid');
        const toggleBtn = document.getElementById('layout-toggle');

        isColumnsLayout = true;
        chatGrid.classList.add('columns-layout');
        toggleBtn.textContent = 'Switch to Quad Split';
    }
}

// Toggle synchronized scrolling
function toggleSyncScroll() {
    const checkbox = document.getElementById('sync-scroll');
    isSyncScrollEnabled = checkbox.checked;

    const messageContainers = [
        document.getElementById('messages-openai'),
        document.getElementById('messages-claude'),
        document.getElementById('messages-gemini'),
        document.getElementById('messages-grok')
    ];

    if (isSyncScrollEnabled) {
        messageContainers.forEach((container, index) => {
            container.addEventListener('scroll', createSyncScrollHandler(index, messageContainers));
        });
    } else {
        messageContainers.forEach(container => {
            // Remove all event listeners by cloning and replacing
            const newContainer = container.cloneNode(true);
            container.parentNode.replaceChild(newContainer, container);
        });
    }

    localStorage.setItem('asher-sync-scroll', isSyncScrollEnabled);
}

// Create synchronized scroll handler
function createSyncScrollHandler(sourceIndex, containers) {
    return function(e) {
        if (!isSyncScrollEnabled) return;

        const scrollPercentage = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight);

        containers.forEach((container, index) => {
            if (index !== sourceIndex) {
                const targetScrollTop = scrollPercentage * (container.scrollHeight - container.clientHeight);
                container.scrollTop = targetScrollTop;
            }
        });
    };
}

// Load saved sync scroll preference
function loadSyncScrollPreference() {
    const savedSyncScroll = localStorage.getItem('asher-sync-scroll');
    if (savedSyncScroll === 'true') {
        const checkbox = document.getElementById('sync-scroll');
        checkbox.checked = true;
        toggleSyncScroll();
    }
}

// Toggle configuration panel
function toggleConfigPanel() {
    const panel = document.getElementById('config-panel');
    const hamburger = document.getElementById('hamburger-btn');

    isConfigPanelOpen = !isConfigPanelOpen;

    if (isConfigPanelOpen) {
        panel.classList.remove('closed');
        hamburger.classList.add('active');
    } else {
        panel.classList.add('closed');
        hamburger.classList.remove('active');
    }

    localStorage.setItem('asher-config-panel', isConfigPanelOpen);
}

// Load saved config panel state
function loadConfigPanelState() {
    const savedState = localStorage.getItem('asher-config-panel');
    const panel = document.getElementById('config-panel');
    const hamburger = document.getElementById('hamburger-btn');

    // Default to open if no saved state
    if (savedState === null || savedState === 'true') {
        isConfigPanelOpen = true;
        panel.classList.remove('closed');
        hamburger.classList.add('active');
    } else {
        isConfigPanelOpen = false;
        panel.classList.add('closed');
        hamburger.classList.remove('active');
    }
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
        conversations: {},
        events: {}
    };

    // Export conversation history and events for each provider
    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            exportData.conversations[providerId] = conversationHistory[providerId];
        }
        if (conversationEvents[providerId] && conversationEvents[providerId].length > 0) {
            exportData.events[providerId] = conversationEvents[providerId];
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
            const status = doc.enabled ? 'ENABLED' : 'DISABLED';
            text += `\n--- ${doc.title} (${status}) ---\n${doc.content}\n`;
        });
        text += `\n`;
    }

    text += `CONVERSATIONS:\n${'='.repeat(80)}\n\n`;

    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            const provider = PROVIDER_MAP[providerId];
            text += `\n### ${provider.name} ###\n\n`;

            // Interleave conversation messages and events by timestamp
            const combined = [];

            conversationHistory[providerId].forEach((msg, idx) => {
                combined.push({ type: 'message', data: msg, index: idx });
            });

            if (conversationEvents[providerId]) {
                conversationEvents[providerId].forEach(event => {
                    combined.push({ type: 'event', data: event });
                });
            }

            // For plain text, just show in order
            combined.forEach(item => {
                if (item.type === 'message') {
                    text += `[${item.data.role.toUpperCase()}]\n${item.data.content}\n\n`;
                } else if (item.type === 'event') {
                    text += `[CONTEXT CHANGE - ${new Date(item.data.timestamp).toLocaleString()}]\n${item.data.message}\n\n`;
                }
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
            const status = doc.enabled ? '✅ ENABLED' : '❌ DISABLED';
            md += `### ${doc.title} ${status}\n\n\`\`\`\n${doc.content}\n\`\`\`\n\n`;
        });
    }

    md += `## Conversations\n\n`;

    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            const provider = PROVIDER_MAP[providerId];
            md += `### ${provider.name}\n\n`;

            // Show events and messages
            const combined = [];

            conversationHistory[providerId].forEach((msg, idx) => {
                combined.push({ type: 'message', data: msg, index: idx });
            });

            if (conversationEvents[providerId]) {
                conversationEvents[providerId].forEach(event => {
                    combined.push({ type: 'event', data: event });
                });
            }

            combined.forEach(item => {
                if (item.type === 'message') {
                    const msg = item.data;
                    if (msg.role === 'user') {
                        md += `**User:**\n\n${msg.content}\n\n`;
                    } else {
                        md += `**Assistant:**\n\n${msg.content}\n\n`;
                    }
                    md += `---\n\n`;
                } else if (item.type === 'event') {
                    md += `> ⚙️ **Context Change** (${new Date(item.data.timestamp).toLocaleString()}): ${item.data.message}\n\n`;
                }
            });
        }
    });

    downloadFile(md, `asher-results-${Date.now()}.md`, 'text/markdown');
    console.log('📥 Markdown exported');
}

// Export as PDF
function exportAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const systemPrompt = document.getElementById('system-prompt').value;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add text with word wrap
    function addText(text, fontSize, isBold = false) {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');

        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            if (yPos > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += fontSize * 0.5;
        });
        yPos += 5;
    }

    // Title
    addText('ASHER Test Results', 18, true);
    addText(`Date: ${new Date().toLocaleString()}`, 10);
    yPos += 5;

    // System Prompt
    if (systemPrompt) {
        addText('System Prompt:', 14, true);
        addText(systemPrompt, 10);
        yPos += 5;
    }

    // Reference Documents
    if (referenceDocuments.length > 0) {
        addText('Reference Documents:', 14, true);
        referenceDocuments.forEach(doc => {
            const status = doc.enabled ? '(ENABLED)' : '(DISABLED)';
            addText(`${doc.title} ${status}`, 11, true);
            if (doc.content) {
                addText(doc.content, 9);
            }
        });
        yPos += 5;
    }

    // Conversations
    addText('Conversations:', 14, true);

    Object.keys(conversationHistory).forEach(providerId => {
        if (conversationHistory[providerId].length > 0) {
            const provider = PROVIDER_MAP[providerId];

            addText(provider.name, 12, true);

            // Combine messages and events
            const combined = [];
            conversationHistory[providerId].forEach((msg, idx) => {
                combined.push({ type: 'message', data: msg, index: idx });
            });

            if (conversationEvents[providerId]) {
                conversationEvents[providerId].forEach(event => {
                    combined.push({ type: 'event', data: event });
                });
            }

            combined.forEach(item => {
                if (item.type === 'message') {
                    const msg = item.data;
                    addText(`[${msg.role.toUpperCase()}]`, 10, true);
                    addText(msg.content, 9);
                } else if (item.type === 'event') {
                    addText(`[CONTEXT CHANGE - ${new Date(item.data.timestamp).toLocaleString()}]`, 9, true);
                    addText(item.data.message, 9);
                }
            });

            yPos += 10;
        }
    });

    doc.save(`asher-results-${Date.now()}.pdf`);
    console.log('📥 PDF exported');
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

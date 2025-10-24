// ASHER - AI Provider Testing Lab
// Simultaneous A/B/C/D Testing

// API Configuration - Backend runs on port 8001
const API_BASE = window.location.port === '8888'
    ? 'http://localhost:8001'  // When frontend is on dev server
    : window.location.origin;   // When served from backend directly

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
    showOnboardingIfNeeded();
});

// Show onboarding banner for first-time users
function showOnboardingIfNeeded() {
    const hasSeenOnboarding = localStorage.getItem('asher-onboarding-seen');

    if (!hasSeenOnboarding) {
        const chatGrid = document.getElementById('chat-grid-container');
        const banner = document.createElement('div');
        banner.className = 'onboarding-banner';
        banner.id = 'onboarding-banner';
        banner.innerHTML = `
            <div class="onboarding-content">
                <div class="onboarding-text">
                    <div class="onboarding-title">Welcome to ASHER</div>
                    <div class="onboarding-description">Click the menu to configure providers, then type a prompt below to compare AI responses side-by-side</div>
                </div>
            </div>
            <button class="onboarding-close" onclick="dismissOnboarding()">Close</button>
        `;

        chatGrid.parentElement.insertBefore(banner, chatGrid);

        // Add subtle pulse to hamburger menu
        const hamburger = document.getElementById('hamburger-btn');
        if (hamburger) {
            setTimeout(() => {
                hamburger.classList.add('hint-pulse');
                setTimeout(() => {
                    hamburger.classList.remove('hint-pulse');
                }, 6000); // 3 pulses × 2s
            }, 1000);
        }
    }
}

function dismissOnboarding() {
    const banner = document.getElementById('onboarding-banner');
    if (banner) {
        banner.style.animation = 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            banner.remove();
        }, 300);
    }
    localStorage.setItem('asher-onboarding-seen', 'true');
}

// Setup keyboard shortcuts
function setupEnterKeyHandler() {
    const textarea = document.getElementById('test-message');

    // Enter to send
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToAllProviders();
        }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + Enter: Send to all providers (from anywhere)
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            sendToAllProviders();
        }

        // Cmd/Ctrl + K: Focus input
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            textarea.focus();
        }

        // Cmd/Ctrl + C: Copy last response (when not selecting text)
        if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !window.getSelection().toString()) {
            const lastResponse = document.querySelector('.message-bubble.assistant:last-of-type .message-content');
            if (lastResponse) {
                e.preventDefault();
                copyToClipboard(lastResponse.textContent);
                showToast('Last response copied!');
            }
        }

        // Escape: Toggle sidebar (open/close)
        if (e.key === 'Escape') {
            e.preventDefault();
            toggleConfigPanel();
        }

        // Cmd/Ctrl + /: Show keyboard shortcuts help
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

// Toast notification helper
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Copy to clipboard helper
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy:', err);
    });
}

// Show keyboard shortcuts modal
function showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'shortcuts-modal';
    modal.innerHTML = `
        <div class="shortcuts-content">
            <div class="shortcuts-header">
                <h3>Keyboard Shortcuts</h3>
                <button onclick="this.closest('.shortcuts-modal').remove()">Close</button>
            </div>
            <div class="shortcuts-list">
                <div class="shortcut-item">
                    <kbd>⌘ Enter</kbd>
                    <span>Send to all providers</span>
                </div>
                <div class="shortcut-item">
                    <kbd>⌘ K</kbd>
                    <span>Focus input</span>
                </div>
                <div class="shortcut-item">
                    <kbd>⌘ C</kbd>
                    <span>Copy last response</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Escape</kbd>
                    <span>Toggle sidebar</span>
                </div>
                <div class="shortcut-item">
                    <kbd>⌘ /</kbd>
                    <span>Show this help</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// State for API key modal
let currentProviderId = null;

// Toggle provider checkbox visual feedback
function toggleProviderCheckbox(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        toggleProviderVisual(checkbox);
    }
}

function toggleProviderVisual(checkbox) {
    const parentDiv = checkbox.closest('.provider-checkbox');
    if (parentDiv) {
        if (checkbox.checked) {
            parentDiv.classList.add('checked');
        } else {
            parentDiv.classList.remove('checked');
        }
    }

    // Update panel active state
    const panelMap = {
        'provider-openai': 'panel-openai',
        'provider-claude': 'panel-claude',
        'provider-gemini': 'panel-gemini',
        'provider-grok': 'panel-grok'
    };

    const panelId = panelMap[checkbox.id];
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            if (checkbox.checked) {
                panel.classList.add('provider-active');
            } else {
                panel.classList.remove('provider-active');
            }
        }
    }

    // Update panel visibility hint
    updateSelectedProvidersCount();
}

function updateSelectedProvidersCount() {
    const selected = getActiveProviders();
    const sendBtn = document.getElementById('send-btn');

    if (selected.length === 0) {
        sendBtn.textContent = 'Select providers first';
        sendBtn.disabled = true;
    } else {
        sendBtn.textContent = `Send to ${selected.length} Provider${selected.length > 1 ? 's' : ''}`;
        sendBtn.disabled = false;
    }

    // Update smart layout
    updateSmartLayout();
}

// Smart auto-hide and layout adjustment
function updateSmartLayout() {
    const chatGrid = document.querySelector('.chat-grid');
    if (!chatGrid) return;

    const panels = document.querySelectorAll('.chat-panel');
    const activePanels = document.querySelectorAll('.chat-panel.provider-active');
    const activeCount = activePanels.length;

    // Remove all active-* classes
    chatGrid.classList.remove('active-1', 'active-2', 'active-3', 'active-4');

    // Add class based on active count
    if (activeCount > 0) {
        chatGrid.classList.add(`active-${activeCount}`);
    }

    // Auto-hide inactive panels
    panels.forEach(panel => {
        if (!panel.classList.contains('provider-active') && !panel.classList.contains('expanded')) {
            panel.classList.add('auto-hidden');
        } else {
            panel.classList.remove('auto-hidden');
        }
    });
}

// Initialize panel active states based on checkboxes
function initializePanelStates() {
    const panelMap = {
        'provider-openai': 'panel-openai',
        'provider-claude': 'panel-claude',
        'provider-gemini': 'panel-gemini',
        'provider-grok': 'panel-grok'
    };

    Object.keys(panelMap).forEach(checkboxId => {
        const checkbox = document.getElementById(checkboxId);
        const panel = document.getElementById(panelMap[checkboxId]);

        if (checkbox && panel) {
            if (checkbox.checked) {
                panel.classList.add('provider-active');
            } else {
                panel.classList.remove('provider-active');
            }
        }
    });

    // Update smart layout after initializing
    updateSmartLayout();
}
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
                const checkedClass = provider.available ? 'checked' : '';

                html += `
                    <div class="provider-checkbox ${checkedClass}" onclick="toggleProviderCheckbox('${checkboxId}')">
                        <input type="checkbox" id="${checkboxId}" value="${id}" ${provider.available ? 'checked' : ''} onclick="event.stopPropagation(); toggleProviderVisual(this);">
                        <span class="provider-name">${provider.name}</span>
                        <button class="config-icon" onclick="event.stopPropagation(); openApiKeyModal('${id}')" title="Configure API Key">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
                            </svg>
                        </button>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                `;
            }
        });

        statusContainer.innerHTML = html || '<div class="status-loading">No providers available</div>';

        // Initialize button state and panel visibility
        updateSelectedProvidersCount();
        initializePanelStates();

    } catch (error) {
        console.error('Error loading provider status:', error);
        statusContainer.innerHTML = '<div class="status-loading">⚠️ Error loading providers. Check your connection.</div>';
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
                    <div class="empty-state-icon">💬</div>
                    <div class="empty-state-title">Ready to test</div>
                    <div class="empty-state-description">Send a prompt below to see ${provider.name} responses here</div>
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

    // Add action buttons for assistant messages
    if (role === 'assistant' && !isError) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        // Star/Mark as best button
        const starBtn = document.createElement('button');
        starBtn.className = 'action-btn star-btn';
        starBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        starBtn.title = 'Mark as best';
        starBtn.onclick = () => toggleStar(messageDiv, starBtn, providerId);
        actionsDiv.appendChild(starBtn);

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        copyBtn.title = 'Copy response';
        copyBtn.onclick = () => copyMessageQuick(content, copyBtn);
        actionsDiv.appendChild(copyBtn);

        // Regenerate button
        const regenBtn = document.createElement('button');
        regenBtn.className = 'action-btn regen-btn';
        regenBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
        regenBtn.title = 'Regenerate';
        regenBtn.onclick = () => regenerateResponse(providerId);
        actionsDiv.appendChild(regenBtn);

        messageDiv.appendChild(actionsDiv);
    }

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageDiv;
}

// Copy message content to clipboard (quick action)
function copyMessageQuick(content, button) {
    navigator.clipboard.writeText(content).then(() => {
        button.innerHTML = '✓';
        button.classList.add('copied');
        showToast('Response copied!');

        setTimeout(() => {
            button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        button.innerHTML = '✗';
        showToast('Failed to copy', 1500);
        setTimeout(() => {
            button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 2000);
    });
}

// Toggle star/mark as best
function toggleStar(messageDiv, button, providerId) {
    const wasStarred = button.classList.contains('starred');

    // Remove all stars from this panel
    const panel = messageDiv.closest('.chat-panel');
    panel.querySelectorAll('.star-btn.starred').forEach(btn => {
        btn.classList.remove('starred');
    });

    // Toggle this star
    if (!wasStarred) {
        button.classList.add('starred');
        messageDiv.classList.add('starred-message');
        showToast('Marked as best response!');
    } else {
        messageDiv.classList.remove('starred-message');
    }
}

// Regenerate last response
function regenerateResponse(providerId) {
    const history = conversationHistory[providerId];
    if (history.length < 2) {
        showToast('Nothing to regenerate', 1500);
        return;
    }

    // Remove last assistant message
    history.pop();

    // Get last user message
    const lastUserMsg = history[history.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== 'user') {
        showToast('No user message found', 1500);
        return;
    }

    // Resend to provider
    showToast('Regenerating response...');
    sendToProvider(providerId, lastUserMsg.content);
}

// Copy message content to clipboard (old function for compatibility)
function copyMessage(content, button) {
    copyMessageQuick(content, button);
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

    // Get provider-specific configuration
    const model = document.getElementById(`${providerId}-model`)?.value;
    const temperature = parseFloat(document.getElementById(`${providerId}-temp`)?.value || '1.0');
    const apiKey = document.getElementById(`${providerId}-key`)?.value;

    try {
        const requestBody = {
            provider: providerId,
            message: message,
            system_prompt: systemContext,
            conversation_history: conversationHistory[providerId] || []
        };

        // Add optional parameters if set
        if (model) requestBody.model = model;
        if (temperature !== undefined) requestBody.temperature = temperature;
        if (apiKey) requestBody.api_key = apiKey;

        const response = await fetch(`${API_BASE}/asher/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
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
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-title">Ready to test</div>
                <div class="empty-state-description">Type your prompt below and send it to compare responses</div>
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

// Provider Accordion Functions
function toggleProviderConfig(providerId) {
    const providerItem = document.querySelector(`.provider-item[data-provider="${providerId}"]`);
    const isExpanded = providerItem.classList.contains('expanded');

    // Close all other providers
    document.querySelectorAll('.provider-item').forEach(item => {
        if (item.getAttribute('data-provider') !== providerId) {
            item.classList.remove('expanded');
        }
    });

    // Toggle current provider
    if (isExpanded) {
        providerItem.classList.remove('expanded');
    } else {
        providerItem.classList.add('expanded');
    }
}

function toggleProvider(providerId, enabled) {
    const panel = document.getElementById(`panel-${providerId}`);

    if (enabled) {
        panel.classList.add('provider-active');
        enabledProviders.add(providerId);
    } else {
        panel.classList.remove('provider-active');
        enabledProviders.delete(providerId);
    }

    // Update visibility based on layout
    updatePanelVisibility();

    // Save to localStorage
    localStorage.setItem(`provider-${providerId}-enabled`, enabled);
}

function updateTempDisplay(providerId, value) {
    const display = document.getElementById(`${providerId}-temp-display`);
    if (display) {
        display.textContent = parseFloat(value).toFixed(1);
    }
}

// Load saved provider configurations
function loadProviderConfigs() {
    const providers = ['openai', 'claude', 'gemini', 'grok'];

    providers.forEach(provider => {
        // Load enabled state
        const enabled = localStorage.getItem(`provider-${provider}-enabled`) === 'true';
        const checkbox = document.getElementById(`${provider}-enabled`);
        if (checkbox) {
            checkbox.checked = enabled;
            toggleProvider(provider, enabled);
        }

        // Load model selection
        const savedModel = localStorage.getItem(`provider-${provider}-model`);
        const modelSelect = document.getElementById(`${provider}-model`);
        if (savedModel && modelSelect) {
            modelSelect.value = savedModel;
        }

        // Load temperature
        const savedTemp = localStorage.getItem(`provider-${provider}-temp`);
        const tempInput = document.getElementById(`${provider}-temp`);
        if (savedTemp && tempInput) {
            tempInput.value = savedTemp;
            updateTempDisplay(provider, savedTemp);
        }

        // Load API key
        const savedKey = localStorage.getItem(`provider-${provider}-key`);
        const keyInput = document.getElementById(`${provider}-key`);
        if (savedKey && keyInput) {
            keyInput.value = savedKey;
        }
    });
}

// Save provider configuration when changed
function saveProviderConfig(providerId, field, value) {
    localStorage.setItem(`provider-${providerId}-${field}`, value);
}

// Add event listeners for saving configs
document.addEventListener('DOMContentLoaded', () => {
    const providers = ['openai', 'claude', 'gemini', 'grok'];

    providers.forEach(provider => {
        // Model select
        const modelSelect = document.getElementById(`${provider}-model`);
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                saveProviderConfig(provider, 'model', e.target.value);
            });
        }

        // Temperature slider
        const tempInput = document.getElementById(`${provider}-temp`);
        if (tempInput) {
            tempInput.addEventListener('change', (e) => {
                saveProviderConfig(provider, 'temp', e.target.value);
            });
        }

        // API key
        const keyInput = document.getElementById(`${provider}-key`);
        if (keyInput) {
            keyInput.addEventListener('blur', (e) => {
                saveProviderConfig(provider, 'key', e.target.value);
            });
        }
    });

    // Load saved configurations
    loadProviderConfigs();
});

// Load saved config panel state
function loadConfigPanelState() {
    const savedState = localStorage.getItem('asher-config-panel');
    const panel = document.getElementById('config-panel');
    const hamburger = document.getElementById('hamburger-btn');

    // Default to CLOSED on first visit for cleaner UX
    if (savedState === 'true') {
        isConfigPanelOpen = true;
        panel.classList.remove('closed');
        hamburger.classList.add('active');
    } else {
        isConfigPanelOpen = false;
        panel.classList.add('closed');
        hamburger.classList.remove('active');
    }
}

// Export results with comparison options
// Handle export dropdown selection
function handleExport(format) {
    if (!format) return;

    switch(format) {
        case 'json':
            exportResults();
            break;
        case 'text':
            exportAsPlainText();
            break;
        case 'markdown':
            exportAsMarkdown();
            break;
        case 'pdf':
            exportAsPDF();
            break;
    }
}

function exportResults() {
    // Ask user what format they want
    const format = prompt('Export format:\n1. JSON (detailed)\n2. Markdown Table (comparison)\n3. Both\n\nEnter 1, 2, or 3:', '3');

    if (!format || !['1', '2', '3'].includes(format)) {
        return;
    }

    const systemPrompt = document.getElementById('system-prompt').value;
    const activeProviders = getActiveProviders();

    if (format === '1' || format === '3') {
        exportJSON();
    }

    if (format === '2' || format === '3') {
        exportMarkdownTable();
    }

    showToast('Export complete!');
}

// Export as JSON
function exportJSON() {
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

// Export as Markdown comparison table
function exportMarkdownTable() {
    const systemPrompt = document.getElementById('system-prompt').value;
    const activeProviders = getActiveProviders();

    let markdown = `# ASHER A/B/C/D Test Results\n\n`;
    markdown += `**Date:** ${new Date().toLocaleString()}\n\n`;

    if (systemPrompt) {
        markdown += `## System Prompt\n\`\`\`\n${systemPrompt}\n\`\`\`\n\n`;
    }

    // Build comparison table
    markdown += `## Response Comparison\n\n`;
    markdown += `| Prompt | ${activeProviders.map(p => PROVIDER_MAP[p].name).join(' | ')} |\n`;
    markdown += `|--------|${activeProviders.map(() => '--------').join('|')}|\n`;

    // Get all unique user prompts
    const allPrompts = new Set();
    activeProviders.forEach(providerId => {
        conversationHistory[providerId]?.forEach(msg => {
            if (msg.role === 'user') {
                allPrompts.add(msg.content);
            }
        });
    });

    // For each prompt, show responses from all providers
    allPrompts.forEach(prompt => {
        const responses = activeProviders.map(providerId => {
            const history = conversationHistory[providerId] || [];
            const userMsgIndex = history.findIndex(m => m.role === 'user' && m.content === prompt);
            if (userMsgIndex !== -1 && userMsgIndex + 1 < history.length) {
                const response = history[userMsgIndex + 1].content;
                // Truncate and escape for table
                return response.substring(0, 200).replace(/\|/g, '\\|').replace(/\n/g, '<br>') + (response.length > 200 ? '...' : '');
            }
            return '_No response_';
        });

        const truncatedPrompt = prompt.substring(0, 100).replace(/\|/g, '\\|').replace(/\n/g, '<br>') + (prompt.length > 100 ? '...' : '');
        markdown += `| ${truncatedPrompt} | ${responses.join(' | ')} |\n`;
    });

    // Add stats
    markdown += `\n## Statistics\n\n`;
    markdown += `| Provider | Messages | Avg Response Time |\n`;
    markdown += `|----------|----------|-------------------|\n`;

    activeProviders.forEach(providerId => {
        const provider = PROVIDER_MAP[providerId];
        const messageCount = conversationHistory[providerId]?.filter(m => m.role === 'assistant').length || 0;
        const events = conversationEvents[providerId] || [];
        const responseTimes = events.filter(e => e.type === 'response_time').map(e => e.duration);
        const avgTime = responseTimes.length > 0
            ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(2)
            : 'N/A';

        markdown += `| ${provider.name} | ${messageCount} | ${avgTime}s |\n`;
    });

    // Add winner if any message is starred
    const starredMessages = document.querySelectorAll('.starred-message');
    if (starredMessages.length > 0) {
        markdown += `\n## Best Responses\n\n`;
        starredMessages.forEach(msg => {
            const panel = msg.closest('.chat-panel');
            const panelId = panel.id.replace('panel-', '');
            const provider = Object.values(PROVIDER_MAP).find(p => p.messagesId.includes(panelId));
            const content = msg.querySelector('.message-content').textContent;
            markdown += `### BEST: ${provider?.name || 'Unknown'}\n\`\`\`\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}\n\`\`\`\n\n`;
        });
    }

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asher-comparison-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Markdown comparison exported');
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
                    md += `> **Context Change** (${new Date(item.data.timestamp).toLocaleString()}): ${item.data.message}\n\n`;
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

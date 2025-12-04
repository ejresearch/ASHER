// AsherGO - Main Application JavaScript

// Auto-detect API base - use same origin (works for both local and production)
const API_BASE = window.location.origin;

// State
let authToken = localStorage.getItem('ashergo_token');
let currentUser = null;
let currentConversation = null;
let conversations = [];
let currentTab = 'all';
let referenceDocuments = [];

// Provider configuration (static info)
const PROVIDER_INFO = {
    '1': { id: 'openai', name: 'ChatGPT', defaultModel: 'gpt-5.1' },
    '2': { id: 'claude', name: 'Claude', defaultModel: 'claude-sonnet-4.5' },
    '3': { id: 'gemini', name: 'Gemini', defaultModel: 'gemini-2.5-pro' },
    '4': { id: 'grok', name: 'Grok', defaultModel: 'grok-4.1-fast' }
};

// Enabled providers (Set-based like main ASHER branch)
let enabledProviders = new Set(['1', '2', '3', '4']); // All enabled by default

// Selected models per provider
let providerModels = {
    '1': 'gpt-5.1',
    '2': 'claude-sonnet-4.5',
    '3': 'gemini-2.5-pro',
    '4': 'grok-4.1-fast'
};

// Reset providers to defaults (for new conversations)
function resetProvidersToDefault() {
    enabledProviders = new Set(['1', '2', '3', '4']);
    providerModels = {
        '1': 'gpt-5.1',
        '2': 'claude-sonnet-4.5',
        '3': 'gemini-2.5-pro',
        '4': 'grok-4.1-fast'
    };
    initProviderUI();
}

// Load provider settings from conversation data
function loadProviderSettings(settings) {
    // Start with defaults
    enabledProviders = new Set(['1', '2', '3', '4']);
    providerModels = {
        '1': 'gpt-5.1',
        '2': 'claude-sonnet-4.5',
        '3': 'gemini-2.5-pro',
        '4': 'grok-4.1-fast'
    };

    // Apply saved settings if any
    if (settings && Object.keys(settings).length > 0) {
        Object.keys(settings).forEach(num => {
            if (PROVIDER_INFO[num]) {
                // Handle enabled state
                if (settings[num].enabled === false) {
                    enabledProviders.delete(num);
                } else {
                    enabledProviders.add(num);
                }
                // Handle model
                if (settings[num].model) {
                    providerModels[num] = settings[num].model;
                }
            }
        });
    }

    initProviderUI();
}

// Save provider settings to current conversation
async function saveProviderSettings() {
    if (!currentConversation) return;

    const settings = {};
    ['1', '2', '3', '4'].forEach(num => {
        settings[num] = {
            enabled: enabledProviders.has(num),
            model: providerModels[num]
        };
    });

    try {
        const response = await fetch(`${API_BASE}/api/conversations/${currentConversation.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ provider_settings: settings })
        });
        await response.json();
    } catch (error) {
        console.error('Error saving provider settings:', error);
    }
}

// Initialize provider UI from state
function initProviderUI() {
    ['1', '2', '3', '4'].forEach(num => {
        const isEnabled = enabledProviders.has(num);
        const model = providerModels[num];

        const toggle = document.getElementById(`toggle-${num}`);
        const select = document.getElementById(`model-${num}`);
        const badge = document.getElementById(`badge-${num}`);
        const panel = document.getElementById(`panel-${num}`);
        const tab = document.querySelector(`.tab[data-tab="${num}"]`);

        if (toggle) toggle.checked = isEnabled;
        if (select) {
            select.value = model;
            select.disabled = !isEnabled;
        }
        if (badge) badge.classList.toggle('disabled', !isEnabled);
        if (panel) panel.classList.toggle('disabled', !isEnabled);
        if (tab) tab.classList.toggle('disabled', !isEnabled);
    });
}

// Toggle provider popover
function toggleProviderPopover(num, event) {
    event.stopPropagation();

    // Close any open popovers first
    document.querySelectorAll('.provider-popover').forEach(p => {
        if (p.id !== `popover-${num}`) {
            p.classList.remove('visible');
        }
    });

    const popover = document.getElementById(`popover-${num}`);
    popover.classList.toggle('visible');
}

// Close popovers when clicking outside
function closeAllPopovers() {
    document.querySelectorAll('.provider-popover').forEach(p => {
        p.classList.remove('visible');
    });
}

// Toggle provider enabled/disabled
function toggleProvider(num) {
    const toggle = document.getElementById(`toggle-${num}`);
    const badge = document.getElementById(`badge-${num}`);
    const select = document.getElementById(`model-${num}`);
    const panel = document.getElementById(`panel-${num}`);
    const tab = document.querySelector(`.tab[data-tab="${num}"]`);

    const wasEnabled = enabledProviders.has(num);
    const isNowEnabled = toggle.checked;

    // Update the Set
    if (isNowEnabled) {
        enabledProviders.add(num);
    } else {
        enabledProviders.delete(num);
    }

    badge.classList.toggle('disabled', !isNowEnabled);
    panel.classList.toggle('disabled', !isNowEnabled);
    select.disabled = !isNowEnabled;
    if (tab) tab.classList.toggle('disabled', !isNowEnabled);

    saveProviderSettings();

    // Re-render messages to show/hide based on enabled state
    if (currentConversation) {
        renderMessages();
    }
}

// Set provider model
function setProviderModel(num, model) {
    providerModels[num] = model;
    saveProviderSettings();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    if (authToken) {
        checkAuth();
    } else {
        showAuthScreen();
    }
    setupEventListeners();

    // Close popovers when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.provider-badge') && !e.target.closest('.provider-popover')) {
            closeAllPopovers();
        }
    });

    // Initialize provider UI with defaults
    initProviderUI();

    // Start logo provider carousel rotation
    startLogoCarousel();
});

// Logo provider carousel animation
function startLogoCarousel() {
    const carousels = [
        document.querySelectorAll('.logo-provider-icon'),
        document.querySelectorAll('.welcome-provider-icon')
    ];

    let currentIndex = 0;

    setInterval(() => {
        carousels.forEach(icons => {
            if (icons.length > 0) {
                icons.forEach(icon => icon.classList.remove('active'));
                currentIndex = (currentIndex + 1) % icons.length;
                icons[currentIndex].classList.add('active');
            }
        });
    }, 1000);
}

// Theme
function loadTheme() {
    const savedTheme = localStorage.getItem('asher-theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    // Set toggle checkbox state when settings modal opens
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.checked = savedTheme === 'dark';
    }
}

function toggleTheme() {
    const toggle = document.getElementById('theme-toggle');
    const isDark = toggle.checked;

    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('asher-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('asher-theme', 'light');
    }
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);

    // Message input
    const input = document.getElementById('message-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // New conversation modal - enter key
    document.getElementById('convo-title').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            createConversation();
        }
    });

    // Document upload
    document.getElementById('doc-upload').addEventListener('change', handleDocumentUpload);

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Check if user is typing in an input field
        const isTyping = document.activeElement.tagName === 'INPUT' ||
                         document.activeElement.tagName === 'TEXTAREA';

        // Escape key - toggle sidebar or close modals
        if (e.key === 'Escape') {
            // Check if any modal is open and close it
            const settingsModal = document.getElementById('settings-modal');
            const docsModal = document.getElementById('docs-modal');
            const newConvoModal = document.getElementById('new-convo-modal');

            if (settingsModal.style.display === 'flex') {
                closeSettingsModal();
            } else if (docsModal.style.display === 'flex') {
                closeDocsModal();
            } else if (newConvoModal.style.display === 'flex') {
                closeNewConvoModal();
            } else {
                // No modal open - toggle sidebar
                toggleSidebar();
            }
        }

        // 1-4: Toggle providers (when not typing)
        if (!isTyping && ['1', '2', '3', '4'].includes(e.key)) {
            e.preventDefault();
            // Click the toggle checkbox to trigger the existing toggleProvider function
            const toggle = document.getElementById(`toggle-${e.key}`);
            if (toggle) {
                toggle.click();
            }
        }

        // Shift+? - Show keyboard shortcuts
        if (e.key === '?' && e.shiftKey && !isTyping) {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

// Show keyboard shortcuts modal
function showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'shortcuts-modal';
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Keyboard Shortcuts</h3>
                <button class="modal-close" onclick="document.getElementById('shortcuts-modal').remove()">&times;</button>
            </div>
            <div class="modal-body" style="text-align: left;">
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">1</kbd>
                        <span>Toggle ChatGPT</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">2</kbd>
                        <span>Toggle Claude</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">3</kbd>
                        <span>Toggle Gemini</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">4</kbd>
                        <span>Toggle Grok</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">Esc</kbd>
                        <span>Toggle sidebar / Close modal</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <kbd style="background: var(--bg-tertiary); padding: 0.25rem 0.5rem; border-radius: 4px;">?</kbd>
                        <span>Show this help</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

// Auth Functions
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    loadConversations();
    loadUserInfo();
}

function showLoginForm() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('ashergo_token', authToken);
        showMainApp();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    try {
        const response = await fetch(`${API_BASE}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Signup failed');
        }

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('ashergo_token', authToken);
        showMainApp();
    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        currentUser = await response.json();
        showMainApp();
    } catch (error) {
        localStorage.removeItem('ashergo_token');
        authToken = null;
        showAuthScreen();
    }
}

function logout() {
    localStorage.removeItem('ashergo_token');
    authToken = null;
    currentUser = null;
    currentConversation = null;
    conversations = [];
    closeSettingsModal();
    showAuthScreen();
}

// User Info
function loadUserInfo() {
    if (currentUser) {
        document.getElementById('user-email').textContent = `Email: ${currentUser.email}`;
        let status = currentUser.subscription_status;
        if (status === 'trial' && currentUser.trial_ends_at) {
            const days = Math.ceil((new Date(currentUser.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
            status = `Trial (${days} days left)`;
        }
        document.getElementById('subscription-status').textContent = `Status: ${status}`;

        // Update welcome heading with user's first name
        const welcomeHeading = document.getElementById('welcome-heading');
        if (welcomeHeading && currentUser.first_name) {
            welcomeHeading.textContent = `Hi, ${currentUser.first_name}! Welcome to AsherGO`;
        }
    }
}

// Conversations
async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE}/api/conversations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const data = await response.json();
        conversations = data.conversations || [];
        renderConversationList();
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

function renderConversationList() {
    const list = document.getElementById('conversation-list');

    if (conversations.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 1rem;">No conversations yet</p>';
        return;
    }

    list.innerHTML = conversations.map(convo => `
        <div class="conversation-item ${currentConversation?.id === convo.id ? 'active' : ''}"
             onclick="selectConversation(${convo.id})">
            <span class="title">${escapeHtml(convo.title)}</span>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteConversation(${convo.id})">&times;</button>
        </div>
    `).join('');
}

async function selectConversation(id, skipProviderReload = false) {
    try {
        const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) throw new Error('Failed to load conversation');

        currentConversation = await response.json();

        // Load conversation's system prompt and documents into the UI
        document.getElementById('system-prompt').value = currentConversation.system_prompt || '';
        referenceDocuments = currentConversation.documents || [];
        renderDocumentList();

        // Load provider settings for this conversation (skip if just refreshing messages)
        if (!skipProviderReload) {
            loadProviderSettings(currentConversation.provider_settings);
        }

        renderConversationList();
        showConversation();
    } catch (error) {
        console.error('Error selecting conversation:', error);
    }
}

function showConversation() {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('input-bar').style.display = 'block';

    // Render messages based on current tab
    renderMessages();
}

function renderMessages() {
    const messages = currentConversation?.messages || [];

    if (currentTab === 'all') {
        // Grid view
        document.getElementById('single-view').style.display = 'none';
        document.getElementById('grid-view').style.display = 'grid';

        // Clear all panels
        ['1', '2', '3', '4'].forEach(num => {
            const container = document.getElementById(`messages-${num}`);
            container.innerHTML = '';
        });

        // First, determine which providers have responded to each user message
        // Build a map of user message index -> set of providers that responded
        const userMessageProviders = {};
        let userMsgIndex = -1;
        messages.forEach((msg, i) => {
            if (msg.role === 'user') {
                userMsgIndex++;
                userMessageProviders[userMsgIndex] = new Set();
            } else if (msg.role === 'assistant' && userMsgIndex >= 0) {
                const panelNum = getProviderPanel(msg.model);
                if (panelNum) {
                    userMessageProviders[userMsgIndex].add(panelNum);
                }
            }
        });

        // Now render messages - only show user messages in panels that responded
        userMsgIndex = -1;
        messages.forEach(msg => {
            const panelNum = getProviderPanel(msg.model);
            if (msg.role === 'user') {
                userMsgIndex++;
                // Only add to panels that have a response for this message AND are enabled
                const respondedPanels = userMessageProviders[userMsgIndex] || new Set();
                respondedPanels.forEach(num => {
                    if (enabledProviders.has(num)) {
                        addMessageToPanel(num, 'user', msg.content);
                    }
                });
            } else if (panelNum && enabledProviders.has(panelNum)) {
                addMessageToPanel(panelNum, msg.role, msg.content);
            }
        });
    } else {
        // Single view - only show if provider is enabled
        if (!enabledProviders.has(currentTab)) {
            // Provider is disabled, switch to 'all' view
            currentTab = 'all';
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.tab-btn[data-tab="all"]')?.classList.add('active');
            renderMessages(); // Re-render in grid view
            return;
        }

        document.getElementById('grid-view').style.display = 'none';
        document.getElementById('single-view').style.display = 'flex';

        const container = document.getElementById('single-messages');
        container.innerHTML = '';

        messages.forEach(msg => {
            if (msg.role === 'user' || matchesProvider(msg.model, currentTab)) {
                const div = document.createElement('div');
                div.className = `message-bubble ${msg.role}`;
                div.textContent = msg.content;
                container.appendChild(div);
            }
        });

        container.scrollTop = container.scrollHeight;
    }
}

function getProviderPanel(model) {
    if (!model) return null;
    if (model.includes('openai') || model.includes('gpt')) return '1';
    if (model.includes('claude')) return '2';
    if (model.includes('gemini')) return '3';
    if (model.includes('grok')) return '4';
    return null;
}

function matchesProvider(model, tab) {
    const panel = getProviderPanel(model);
    return panel === tab;
}

function addMessageToPanel(panelNum, role, content) {
    const container = document.getElementById(`messages-${panelNum}`);
    const div = document.createElement('div');
    div.className = `message-bubble ${role}`;
    div.textContent = content;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Build context from system prompt and reference documents
function buildContext() {
    const systemPrompt = document.getElementById('system-prompt').value.trim();

    let context = systemPrompt;

    // Add reference documents
    if (referenceDocuments.length > 0) {
        context += '\n\n=== REFERENCE DOCUMENTS ===\n\n';

        referenceDocuments.forEach(doc => {
            if (doc.content && doc.content.trim()) {
                context += `--- ${doc.filename} ---\n${doc.content}\n\n`;
            }
        });
    }

    return context;
}

// Send Message
async function sendMessage() {
    if (!currentConversation) {
        alert('Please select or create a conversation first');
        return;
    }

    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';

    // Build context from system prompt AND reference documents
    const systemContext = buildContext();

    // Get enabled provider numbers from the Set
    const activeProviderNums = Array.from(enabledProviders);

    if (activeProviderNums.length === 0) {
        alert('No providers enabled. Click a provider logo to enable it.');
        sendBtn.disabled = false;
        return;
    }

    // Add user message to UI immediately for enabled providers
    activeProviderNums.forEach(num => {
        addMessageToPanel(num, 'user', message);
        addLoadingToPanel(num);
    });

    // Also show in single view if on a single tab
    if (currentTab !== 'all') {
        const container = document.getElementById('single-messages');
        const userDiv = document.createElement('div');
        userDiv.className = 'message-bubble user';
        userDiv.textContent = message;
        container.appendChild(userDiv);

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message-bubble loading';
        loadingDiv.id = 'loading-single';
        loadingDiv.textContent = 'Thinking...';
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
    }

    // Send to ALL enabled providers regardless of current tab
    const promises = activeProviderNums.map((num, index) => {
        const providerInfo = PROVIDER_INFO[num];
        const model = providerModels[num];
        return sendToProvider(providerInfo.id, message, systemContext, num, index > 0, model);
    });
    await Promise.all(promises);

    sendBtn.disabled = false;

    // Reload conversation to get saved messages (but keep current provider settings)
    await selectConversation(currentConversation.id, true);
}

async function sendToProvider(providerId, message, systemPrompt, panelNum, skipUserMessage = false, model = null) {
    try {
        const response = await fetch(`${API_BASE}/api/conversations/${currentConversation.id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                provider: providerId,
                system_prompt: systemPrompt,
                skip_user_message: skipUserMessage,
                model: model
            })
        });

        const data = await response.json();

        // Remove loading indicator
        removeLoadingFromPanel(panelNum);

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to send message');
        }

        // Add assistant response
        if (currentTab === 'all') {
            addMessageToPanel(panelNum, 'assistant', data.assistant_message.content);
        } else {
            const container = document.getElementById('single-messages');
            const div = document.createElement('div');
            div.className = 'message-bubble assistant';
            div.textContent = data.assistant_message.content;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        removeLoadingFromPanel(panelNum);

        // Check if it's an API key error
        if (error.message.includes('API key not configured')) {
            showApiKeyAlert(error.message);
        } else if (currentTab === 'all') {
            addMessageToPanel(panelNum, 'error', `Error: ${error.message}`);
        } else {
            const container = document.getElementById('single-messages');
            const div = document.createElement('div');
            div.className = 'message-bubble error';
            div.textContent = `Error: ${error.message}`;
            container.appendChild(div);
        }
    }
}

// Track missing API keys to show combined alert
let missingApiKeyProviders = new Set();
let apiKeyAlertTimeout = null;

// Show API key missing alert
function showApiKeyAlert(message) {
    // Extract provider name from message
    let providerName = null;
    if (message.includes('OpenAI')) providerName = 'ChatGPT';
    else if (message.includes('Anthropic')) providerName = 'Claude';
    else if (message.includes('Google')) providerName = 'Gemini';
    else if (message.includes('xAI')) providerName = 'Grok';

    if (providerName) {
        missingApiKeyProviders.add(providerName);
    }

    // Debounce to collect all missing providers before showing alert
    if (apiKeyAlertTimeout) {
        clearTimeout(apiKeyAlertTimeout);
    }

    apiKeyAlertTimeout = setTimeout(() => {
        const providers = Array.from(missingApiKeyProviders);
        let displayText;

        if (providers.length === 1) {
            displayText = providers[0];
        } else if (providers.length === 2) {
            displayText = providers.join(' & ');
        } else if (providers.length > 2) {
            const last = providers.pop();
            displayText = providers.join(', ') + ', & ' + last;
        } else {
            displayText = 'the selected providers';
        }

        document.getElementById('api-key-alert-provider').textContent = displayText;
        document.getElementById('api-key-alert').style.display = 'flex';

        // Reset for next time
        missingApiKeyProviders.clear();
    }, 300);
}

function closeApiKeyAlert() {
    document.getElementById('api-key-alert').style.display = 'none';
}

function goToSettingsFromAlert() {
    closeApiKeyAlert();
    openSettingsModal();
}

function addLoadingToPanel(panelNum) {
    const container = document.getElementById(`messages-${panelNum}`);
    const div = document.createElement('div');
    div.className = 'message-bubble loading';
    div.id = `loading-${panelNum}`;
    div.textContent = 'Thinking...';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeLoadingFromPanel(panelNum) {
    const loading = document.getElementById(`loading-${panelNum}`) || document.getElementById('loading-single');
    if (loading) loading.remove();
}

// Conversation CRUD
function openNewConvoModal() {
    document.getElementById('new-convo-modal').style.display = 'flex';
    document.getElementById('convo-title').value = '';
    document.getElementById('convo-title').focus();
}

function closeNewConvoModal() {
    document.getElementById('new-convo-modal').style.display = 'none';
}

async function createConversation() {
    const title = document.getElementById('convo-title').value.trim();
    if (!title) {
        alert('Please enter a conversation name');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/conversations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title })
        });

        if (!response.ok) throw new Error('Failed to create conversation');

        const newConvo = await response.json();
        closeNewConvoModal();
        await loadConversations();
        selectConversation(newConvo.id);
    } catch (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to create conversation');
    }
}

async function deleteConversation(id) {
    if (!confirm('Delete this conversation?')) return;

    try {
        await fetch(`${API_BASE}/api/conversations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (currentConversation?.id === id) {
            currentConversation = null;
            document.getElementById('empty-state').style.display = 'block';
            document.getElementById('single-view').style.display = 'none';
            document.getElementById('grid-view').style.display = 'none';
            document.getElementById('input-bar').style.display = 'none';
        }

        await loadConversations();
    } catch (error) {
        console.error('Error deleting conversation:', error);
    }
}

// Tab Switching
function switchTab(tab) {
    // Don't allow switching to disabled provider tabs
    if (tab !== 'all' && !enabledProviders.has(tab)) {
        return;
    }

    currentTab = tab;

    // Update tab UI
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    // Re-render messages if conversation is selected
    if (currentConversation) {
        renderMessages();
    }
}

// Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    sidebar.classList.toggle('collapsed');

    // Show/hide the hamburger button based on sidebar state
    if (sidebar.classList.contains('collapsed')) {
        toggle.classList.add('visible');
    } else {
        toggle.classList.remove('visible');
    }
}

function goHome() {
    currentConversation = null;
    renderConversationList();
    document.getElementById('empty-state').style.display = 'block';
    document.getElementById('single-view').style.display = 'none';
    document.getElementById('grid-view').style.display = 'none';
    document.getElementById('input-bar').style.display = 'none';
}

// Modals
function openDocsModal() {
    document.getElementById('docs-modal').style.display = 'flex';
    renderDocumentList();
}

async function closeDocsModal() {
    document.getElementById('docs-modal').style.display = 'none';

    // Save system prompt and documents to the current conversation
    if (currentConversation) {
        const systemPrompt = document.getElementById('system-prompt').value;

        try {
            await fetch(`${API_BASE}/api/conversations/${currentConversation.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    system_prompt: systemPrompt,
                    documents: referenceDocuments
                })
            });

            // Update local state
            currentConversation.system_prompt = systemPrompt;
            currentConversation.documents = referenceDocuments;
        } catch (error) {
            console.error('Error saving prompt/docs:', error);
        }
    }
}

function renderDocumentList() {
    const list = document.getElementById('doc-list');
    if (!list) return;

    if (referenceDocuments.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = referenceDocuments.map((doc, index) => `
        <div class="doc-item">
            <span class="doc-name">${escapeHtml(doc.filename)}</span>
            <button class="doc-remove" onclick="removeDocument(${index})">&times;</button>
        </div>
    `).join('');
}

function removeDocument(index) {
    referenceDocuments.splice(index, 1);
    renderDocumentList();
}

async function handleDocumentUpload(e) {
    const files = e.target.files;
    if (!files.length) return;

    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE}/upload/document`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error uploading ${file.name}: ${error.detail}`);
                continue;
            }

            const result = await response.json();

            // Add to reference documents
            referenceDocuments.push({
                id: result.id,
                filename: result.filename,
                content: result.content,
                file_type: result.file_type
            });

            renderDocumentList();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert(`Error uploading ${file.name}`);
        }
    }

    // Clear the input
    e.target.value = '';
}

async function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'flex';
    loadUserInfo();

    // Load saved API keys from server
    try {
        const response = await fetch(`${API_BASE}/api/auth/api-keys`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const keys = await response.json();
            // Show masked keys as placeholder, clear value for new input
            document.getElementById('openai-key').value = '';
            document.getElementById('anthropic-key').value = '';
            document.getElementById('google-key').value = '';
            document.getElementById('xai-key').value = '';

            document.getElementById('openai-key').placeholder = keys.has_openai ? keys.openai : 'sk-...';
            document.getElementById('anthropic-key').placeholder = keys.has_anthropic ? keys.anthropic : 'sk-ant-...';
            document.getElementById('google-key').placeholder = keys.has_google ? keys.google : 'AIza...';
            document.getElementById('xai-key').placeholder = keys.has_xai ? keys.xai : 'xai-...';
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }

    // Set theme toggle state
    const savedTheme = localStorage.getItem('asher-theme') || 'dark';
    document.getElementById('theme-toggle').checked = savedTheme === 'dark';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

async function saveSettings() {
    // Build request with only non-empty keys
    const keys = {};
    const openai = document.getElementById('openai-key').value.trim();
    const anthropic = document.getElementById('anthropic-key').value.trim();
    const google = document.getElementById('google-key').value.trim();
    const xai = document.getElementById('xai-key').value.trim();

    if (openai) keys.openai = openai;
    if (anthropic) keys.anthropic = anthropic;
    if (google) keys.google = google;
    if (xai) keys.xai = xai;

    // Only save if there are keys to update
    if (Object.keys(keys).length > 0) {
        try {
            const response = await fetch(`${API_BASE}/api/auth/api-keys`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(keys)
            });

            if (!response.ok) {
                throw new Error('Failed to save API keys');
            }
        } catch (error) {
            console.error('Error saving API keys:', error);
            alert('Failed to save API keys');
            return;
        }
    }

    closeSettingsModal();
}

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * KONFIGURASI API GEMINI 2.5
 */
const CONFIG = {
    // API Key Anda (Langsung ditanam sesuai permintaan)
    API_KEY: "AIzaSyChkUo1qt4epG77LXbLFy0mDp3SS85PMOk", 
    
    // Menggunakan Model Gemini 2.5 Flash Preview
    MODEL_NAME: "gemini-2.5-flash-preview-09-2025"
};

// --- LOGIKA PROGRAM ---

const chatContainer = document.getElementById('chatContainer');
const promptInput = document.getElementById('promptInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const welcomeMsg = document.getElementById('welcomeMsg');

// Auto-height textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    if(textarea.value === '') textarea.style.height = 'auto';
}

// Enter untuk kirim
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const text = promptInput.value.trim();
    if (!text) return;

    if(welcomeMsg) welcomeMsg.classList.add('hidden');

    // Tampilkan pesan User
    appendMessage(text, 'user');
    promptInput.value = '';
    promptInput.style.height = 'auto';

    // Loading ON
    loadingIndicator.classList.remove('hidden');
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        // URL Endpoint Gemini 2.5
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL_NAME}:generateContent?key=${CONFIG.API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: text }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Jika error 404/Not Found pada model 2.5, beri saran fallback
            if(data.error?.code === 404 || data.error?.message?.includes('not found')) {
                throw new Error("Model Gemini 2.5 Flash belum aktif untuk API Key ini. Coba gunakan Gemini 1.5 Pro.");
            }
            throw new Error(data.error?.message || "Gagal menghubungi server.");
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        appendMessage(aiResponse, 'ai');

    } catch (error) {
        console.error(error);
        appendMessage(`**Error:** ${error.message}`, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function appendMessage(text, type) {
    const div = document.createElement('div');
    const isUser = type === 'user';
    
    div.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-4`;
    
    let bubbleClass = isUser 
        ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm' 
        : 'bg-surface border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm';
    
    if (type === 'error') bubbleClass = 'bg-red-900/50 border border-red-500 text-red-200 rounded-2xl';

    const contentHTML = isUser ? text : marked.parse(text);

    div.innerHTML = `
        <div class="max-w-[85%] px-4 py-3 ${bubbleClass} text-sm prose prose-invert">
            ${contentHTML}
        </div>
    `;
    
    chatContainer.insertBefore(div, loadingIndicator);
}



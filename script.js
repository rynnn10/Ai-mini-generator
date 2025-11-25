/**
 * KONFIGURASI API
 * Tempel API Key Anda di bawah ini di dalam tanda kutip.
 */
const CONFIG = {
    // Tempel API Key lengkap Anda di sini (ganti teks di dalam kutip)
    API_KEY: "AIzaSyChkUo1qt4epG77LXbLFy0mDp3SS85PMOk", 
    
    // Model Gemini (Gunakan gemini-1.5-flash untuk kecepatan & stabilitas free tier)
    MODEL_NAME: "gemini-1.5-flash" 
};

// --- LOGIKA APLIKASI DI BAWAH INI ---

const chatContainer = document.getElementById('chatContainer');
const promptInput = document.getElementById('promptInput');
const loadingIndicator = document.getElementById('loadingIndicator');
const welcomeMsg = document.getElementById('welcomeMsg');

// Fungsi Auto Resize Textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
    if(textarea.value === '') textarea.style.height = 'auto';
}

// Event Listener untuk Enter (Kirim pesan)
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Fungsi Utama Kirim Pesan
async function sendMessage() {
    const text = promptInput.value.trim();
    
    // Validasi input kosong
    if (!text) return;

    // Sembunyikan pesan welcome jika ada
    if(welcomeMsg) welcomeMsg.classList.add('hidden');

    // 1. Tampilkan Pesan User
    appendMessage(text, 'user');
    
    // Reset Input
    promptInput.value = '';
    promptInput.style.height = 'auto';

    // Tampilkan Loading
    loadingIndicator.classList.remove('hidden');
    scrollToBottom();

    // 2. Request ke Google API
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.MODEL_NAME}:generateContent?key=${CONFIG.API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: text }]
                }]
            })
        });

        const data = await response.json();

        // Cek jika ada error dari Google
        if (!response.ok) {
            throw new Error(data.error?.message || "Gagal menghubungi server Gemini.");
        }

        // Ambil teks jawaban
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // 3. Tampilkan Balasan AI
        appendMessage(aiResponse, 'ai');

    } catch (error) {
        console.error(error);
        appendMessage(`**Error:** ${error.message}`, 'error');
    } finally {
        // Sembunyikan Loading
        loadingIndicator.classList.add('hidden');
        scrollToBottom();
    }
}

// Fungsi Menampilkan Bubble Chat
function appendMessage(text, type) {
    const div = document.createElement('div');
    const isUser = type === 'user';
    
    // Styling Layout (Kanan untuk user, Kiri untuk AI)
    div.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-4`;
    
    // Warna Bubble
    let bubbleClass = isUser 
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
        : 'bg-surface border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm';
    
    if (type === 'error') bubbleClass = 'bg-red-900/50 border border-red-500 text-red-200 rounded-2xl';

    // Convert Markdown ke HTML (hanya untuk AI)
    // User chat ditampilkan text biasa untuk keamanan (mencegah XSS)
    const contentHTML = isUser ? text : marked.parse(text);

    div.innerHTML = `
        <div class="max-w-[85%] px-4 py-3 ${bubbleClass} text-sm prose">
            ${contentHTML}
        </div>
    `;
    
    // Masukkan pesan SEBELUM loading indicator
    chatContainer.insertBefore(div, loadingIndicator);
}

// Fungsi Scroll ke Bawah Otomatis
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


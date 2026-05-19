// Mouse Glow Efekti
const glow = document.querySelector('.cursor-glow');
document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
});

// Kaydırma Animasyonu (Reveal on Scroll)
const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active-section');
        }
    });
}, observerOptions);

document.querySelectorAll('section, .project-card, .main-blog-post').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'all 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)';
    observer.observe(el);
});

// Aktif bölümleri gösteren CSS sınıfı tetikleyici
const style = document.createElement('style');
style.textContent = `
    .active-section {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// Navigasyon Blur Efekti Kontrolü
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.padding = '1rem 5%';
        nav.style.background = 'rgba(5, 7, 10, 0.9)';
    } else {
        nav.style.padding = '1.5rem 5%';
        nav.style.background = 'rgba(5, 7, 10, 0.8)';
    }
});

// Lanyard WebSocket Entegrasyonu (Anlık Güncelleme İçin)
const DISCORD_ID = "1190980488098234381";
let lanyardSocket;

function connectLanyard() {
    lanyardSocket = new WebSocket('wss://api.lanyard.rest/socket');

    lanyardSocket.onopen = () => {
        console.log('Lanyard WebSocket bağlandı.');
    };

    lanyardSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.op === 1) {
            // Hello message, send Initialize (op 2)
            lanyardSocket.send(JSON.stringify({
                op: 2,
                d: {
                    subscribe_to_id: DISCORD_ID
                }
            }));
        } else if (message.op === 0) {
            // Event received (INIT_STATE or PRESENCE_UPDATE)
            updateDiscordPresence(message.d);
        }
    };

    lanyardSocket.onclose = () => {
        console.log('Lanyard WebSocket bağlantısı koptu. Yeniden bağlanılıyor...');
        setTimeout(connectLanyard, 5000);
    };
    
    lanyardSocket.onerror = (err) => {
        console.error('Lanyard WebSocket Hatası:', err);
    };
}

function updateDiscordPresence(data) {
    if (!data || !data.discord_user) return;
    
    // Status Göstergesi
    const statusInd = document.getElementById('discord-status-indicator');
    if (statusInd) statusInd.className = `status-indicator ${data.discord_status}`;
    
    // Avatar
    const avatarImg = document.getElementById('discord-avatar');
    if (avatarImg && data.discord_user.avatar) {
        avatarImg.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.discord_user.avatar}.webp?size=128`;
    }
    
    // Kullanıcı Bilgileri
    const nameEl = document.getElementById('discord-name');
    const tagEl = document.getElementById('discord-tag');
    if (nameEl) nameEl.textContent = data.discord_user.global_name || data.discord_user.username;
    if (tagEl) tagEl.textContent = `@${data.discord_user.username}`;
    
    // Özel Durum (Custom Status)
    const customStatusEl = document.getElementById('discord-custom-status');
    const customActivity = data.activities ? data.activities.find(act => act.type === 4) : null;
    
    if (customStatusEl) {
        if (customActivity) {
            let statusText = '';
            if (customActivity.emoji && customActivity.emoji.name) {
                statusText += customActivity.emoji.name + ' ';
            }
            statusText += customActivity.state || '';
            customStatusEl.innerHTML = statusText || 'Discord\'da aktif.';
        } else {
            if (data.discord_status === 'offline') {
                customStatusEl.innerHTML = 'Şu an aktif değil (Çevrimdışı).';
            } else {
                customStatusEl.innerHTML = 'Aktif olarak geliştiriyor.';
            }
        }
    }
    
    // Rich Presence (Spotify / Oyun)
    const presenceEl = document.getElementById('discord-presence');
    const presenceTitle = document.getElementById('presence-title');
    const presenceName = document.getElementById('presence-name');
    const presenceDetails = document.getElementById('presence-details-text');
    const presenceState = document.getElementById('presence-state');
    const presenceImg = document.getElementById('presence-image');
    
    const activeActivities = data.activities ? data.activities.filter(act => act.type !== 4) : [];
    
    if (activeActivities.length > 0 && presenceEl) {
        const activity = activeActivities[0];
        presenceEl.style.display = 'block';
        
        if (activity.type === 2 || (activity.name === 'Spotify' && data.listening_to_spotify)) {
            presenceTitle.textContent = 'SPOTIFY DİNLİYOR';
            presenceName.textContent = data.spotify.song || activity.name;
            presenceDetails.textContent = data.spotify.artist || activity.details || '';
            presenceState.textContent = data.spotify.album || activity.state || '';
            
            presenceImg.src = data.spotify.album_art_url || '';
            presenceImg.style.display = 'block';
        } else {
            if (activity.type === 1) presenceTitle.textContent = 'YAYINDA';
            else presenceTitle.textContent = 'OYNUYOR / KOD YAZIYOR';
            
            presenceName.textContent = activity.name || '';
            presenceDetails.textContent = activity.details || '';
            presenceState.textContent = activity.state || '';
            
            if (activity.assets && activity.assets.large_image) {
                if (activity.assets.large_image.startsWith('mp:external/')) {
                    presenceImg.src = activity.assets.large_image.replace(/mp:external\/[^\/]+\/https\//, 'https://');
                } else {
                    presenceImg.src = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`;
                }
                presenceImg.style.display = 'block';
            } else {
                presenceImg.src = 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
                presenceImg.style.display = 'block';
            }
        }
    } else if (presenceEl) {
        presenceEl.style.display = 'none';
    }
    
    // Banner Rengi
    const banner = document.getElementById('discord-banner');
    if (banner && data.discord_user.accent_color) {
        const hexColor = '#' + data.discord_user.accent_color.toString(16).padStart(6, '0');
        banner.style.background = hexColor;
    }
}

// WebSocket Bağlantısını Başlat
connectLanyard();

// ==========================================
// YENİ EKLENEN SİSTEMLER
// ==========================================

// 1. Modern Preloader
window.addEventListener('load', () => {
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hide');
        }
    }, 1500); // Progress bar animasyonunu bekler
});

// 2. Dinamik GitHub Projeleri
async function fetchGithubRepos() {
    try {
        const response = await fetch('https://api.github.com/users/zens744/repos?sort=updated&per_page=6');
        if (!response.ok) return;
        const repos = await response.json();
        
        const container = document.getElementById('github-repos');
        if (!container) return;
        
        container.innerHTML = ''; // Yükleniyor yazısını sil
        
        // En son güncellenen projeyi filtrele (profil reponu ve zens-sadrazam'ı gizle)
        const filteredRepos = repos.filter(repo => repo.name !== 'zens744' && repo.name !== 'zens-sadrazam').slice(0, 3);
        
        filteredRepos.forEach(repo => {
            const card = document.createElement('a');
            card.href = repo.html_url;
            card.target = '_blank';
            card.className = 'project-card-corp github-card';
            
            // Animasyon observer'ına ekle
            card.style.opacity = '0';
            card.style.transform = 'translateY(40px)';
            card.style.transition = 'all 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)';
            observer.observe(card);
            
            const langColor = getLanguageColor(repo.language);
            const desc = repo.description ? repo.description : 'Açıklama bulunmuyor.';
            
            card.innerHTML = `
                <div class="project-meta">GITHUB REPOSITORY</div>
                <h3>${repo.name}</h3>
                <p style="margin-bottom: 1.5rem;">${desc}</p>
                <div class="repo-stats">
                    <span class="repo-lang"><span class="lang-dot" style="background:${langColor}"></span>${repo.language || 'Unknown'}</span>
                    <span class="repo-stars">⭐ ${repo.stargazers_count}</span>
                    <span class="repo-forks">🍴 ${repo.forks_count}</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('GitHub Repoları alınamadı:', err);
    }
}

function getLanguageColor(lang) {
    const colors = {
        'Java': '#b07219',
        'Python': '#3572A5',
        'JavaScript': '#f1e05a',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
    };
    return colors[lang] || '#8b949e';
}

fetchGithubRepos();

// 3. Arka Plan Partikül Efekti (Interactive Background)
const particleCanvas = document.getElementById('particle-canvas');
const ctx = particleCanvas.getContext('2d');
let particlesArray = [];

particleCanvas.width = window.innerWidth;
particleCanvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    initParticles();
});

let mouse = { x: null, y: null, radius: 120 };
document.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Particle {
    constructor() {
        this.x = Math.random() * particleCanvas.width;
        this.y = Math.random() * particleCanvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 20) + 5;
        this.opacity = Math.random() * 0.4 + 0.1;
    }
    
    update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            }
        }
    }
    
    draw() {
        ctx.fillStyle = `rgba(56, 189, 248, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    const numberOfParticles = (particleCanvas.width * particleCanvas.height) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

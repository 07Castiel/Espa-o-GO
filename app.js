// ========================================
// ESPACOGO - APLICAÇÃO COMPLETA MELHORADA v2.0
// Sistema integrado com autenticação, favoritos, avaliações e filtros avançados
// Desenvolvido por Leonardo Brito - 2025
// ========================================

// ======================================== 
// CONFIGURAÇÕES GLOBAIS
// ========================================
const CONFIG = {
    APP_NAME: 'EspaçoGo',
    VERSION: '2.0.0',
    MAX_IMAGES: 10,
    ITEMS_PER_PAGE: 9,
    LOCAL_STORAGE_PREFIX: 'espacogo_',
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300
};

// ======================================== 
// VARIÁVEIS GLOBAIS
// ========================================
let currentUser = null;
let categoriaAtiva = 'todos';
let galeriaAtual = 0;
let currentPage = 1;
let filtrosAtivos = {
    categoria: 'todos',
    busca: '',
    precoMin: 0,
    precoMax: 10000,
    capacidadeMin: 0,
    ordenacao: 'recentes'
};

// ======================================== 
// UTILITÁRIOS
// ========================================

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidPassword(password) {
    if (password.length < 6) return false;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
}

function isValidWhatsApp(phone) {
    const regex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    return regex.test(phone);
}

function formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

// ======================================== 
// SISTEMA DE NOTIFICAÇÕES TOAST
// ========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${sanitizeInput(message)}</span>
        <button onclick="this.parentElement.remove()" class="toast-close" aria-label="Fechar notificação">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
}

// ======================================== 
// LOADING OVERLAY
// ========================================

function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('show');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('show');
}

// ======================================== 
// MODAL
// ========================================

function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('modalConfirm');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');

    if (!modal) return;

    titleEl.textContent = title;
    messageEl.textContent = message;

    confirmBtn.onclick = () => {
        onConfirm();
        fecharConfirm();
    };

    modal.classList.add('show');
}

function fecharConfirm() {
    const modal = document.getElementById('modalConfirm');
    if (modal) modal.classList.remove('show');
}

function fecharModal() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) modal.classList.remove('show');
}

// ======================================== 
// TEMA CLARO/ESCURO
// ========================================

function initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.LOCAL_STORAGE_PREFIX + 'theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.LOCAL_STORAGE_PREFIX + 'theme', theme);

    const icons = document.querySelectorAll('#themeIcon, #themeIcon2');
    icons.forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// ======================================== 
// LOCAL STORAGE
// ========================================

function setStorage(key, value) {
    try {
        localStorage.setItem(CONFIG.LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Erro ao salvar:', e);
        showToast('Erro ao salvar dados', 'error');
        return false;
    }
}

function getStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(CONFIG.LOCAL_STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Erro ao ler:', e);
        return defaultValue;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(CONFIG.LOCAL_STORAGE_PREFIX + key);
        return true;
    } catch (e) {
        console.error('Erro ao remover:', e);
        return false;
    }
}

// ======================================== 
// AUTENTICAÇÃO
// ========================================

function isLoggedIn() {
    return currentUser !== null;
}

function getCurrentUser() {
    if (!currentUser) {
        const userData = getStorage('currentUser');
        if (userData) currentUser = userData;
    }
    return currentUser;
}

function login(email, password) {
    if (!email || !password) {
        showToast('Preencha todos os campos', 'error');
        return false;
    }

    if (!isValidEmail(email)) {
        showToast('Email inválido', 'error');
        return false;
    }

    const users = getStorage('users', []);
    const user = users.find(u => u.email === email);

    if (!user) {
        showToast('Usuário não encontrado', 'error');
        return false;
    }

    if (!verifyPassword(password, user.password)) {
        showToast('Senha incorreta', 'error');
        return false;
    }

    user.lastLogin = new Date().toISOString();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    setStorage('users', users);

    const sessionUser = { ...user };
    delete sessionUser.password;

    currentUser = sessionUser;
    setStorage('currentUser', sessionUser);

    showToast(`Bem-vindo, ${user.name}!`, 'success');
    updateUI();
    navigate('home');

    return true;
}

function register(name, email, password, confirmPassword) {
    if (!name || !email || !password || !confirmPassword) {
        showToast('Preencha todos os campos', 'error');
        return { success: false };
    }

    if (name.length < 3) {
        showToast('Nome deve ter pelo menos 3 caracteres', 'error');
        return { success: false };
    }

    if (!isValidEmail(email)) {
        showToast('Email inválido', 'error');
        return { success: false };
    }

    if (!isValidPassword(password)) {
        showToast('Senha deve ter no mínimo 6 caracteres, incluindo letras e números', 'error');
        return { success: false };
    }

    if (password !== confirmPassword) {
        showToast('As senhas não coincidem', 'error');
        return { success: false };
    }

    const users = getStorage('users', []);

    if (users.find(u => u.email === email)) {
        showToast('Este email já está cadastrado', 'error');
        return { success: false };
    }

    const newUser = {
        id: generateId(),
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        password: hashPassword(password),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`,
        favorites: [],
        reviews: []
    };

    users.push(newUser);
    setStorage('users', users);

    showToast('Cadastro realizado! Faça login para continuar.', 'success');

    return { success: true };
}

function logout() {
    currentUser = null;
    removeStorage('currentUser');
    showToast('Você saiu da sua conta', 'info');
    updateUI();
    navigate('home');
}

// ======================================== 
// GERENCIAMENTO DE ESPAÇOS
// ========================================

function getListings() {
    return getStorage('listings', []);
}

function saveListing(listing) {
    if (!currentUser) {
        showToast('Você precisa estar logado', 'error');
        return null;
    }

    if (!listing.title || listing.title.length < 5) {
        showToast('Título deve ter pelo menos 5 caracteres', 'error');
        return null;
    }

    if (!listing.description || listing.description.length < 20) {
        showToast('Descrição deve ter pelo menos 20 caracteres', 'error');
        return null;
    }

    if (!listing.price || listing.price <= 0) {
        showToast('Preço deve ser maior que zero', 'error');
        return null;
    }

    if (!listing.city || listing.city.length < 3) {
        showToast('Cidade inválida', 'error');
        return null;
    }

    if (!listing.whatsapp || !isValidWhatsApp(listing.whatsapp)) {
        showToast('WhatsApp inválido. Use formato: (62) 99999-9999', 'error');
        return null;
    }

    const listings = getListings();

    const completeListing = {
        id: listing.id || generateId(),
        title: sanitizeInput(listing.title),
        description: sanitizeInput(listing.description),
        category: listing.category || 'multiuso',
        price: parseFloat(listing.price),
        periodo: listing.periodo || 'hora',
        city: sanitizeInput(listing.city),
        localizacao: sanitizeInput(listing.localizacao || listing.city),
        capacidade: parseInt(listing.capacidade) || 10,
        imagens: listing.imagens && listing.imagens.length > 0 
            ? listing.imagens.slice(0, CONFIG.MAX_IMAGES)
            : ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
        recursos: listing.recursos || [],
        whatsapp: sanitizeInput(listing.whatsapp),
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: listing.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: listing.views || 0,
        rating: listing.rating || 0,
        reviewCount: listing.reviewCount || 0,
        reviews: listing.reviews || [],
        status: listing.status || 'active'
    };

    if (listing.id) {
        const index = listings.findIndex(l => l.id === listing.id);
        if (index !== -1) {
            if (listings[index].userId !== currentUser.id) {
                showToast('Você não tem permissão para editar este anúncio', 'error');
                return null;
            }
            listings[index] = completeListing;
            showToast('Anúncio atualizado com sucesso', 'success');
        }
    } else {
        listings.push(completeListing);
        showToast('Anúncio criado com sucesso', 'success');
    }

    setStorage('listings', listings);
    return completeListing;
}

function deleteListing(id) {
    if (!currentUser) {
        showToast('Você precisa estar logado', 'error');
        return false;
    }

    let listings = getListings();
    const listing = listings.find(l => l.id === id);

    if (!listing) {
        showToast('Anúncio não encontrado', 'error');
        return false;
    }

    if (listing.userId !== currentUser.id) {
        showToast('Você não tem permissão', 'error');
        return false;
    }

    listings = listings.filter(l => l.id !== id);
    setStorage('listings', listings);

    removeFavoriteGlobally(id);

    showToast('Anúncio deletado com sucesso', 'success');
    return true;
}

function getUserListings() {
    if (!currentUser) return [];
    const listings = getListings();
    return listings.filter(l => l.userId === currentUser.id);
}

function getListingById(id) {
    const listings = getListings();
    return listings.find(l => l.id === id);
}

function incrementViews(id) {
    const listings = getListings();
    const index = listings.findIndex(l => l.id === id);

    if (index !== -1) {
        listings[index].views = (listings[index].views || 0) + 1;
        setStorage('listings', listings);
    }
}

// Continuação do código no próximo bloco...

// ======================================== 
// SISTEMA DE FAVORITOS
// ========================================

function toggleFavorite(listingId) {
    if (!currentUser) {
        showToast('Faça login para adicionar favoritos', 'warning');
        navigate('login');
        return false;
    }

    const users = getStorage('users', []);
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) return false;

    const user = users[userIndex];
    user.favorites = user.favorites || [];

    const favIndex = user.favorites.indexOf(listingId);

    if (favIndex === -1) {
        user.favorites.push(listingId);
        showToast('Adicionado aos favoritos', 'success');
    } else {
        user.favorites.splice(favIndex, 1);
        showToast('Removido dos favoritos', 'info');
    }

    users[userIndex] = user;
    setStorage('users', users);

    currentUser.favorites = user.favorites;
    setStorage('currentUser', currentUser);

    updateFavoriteCount();
    return true;
}

function isFavorite(listingId) {
    if (!currentUser || !currentUser.favorites) return false;
    return currentUser.favorites.includes(listingId);
}

function getFavorites() {
    if (!currentUser || !currentUser.favorites) return [];
    const listings = getListings();
    return listings.filter(l => currentUser.favorites.includes(l.id));
}

function removeFavoriteGlobally(listingId) {
    const users = getStorage('users', []);
    users.forEach(user => {
        if (user.favorites && user.favorites.includes(listingId)) {
            user.favorites = user.favorites.filter(id => id !== listingId);
        }
    });
    setStorage('users', users);
}

function updateFavoriteCount() {
    const badge = document.getElementById('favCount');
    if (badge && currentUser) {
        const count = currentUser.favorites ? currentUser.favorites.length : 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ======================================== 
// SISTEMA DE AVALIAÇÕES
// ========================================

function addReview(listingId, rating, comment) {
    if (!currentUser) {
        showToast('Faça login para avaliar', 'warning');
        return false;
    }

    if (rating < 1 || rating > 5) {
        showToast('Avaliação deve ser entre 1 e 5 estrelas', 'error');
        return false;
    }

    if (!comment || comment.length < 10) {
        showToast('Comentário deve ter pelo menos 10 caracteres', 'error');
        return false;
    }

    const listings = getListings();
    const listingIndex = listings.findIndex(l => l.id === listingId);

    if (listingIndex === -1) {
        showToast('Espaço não encontrado', 'error');
        return false;
    }

    const listing = listings[listingIndex];

    // Verifica se usuário já avaliou
    if (listing.reviews && listing.reviews.find(r => r.userId === currentUser.id)) {
        showToast('Você já avaliou este espaço', 'warning');
        return false;
    }

    const review = {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        rating: rating,
        comment: sanitizeInput(comment),
        createdAt: new Date().toISOString()
    };

    listing.reviews = listing.reviews || [];
    listing.reviews.push(review);

    // Recalcula rating médio
    const totalRating = listing.reviews.reduce((sum, r) => sum + r.rating, 0);
    listing.rating = totalRating / listing.reviews.length;
    listing.reviewCount = listing.reviews.length;

    listings[listingIndex] = listing;
    setStorage('listings', listings);

    showToast('Avaliação adicionada com sucesso', 'success');
    return true;
}

function getReviews(listingId) {
    const listing = getListingById(listingId);
    return listing && listing.reviews ? listing.reviews : [];
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }

    return stars;
}

// ======================================== 
// FILTROS E BUSCA
// ========================================

function getCategoriaLabel(categoria) {
    const labels = {
        'corporativo': 'Eventos Corporativos',
        'social': 'Eventos Sociais',
        'reuniao': 'Reuniões',
        'cultural': 'Cultural',
        'hospedagem': 'Hospedagem',
        'multiuso': 'Multiuso'
    };
    return labels[categoria] || categoria;
}

function filtrarEspacos(categoria) {
    categoriaAtiva = categoria;
    filtrosAtivos.categoria = categoria;

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const btnAtivo = document.querySelector(`[data-categoria="${categoria}"]`);
    if (btnAtivo) {
        btnAtivo.classList.add('active');
    }

    aplicarFiltros();
}

function buscarEspacos(termo) {
    filtrosAtivos.busca = termo.toLowerCase();
    aplicarFiltros();
}

const buscarEspacosDebounced = debounce(buscarEspacos, CONFIG.DEBOUNCE_DELAY);

function aplicarFiltros() {
    let espacos = getListings();

    // Filtro de categoria
    if (filtrosAtivos.categoria !== 'todos') {
        espacos = espacos.filter(e => e.category === filtrosAtivos.categoria);
    }

    // Filtro de busca
    if (filtrosAtivos.busca) {
        espacos = espacos.filter(e => 
            (e.title && e.title.toLowerCase().includes(filtrosAtivos.busca)) ||
            (e.description && e.description.toLowerCase().includes(filtrosAtivos.busca)) ||
            (e.localizacao && e.localizacao.toLowerCase().includes(filtrosAtivos.busca)) ||
            (e.city && e.city.toLowerCase().includes(filtrosAtivos.busca))
        );
    }

    // Filtro de preço
    espacos = espacos.filter(e => 
        e.price >= filtrosAtivos.precoMin && e.price <= filtrosAtivos.precoMax
    );

    // Filtro de capacidade
    if (filtrosAtivos.capacidadeMin > 0) {
        espacos = espacos.filter(e => (e.capacidade || 0) >= filtrosAtivos.capacidadeMin);
    }

    // Ordenação
    espacos = ordenarEspacos(espacos, filtrosAtivos.ordenacao);

    renderizarCards(espacos);
}

function ordenarEspacos(espacos, ordenacao) {
    switch (ordenacao) {
        case 'preco-asc':
            return espacos.sort((a, b) => a.price - b.price);
        case 'preco-desc':
            return espacos.sort((a, b) => b.price - a.price);
        case 'avaliacao':
            return espacos.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'populares':
            return espacos.sort((a, b) => (b.views || 0) - (a.views || 0));
        case 'recentes':
        default:
            return espacos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

// ======================================== 
// RENDERIZAÇÃO
// ========================================

function renderizarCards(espacosFiltrados) {
    const container = document.getElementById('containerCards');
    if (!container) return;

    if (espacosFiltrados.length === 0) {
        container.innerHTML = `
            <div class="sem-resultados">
                <i class="fas fa-search"></i>
                <h3>Nenhum espaço encontrado</h3>
                <p>Tente selecionar outra categoria ou faça uma nova busca</p>
            </div>
        `;
        return;
    }

    // Paginação
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const end = start + CONFIG.ITEMS_PER_PAGE;
    const espacosPaginados = espacosFiltrados.slice(start, end);

    container.innerHTML = espacosPaginados.map(espaco => `
        <div class="card-espaco" onclick="verDetalhes('${espaco.id}')">
            <div class="card-imagem">
                <img src="${espaco.imagens[0]}" alt="${espaco.title}" loading="lazy">
                <div class="card-categoria">${getCategoriaLabel(espaco.category)}</div>
                ${espaco.imagens.length > 1 ? `
                    <div class="card-gallery-badge">
                        <i class="fas fa-images"></i>
                        ${espaco.imagens.length}
                    </div>
                ` : ''}
                ${isLoggedIn() ? `
                    <button class="btn-favorite ${isFavorite(espaco.id) ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite('${espaco.id}'); this.classList.toggle('active');"
                            aria-label="Favoritar">
                        <i class="fas fa-heart"></i>
                    </button>
                ` : ''}
            </div>
            <div class="card-conteudo">
                <h3 class="card-titulo">${espaco.title}</h3>

                <div class="card-rating">
                    <div class="stars">${renderStars(espaco.rating || 0)}</div>
                    <span class="rating-text">${(espaco.rating || 0).toFixed(1)} (${espaco.reviewCount || 0} avaliações)</span>
                </div>

                <div class="card-preco">
                    ${formatPrice(espaco.price)}<span>/${espaco.periodo || 'hora'}</span>
                </div>

                <div class="card-localizacao">
                    <i class="fas fa-map-marker-alt"></i>
                    ${espaco.localizacao || espaco.city}
                </div>

                <div class="card-info">
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        ${espaco.capacidade || 10} pessoas
                    </div>
                    <div class="info-item">
                        <i class="fas fa-eye"></i>
                        ${espaco.views || 0} visualizações
                    </div>
                </div>

                <p class="card-descricao">${espaco.description}</p>

                <a href="https://wa.me/55${espaco.whatsapp.replace(/\D/g, '')}?text=Olá! Tenho interesse no espaço: ${encodeURIComponent(espaco.title)}" 
                   class="btn-whatsapp" 
                   target="_blank"
                   onclick="event.stopPropagation()">
                    <i class="fab fa-whatsapp"></i>
                    Entrar em Contato
                </a>
            </div>
        </div>
    `).join('');

    // Renderiza paginação
    renderizarPaginacao(espacosFiltrados.length);
}

function renderizarPaginacao(totalItems) {
    const totalPages = Math.ceil(totalItems / CONFIG.ITEMS_PER_PAGE);

    if (totalPages <= 1) return;

    const container = document.getElementById('containerCards');
    if (!container) return;

    const paginacao = document.createElement('div');
    paginacao.className = 'paginacao';
    paginacao.innerHTML = `
        <button onclick="mudarPagina(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                class="btn-pag">
            <i class="fas fa-chevron-left"></i> Anterior
        </button>
        <span class="pag-info">Página ${currentPage} de ${totalPages}</span>
        <button onclick="mudarPagina(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                class="btn-pag">
            Próxima <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.parentElement.appendChild(paginacao);
}

function mudarPagina(novaPagina) {
    currentPage = novaPagina;
    aplicarFiltros();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Continuação no próximo bloco...

// ======================================== 
// DETALHES DO ESPAÇO
// ========================================

function verDetalhes(id) {
    const espaco = getListingById(id);
    if (!espaco) {
        showToast('Espaço não encontrado', 'error');
        return;
    }

    incrementViews(id);

    const modal = document.getElementById('modalDetalhes');
    const modalBody = document.getElementById('modalBody');

    const reviews = espaco.reviews || [];

    modalBody.innerHTML = `
        <div class="detail-content">
            ${espaco.imagens.length > 1 ? `
                <div class="detail-galeria">
                    ${espaco.imagens.map((img, index) => `
                        <img src="${img}" 
                             alt="${espaco.title} - Imagem ${index + 1}" 
                             class="galeria-imagem ${index === 0 ? 'active' : ''}"
                             id="img-${index}">
                    `).join('')}

                    ${espaco.imagens.length > 1 ? `
                        <button class="galeria-btn galeria-prev" onclick="mudarImagem(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="galeria-btn galeria-next" onclick="mudarImagem(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="galeria-indicador">
                            <span id="imagemAtual">1</span> / ${espaco.imagens.length}
                        </div>
                    ` : ''}

                    <div class="detail-categoria">${getCategoriaLabel(espaco.category)}</div>
                </div>
            ` : `
                <div class="detail-image">
                    <img src="${espaco.imagens[0]}" alt="${espaco.title}">
                    <div class="detail-categoria">${getCategoriaLabel(espaco.category)}</div>
                </div>
            `}

            <div class="detail-info">
                <div class="detail-header">
                    <h1>${espaco.title}</h1>
                    ${isLoggedIn() ? `
                        <button class="btn-favorite-large ${isFavorite(espaco.id) ? 'active' : ''}" 
                                onclick="toggleFavorite('${espaco.id}'); this.classList.toggle('active');">
                            <i class="fas fa-heart"></i>
                        </button>
                    ` : ''}
                </div>

                <div class="detail-rating-section">
                    <div class="stars-large">${renderStars(espaco.rating || 0)}</div>
                    <span class="rating-text-large">${(espaco.rating || 0).toFixed(1)} / 5.0</span>
                    <span class="review-count">(${espaco.reviewCount || 0} avaliações)</span>
                </div>

                <div class="detail-price">
                    ${formatPrice(espaco.price)}
                    <span class="price-period">/ ${espaco.periodo || 'hora'}</span>
                </div>

                <div class="detail-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${espaco.localizacao || espaco.city}
                </div>

                <div class="detail-features">
                    <div class="feature-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <strong>Capacidade</strong>
                            <p>${espaco.capacidade || 10} pessoas</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-eye"></i>
                        <div>
                            <strong>Visualizações</strong>
                            <p>${espaco.views || 0} views</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-calendar"></i>
                        <div>
                            <strong>Publicado</strong>
                            <p>${formatDate(espaco.createdAt)}</p>
                        </div>
                    </div>
                </div>

                ${espaco.recursos && espaco.recursos.length > 0 ? `
                    <div class="detail-recursos">
                        <h3>Recursos Disponíveis</h3>
                        <div class="recursos-list">
                            ${espaco.recursos.map(r => `
                                <div class="recurso-tag">
                                    <i class="fas fa-check-circle"></i>
                                    ${r}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="detail-description">
                    <h3>Descrição</h3>
                    <p>${espaco.description}</p>
                </div>

                <div class="detail-owner">
                    <p><strong>Anunciante:</strong> ${espaco.userName || 'Anônimo'}</p>
                </div>

                ${reviews.length > 0 ? `
                    <div class="detail-reviews">
                        <h3>Avaliações (${reviews.length})</h3>
                        <div class="reviews-list">
                            ${reviews.map(review => `
                                <div class="review-item">
                                    <div class="review-header">
                                        <img src="${review.userAvatar}" alt="${review.userName}" class="review-avatar">
                                        <div>
                                            <strong>${review.userName}</strong>
                                            <div class="stars-small">${renderStars(review.rating)}</div>
                                        </div>
                                        <span class="review-date">${formatDate(review.createdAt)}</span>
                                    </div>
                                    <p class="review-comment">${review.comment}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${isLoggedIn() && !reviews.find(r => r.userId === currentUser.id) ? `
                    <div class="add-review-section">
                        <h3>Deixe sua avaliação</h3>
                        <form onsubmit="submitReview(event, '${espaco.id}')">
                            <div class="rating-input">
                                <label>Sua nota:</label>
                                <div class="star-input">
                                    ${[5,4,3,2,1].map(n => `
                                        <input type="radio" name="rating" value="${n}" id="star${n}" required>
                                        <label for="star${n}"><i class="fas fa-star"></i></label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Seu comentário:</label>
                                <textarea name="comment" rows="4" required minlength="10" 
                                          placeholder="Compartilhe sua experiência..."></textarea>
                            </div>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-paper-plane"></i> Enviar Avaliação
                            </button>
                        </form>
                    </div>
                ` : ''}

                <a href="https://wa.me/55${espaco.whatsapp.replace(/\D/g, '')}?text=Olá! Tenho interesse no espaço: ${encodeURIComponent(espaco.title)}" 
                   class="btn-whatsapp btn-large" 
                   target="_blank">
                    <i class="fab fa-whatsapp"></i>
                    Entrar em Contato via WhatsApp
                </a>
            </div>
        </div>
    `;

    modal.classList.add('show');
    galeriaAtual = 0;
}

function mudarImagem(direcao) {
    const modal = document.getElementById('modalBody');
    const imagens = modal.querySelectorAll('.galeria-imagem');

    imagens[galeriaAtual].classList.remove('active');

    galeriaAtual += direcao;

    if (galeriaAtual >= imagens.length) galeriaAtual = 0;
    if (galeriaAtual < 0) galeriaAtual = imagens.length - 1;

    imagens[galeriaAtual].classList.add('active');

    const indicador = document.getElementById('imagemAtual');
    if (indicador) indicador.textContent = galeriaAtual + 1;
}

function submitReview(event, listingId) {
    event.preventDefault();

    const form = event.target;
    const rating = parseInt(form.rating.value);
    const comment = form.comment.value;

    if (addReview(listingId, rating, comment)) {
        fecharModal();
        setTimeout(() => verDetalhes(listingId), 300);
    }
}

// ======================================== 
// NAVEGAÇÃO
// ========================================

function navigate(page) {
    const content = document.getElementById('content');
    if (!content) return;

    showLoading();

    setTimeout(() => {
        switch(page) {
            case 'home':
                renderHome();
                break;
            case 'login':
                renderLogin();
                break;
            case 'register':
                renderRegister();
                break;
            case 'dashboard':
                renderDashboard();
                break;
            case 'create':
                renderCreateListing();
                break;
            case 'edit':
                renderEditListing();
                break;
            case 'favorites':
                renderFavorites();
                break;
            case 'profile':
                renderProfile();
                break;
            default:
                renderHome();
        }

        hideLoading();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

// ======================================== 
// PÁGINAS
// ========================================

function renderHome() {
    const content = document.getElementById('content');

    content.innerHTML = `
        <section class="hero">
            <div class="container">
                <h2 class="hero-title">Encontre o Espaço Perfeito</h2>
                <p class="hero-subtitle">Salas, salões e espaços para reuniões, eventos e hospedagens em Goiânia</p>

                <div class="search-bar">
                    <div class="search-input-group">
                        <i class="fas fa-search"></i>
                        <input type="text" 
                               id="searchInput" 
                               placeholder="Buscar por nome, descrição ou localização..." 
                               oninput="buscarEspacosDebounced(this.value)">
                    </div>
                </div>
            </div>
        </section>

        <section class="filtros-section">
            <div class="container">
                <div class="filtros">
                    <button class="filtro-btn active" data-categoria="todos" onclick="filtrarEspacos('todos')">
                        <i class="fas fa-th"></i> Todos
                    </button>
                    <button class="filtro-btn" data-categoria="corporativo" onclick="filtrarEspacos('corporativo')">
                        <i class="fas fa-briefcase"></i> Corporativo
                    </button>
                    <button class="filtro-btn" data-categoria="social" onclick="filtrarEspacos('social')">
                        <i class="fas fa-glass-cheers"></i> Social
                    </button>
                    <button class="filtro-btn" data-categoria="reuniao" onclick="filtrarEspacos('reuniao')">
                        <i class="fas fa-users"></i> Reuniões
                    </button>
                    <button class="filtro-btn" data-categoria="cultural" onclick="filtrarEspacos('cultural')">
                        <i class="fas fa-theater-masks"></i> Cultural
                    </button>
                    <button class="filtro-btn" data-categoria="hospedagem" onclick="filtrarEspacos('hospedagem')">
                        <i class="fas fa-bed"></i> Hospedagem
                    </button>
                    <button class="filtro-btn" data-categoria="multiuso" onclick="filtrarEspacos('multiuso')">
                        <i class="fas fa-star"></i> Multiuso
                    </button>
                </div>

                <div class="filtros-avancados">
                    <select onchange="filtrosAtivos.ordenacao = this.value; aplicarFiltros();">
                        <option value="recentes">Mais Recentes</option>
                        <option value="preco-asc">Menor Preço</option>
                        <option value="preco-desc">Maior Preço</option>
                        <option value="avaliacao">Melhor Avaliados</option>
                        <option value="populares">Mais Populares</option>
                    </select>
                </div>
            </div>
        </section>

        <section class="espacos-section">
            <div class="container">
                <div class="container-cards" id="containerCards"></div>
            </div>
        </section>
    `;

    aplicarFiltros();
}

function renderLogin() {
    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <h2>Entrar no EspaçoGo</h2>
                <form onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="password">Senha</label>
                        <input type="password" id="password" name="password" required>
                    </div>

                    <button type="submit" class="btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Entrar
                    </button>
                </form>

                <div class="auth-link">
                    Não tem uma conta? <a href="#" onclick="navigate('register'); return false;">Cadastre-se</a>
                </div>
            </div>
        </div>
    `;
}

function renderRegister() {
    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="auth-container">
            <div class="auth-box">
                <h2>Criar Conta</h2>
                <form onsubmit="handleRegister(event)">
                    <div class="form-group">
                        <label for="name">Nome Completo</label>
                        <input type="text" id="name" name="name" required minlength="3">
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="password">Senha</label>
                        <input type="password" id="password" name="password" required minlength="6">
                        <small>Mínimo 6 caracteres, incluindo letras e números</small>
                    </div>

                    <div class="form-group">
                        <label for="confirmPassword">Confirmar Senha</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                    </div>

                    <button type="submit" class="btn-primary">
                        <i class="fas fa-user-plus"></i> Cadastrar
                    </button>
                </form>

                <div class="auth-link">
                    Já tem uma conta? <a href="#" onclick="navigate('login'); return false;">Faça login</a>
                </div>
            </div>
        </div>
    `;
}

// Continuação no próximo bloco...

function renderDashboard() {
    if (!isLoggedIn()) {
        showToast('Faça login para acessar seu painel', 'warning');
        navigate('login');
        return;
    }

    const userListings = getUserListings();
    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="dashboard-container">
            <div class="container">
                <div class="dashboard-header">
                    <h2>Meus Espaços</h2>
                    <button onclick="navigate('create')" class="btn-primary">
                        <i class="fas fa-plus"></i> Novo Anúncio
                    </button>
                </div>

                ${userListings.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>Nenhum espaço cadastrado</h3>
                        <p>Comece criando seu primeiro anúncio!</p>
                        <button onclick="navigate('create')" class="btn-primary">
                            <i class="fas fa-plus"></i> Criar Primeiro Anúncio
                        </button>
                    </div>
                ` : `
                    <div class="listings-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Categoria</th>
                                    <th>Cidade</th>
                                    <th>Capacidade</th>
                                    <th>Preço</th>
                                    <th>Visualizações</th>
                                    <th>Avaliação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${userListings.map(l => `
                                    <tr>
                                        <td>${l.title}</td>
                                        <td>${getCategoriaLabel(l.category)}</td>
                                        <td>${l.city}</td>
                                        <td>${l.capacidade || 10} pessoas</td>
                                        <td>${formatPrice(l.price)}/${l.periodo || 'hora'}</td>
                                        <td>${l.views || 0}</td>
                                        <td>
                                            <div class="stars-small">${renderStars(l.rating || 0)}</div>
                                            ${(l.rating || 0).toFixed(1)}
                                        </td>
                                        <td>
                                            <div class="table-actions">
                                                <button onclick="verDetalhes('${l.id}')" class="btn-icon" title="Ver Detalhes">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button onclick="editarListing('${l.id}')" class="btn-icon" title="Editar">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="confirmarDelete('${l.id}')" class="btn-icon btn-danger" title="Deletar">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
    `;
}

function renderFavorites() {
    if (!isLoggedIn()) {
        showToast('Faça login para ver seus favoritos', 'warning');
        navigate('login');
        return;
    }

    const favorites = getFavorites();
    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="dashboard-container">
            <div class="container">
                <div class="dashboard-header">
                    <h2>Meus Favoritos</h2>
                </div>

                ${favorites.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-heart-broken"></i>
                        <h3>Nenhum favorito ainda</h3>
                        <p>Explore os espaços e adicione seus favoritos!</p>
                        <button onclick="navigate('home')" class="btn-primary">
                            <i class="fas fa-search"></i> Explorar Espaços
                        </button>
                    </div>
                ` : `
                    <div class="container-cards" id="containerCards"></div>
                `}
            </div>
        </div>
    `;

    if (favorites.length > 0) {
        renderizarCards(favorites);
    }
}

function renderCreateListing() {
    if (!isLoggedIn()) {
        showToast('Faça login para criar anúncios', 'warning');
        navigate('login');
        return;
    }

    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="form-container">
            <div class="container">
                <h2>Criar Novo Anúncio</h2>

                <form class="listing-form" onsubmit="handleCreateListing(event)">
                    <div class="form-group">
                        <label for="title">Título do Espaço *</label>
                        <input type="text" id="title" name="title" required minlength="5" 
                               placeholder="Ex: Sala de Reuniões Executiva">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="category">Categoria *</label>
                            <select id="category" name="category" required>
                                <option value="multiuso">Multiuso</option>
                                <option value="corporativo">Eventos Corporativos</option>
                                <option value="social">Eventos Sociais</option>
                                <option value="reuniao">Reuniões</option>
                                <option value="cultural">Cultural</option>
                                <option value="hospedagem">Hospedagem</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="city">Cidade *</label>
                            <input type="text" id="city" name="city" required 
                                   placeholder="Ex: Goiânia">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="localizacao">Endereço/Bairro *</label>
                        <input type="text" id="localizacao" name="localizacao" required 
                               placeholder="Ex: Setor Bueno">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="price">Preço *</label>
                            <input type="number" id="price" name="price" required min="0" step="0.01" 
                                   placeholder="0.00">
                        </div>

                        <div class="form-group">
                            <label for="periodo">Período</label>
                            <select id="periodo" name="periodo">
                                <option value="hora">Por Hora</option>
                                <option value="dia">Por Dia</option>
                                <option value="semana">Por Semana</option>
                                <option value="mes">Por Mês</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="capacidade">Capacidade *</label>
                            <input type="number" id="capacidade" name="capacidade" required min="1" 
                                   placeholder="10" value="10">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="whatsapp">WhatsApp para Contato *</label>
                        <input type="tel" id="whatsapp" name="whatsapp" required 
                               placeholder="(62) 99999-9999">
                        <small>Formato: (DD) 99999-9999</small>
                    </div>

                    <div class="form-group">
                        <label for="description">Descrição *</label>
                        <textarea id="description" name="description" rows="5" required minlength="20"
                                  placeholder="Descreva seu espaço, suas características e diferenciais..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="imagens">URLs das Imagens (uma por linha)</label>
                        <textarea id="imagens" name="imagens" rows="4" 
                                  placeholder="https://exemplo.com/imagem1.jpg
https://exemplo.com/imagem2.jpg"></textarea>
                        <small>Adicione até ${CONFIG.MAX_IMAGES} imagens</small>
                    </div>

                    <div class="form-group">
                        <label>Recursos Disponíveis</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" name="recursos" value="Wi-Fi"> Wi-Fi</label>
                            <label><input type="checkbox" name="recursos" value="Ar Condicionado"> Ar Condicionado</label>
                            <label><input type="checkbox" name="recursos" value="Projetor"> Projetor</label>
                            <label><input type="checkbox" name="recursos" value="Som"> Sistema de Som</label>
                            <label><input type="checkbox" name="recursos" value="Cozinha"> Cozinha</label>
                            <label><input type="checkbox" name="recursos" value="Estacionamento"> Estacionamento</label>
                            <label><input type="checkbox" name="recursos" value="Acessibilidade"> Acessibilidade</label>
                            <label><input type="checkbox" name="recursos" value="Coffee Break"> Coffee Break</label>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" onclick="navigate('dashboard')" class="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Publicar Anúncio
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function editarListing(id) {
    const listing = getListingById(id);
    if (!listing) {
        showToast('Anúncio não encontrado', 'error');
        return;
    }

    if (listing.userId !== currentUser.id) {
        showToast('Você não tem permissão', 'error');
        return;
    }

    const content = document.getElementById('content');

    content.innerHTML = `
        <div class="form-container">
            <div class="container">
                <h2>Editar Anúncio</h2>

                <form class="listing-form" onsubmit="handleEditListing(event, '${id}')">
                    <div class="form-group">
                        <label for="title">Título do Espaço *</label>
                        <input type="text" id="title" name="title" required minlength="5" 
                               value="${listing.title}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="category">Categoria *</label>
                            <select id="category" name="category" required>
                                <option value="multiuso" ${listing.category === 'multiuso' ? 'selected' : ''}>Multiuso</option>
                                <option value="corporativo" ${listing.category === 'corporativo' ? 'selected' : ''}>Eventos Corporativos</option>
                                <option value="social" ${listing.category === 'social' ? 'selected' : ''}>Eventos Sociais</option>
                                <option value="reuniao" ${listing.category === 'reuniao' ? 'selected' : ''}>Reuniões</option>
                                <option value="cultural" ${listing.category === 'cultural' ? 'selected' : ''}>Cultural</option>
                                <option value="hospedagem" ${listing.category === 'hospedagem' ? 'selected' : ''}>Hospedagem</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="city">Cidade *</label>
                            <input type="text" id="city" name="city" required value="${listing.city}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="localizacao">Endereço/Bairro *</label>
                        <input type="text" id="localizacao" name="localizacao" required 
                               value="${listing.localizacao}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="price">Preço *</label>
                            <input type="number" id="price" name="price" required min="0" step="0.01" 
                                   value="${listing.price}">
                        </div>

                        <div class="form-group">
                            <label for="periodo">Período</label>
                            <select id="periodo" name="periodo">
                                <option value="hora" ${listing.periodo === 'hora' ? 'selected' : ''}>Por Hora</option>
                                <option value="dia" ${listing.periodo === 'dia' ? 'selected' : ''}>Por Dia</option>
                                <option value="semana" ${listing.periodo === 'semana' ? 'selected' : ''}>Por Semana</option>
                                <option value="mes" ${listing.periodo === 'mes' ? 'selected' : ''}>Por Mês</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="capacidade">Capacidade *</label>
                            <input type="number" id="capacidade" name="capacidade" required min="1" 
                                   value="${listing.capacidade}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="whatsapp">WhatsApp *</label>
                        <input type="tel" id="whatsapp" name="whatsapp" required 
                               value="${listing.whatsapp}">
                    </div>

                    <div class="form-group">
                        <label for="description">Descrição *</label>
                        <textarea id="description" name="description" rows="5" required minlength="20">${listing.description}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="imagens">URLs das Imagens (uma por linha)</label>
                        <textarea id="imagens" name="imagens" rows="4">${listing.imagens.join('\n')}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Recursos Disponíveis</label>
                        <div class="checkbox-group">
                            ${['Wi-Fi', 'Ar Condicionado', 'Projetor', 'Sistema de Som', 'Cozinha', 'Estacionamento', 'Acessibilidade', 'Coffee Break'].map(r => `
                                <label><input type="checkbox" name="recursos" value="${r}" ${listing.recursos && listing.recursos.includes(r) ? 'checked' : ''}> ${r}</label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" onclick="navigate('dashboard')" class="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// ======================================== 
// HANDLERS DE FORMULÁRIOS
// ========================================

function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    login(form.email.value, form.password.value);
}

function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const result = register(
        form.name.value,
        form.email.value,
        form.password.value,
        form.confirmPassword.value
    );

    if (result.success) {
        setTimeout(() => navigate('login'), 1500);
    }
}

function handleCreateListing(event) {
    event.preventDefault();
    const form = event.target;

    const imagens = form.imagens.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const recursos = Array.from(form.querySelectorAll('input[name="recursos"]:checked'))
        .map(cb => cb.value);

    const listing = {
        title: form.title.value,
        description: form.description.value,
        category: form.category.value,
        price: parseFloat(form.price.value),
        periodo: form.periodo.value,
        city: form.city.value,
        localizacao: form.localizacao.value,
        capacidade: parseInt(form.capacidade.value),
        whatsapp: form.whatsapp.value,
        imagens: imagens,
        recursos: recursos
    };

    const result = saveListing(listing);
    if (result) {
        setTimeout(() => navigate('dashboard'), 1000);
    }
}

function handleEditListing(event, id) {
    event.preventDefault();
    const form = event.target;

    const listing = getListingById(id);
    if (!listing) return;

    const imagens = form.imagens.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const recursos = Array.from(form.querySelectorAll('input[name="recursos"]:checked'))
        .map(cb => cb.value);

    const updatedListing = {
        ...listing,
        id: id,
        title: form.title.value,
        description: form.description.value,
        category: form.category.value,
        price: parseFloat(form.price.value),
        periodo: form.periodo.value,
        city: form.city.value,
        localizacao: form.localizacao.value,
        capacidade: parseInt(form.capacidade.value),
        whatsapp: form.whatsapp.value,
        imagens: imagens.length > 0 ? imagens : listing.imagens,
        recursos: recursos
    };

    const result = saveListing(updatedListing);
    if (result) {
        setTimeout(() => navigate('dashboard'), 1000);
    }
}

function confirmarDelete(id) {
    showConfirm(
        'Confirmar Exclusão',
        'Tem certeza que deseja deletar este anúncio? Esta ação não pode ser desfeita.',
        () => {
            if (deleteListing(id)) {
                navigate('dashboard');
            }
        }
    );
}

// ======================================== 
// UPDATE UI
// ========================================

function updateUI() {
    const userMenu = document.getElementById('userMenu');
    const guestMenu = document.getElementById('guestMenu');
    const userName = document.getElementById('userName');

    if (isLoggedIn()) {
        if (userMenu) userMenu.style.display = 'flex';
        if (guestMenu) guestMenu.style.display = 'none';
        if (userName) userName.textContent = currentUser.name;
        updateFavoriteCount();
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (guestMenu) guestMenu.style.display = 'flex';
    }
}

// ======================================== 
// INICIALIZAÇÃO
// ========================================

function init() {
    // Carrega usuário da sessão
    getCurrentUser();

    // Inicializa tema
    initTheme();

    // Atualiza UI
    updateUI();

    // Carrega página inicial
    navigate('home');

    // Remove loading inicial
    setTimeout(hideLoading, 500);
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ======================================== 
// FIM DO APP.JS
// ========================================
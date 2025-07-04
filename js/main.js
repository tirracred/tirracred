document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const productListContainer = document.getElementById('product-list');
    const filterForm = document.getElementById('filter-form');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResultsMessage = document.getElementById('no-results');

    // --- ESTADO DA APLICAÇÃO ---
    let allProducts = []; // Armazena todos os produtos carregados do JSON
    let filteredProducts = []; // Armazena os produtos após a aplicação dos filtros
    let currentProductIndex = 0; // Índice para controlar a paginação infinita
    const PRODUCTS_PER_PAGE = 5; // Quantidade de produtos para carregar por vez

    // --- FUNÇÕES ---

    /**
     * Busca os produtos do arquivo JSON.
     */
    const fetchProducts = async () => {
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            filteredProducts = [...allProducts]; // Inicialmente, todos os produtos são exibidos
            displayProducts(); // Exibe os primeiros produtos
        } catch (error) {
            console.error("Falha ao carregar os produtos:", error);
            productListContainer.innerHTML = `<p class="text-red-500 text-center">Não foi possível carregar os produtos. Tente novamente mais tarde.</p>`;
        }
    };

    /**
     * Cria o HTML para um único card de produto.
     * @param {object} product - O objeto do produto.
     * @returns {string} O template HTML do card.
     */
    const createProductCard = (product) => {
        const tagColorClasses = product.tag.cor === 'green' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
        
        const checkmarkColorClass = product.tag.cor === 'green' ? 'text-green-600' : 'text-red-600';

        const beneficiosHtml = product.beneficios.map(b => `
            <li class="flex items-start">
                <span class="${checkmarkColorClass} mr-2">✓</span>
                <span>${b}</span>
            </li>
        `).join('');

        return `
            <div class="product-card bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 opacity-0 transform translate-y-4 animate-fade-in-up">
                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Logo -->
                    <div class="flex-shrink-0 flex justify-center lg:justify-start">
                        <div class="p-3 border rounded-lg bg-gray-50">
                            <img src="${product.logo}" alt="Logo ${product.nome}" class="w-32 h-auto object-contain" onerror="this.onerror=null;this.src='https://placehold.co/128x40/e2e8f0/4a5568?text=Logo';">
                        </div>
                    </div>
                    <!-- Conteúdo -->
                    <div class="flex-grow">
                        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <!-- Texto -->
                            <div class="flex-grow">
                                <span class="inline-block ${tagColorClasses} text-xs font-semibold px-3 py-1 rounded-full mb-3">${product.tag.texto}</span>
                                <h4 class="text-xl font-bold text-gray-800 mb-3">${product.nome}</h4>
                                <ul class="space-y-2 text-gray-600 mb-4">${beneficiosHtml}</ul>
                            </div>
                            <!-- Ações -->
                            <div class="flex-shrink-0">
                                <div class="product-actions space-y-2 sm:space-y-0 sm:flex sm:flex-col">
                                    <a href="${product.links.principal.url}" target="_blank" rel="noopener noreferrer" class="btn-primary text-center">${product.links.principal.texto}</a>
                                    <a href="${product.links.secundario.url}" target="_blank" rel="noopener noreferrer" class="btn-secondary text-center">${product.links.secundario.texto}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Exibe a próxima leva de produtos na lista.
     */
    const displayProducts = () => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';

        const productsToLoad = filteredProducts.slice(currentProductIndex, currentProductIndex + PRODUCTS_PER_PAGE);

        if (productsToLoad.length === 0 && currentProductIndex === 0) {
            if (noResultsMessage) noResultsMessage.style.display = 'block';
        } else {
            if (noResultsMessage) noResultsMessage.style.display = 'none';
        }

        productsToLoad.forEach(product => {
            productListContainer.insertAdjacentHTML('beforeend', createProductCard(product));
        });

        currentProductIndex += productsToLoad.length;
    };

    /**
     * Aplica os filtros com base na seleção do formulário.
     */
    const applyFilters = () => {
        const formData = new FormData(filterForm);
        const tipo = formData.get('tipo');
        const perfis = formData.getAll('perfil');

        filteredProducts = allProducts.filter(product => {
            const tipoMatch = tipo === 'todos' || product.tipo === tipo;
            const perfilMatch = perfis.length === 0 || perfis.some(p => product.perfil.includes(p));
            return tipoMatch && perfilMatch;
        });

        // Reseta a visualização
        productListContainer.innerHTML = '';
        currentProductIndex = 0;
        displayProducts();
    };

    /**
     * Observador para o scroll infinito.
     */
    const setupInfiniteScroll = () => {
        const observer = new IntersectionObserver((entries) => {
            const firstEntry = entries[0];
            if (firstEntry.isIntersecting && currentProductIndex < filteredProducts.length) {
                if (loadingIndicator) loadingIndicator.style.display = 'flex';
                // Simula um pequeno atraso para a UX do loading
                setTimeout(() => {
                    displayProducts();
                }, 500);
            }
        }, { threshold: 1.0 });

        if (loadingIndicator) {
            observer.observe(loadingIndicator);
        }
    };

    // --- INICIALIZAÇÃO ---
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });
    
    // Aplica o filtro também em mudanças nos inputs
    filterForm.addEventListener('change', applyFilters);

    fetchProducts();
    setupInfiniteScroll();
});


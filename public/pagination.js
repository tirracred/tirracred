/****************************************************************
 *           SISTEMA DE PAGINAÇÃO INFINITA – TirraCred          *
 *  Detecta produtos já presentes, respeita filtros existentes  *
 ****************************************************************/

class ProductPagination {
  constructor({ itemsPerPage = 6 } = {}) {
    this.itemsPerPage = itemsPerPage;
    this.currentPage  = 1;
    this.allProducts  = [];
    this.filtered     = [];
    this.topNav       = null;
    this.bottomNav    = null;
    this.wrapper      = document.querySelector('#product-list');
    if (!this.wrapper) return;          // Lista não encontrada
    this.buildNav();                    // cria containers
    this.collect();                     // lê produtos
    this.bindFilters();                 // escuta filtros
    this.render();                      // primeira renderização
  }

  /* ---------- Montagem ---------- */
  buildNav() {
    // Barra superior
    this.topNav = document.createElement('div');
    this.topNav.id = 'pagination-top';
    this.topNav.className = 'mt-6 flex justify-center flex-wrap gap-2';
    // Barra inferior
    this.bottomNav = this.topNav.cloneNode();
    this.bottomNav.id = 'pagination-bottom';
    // Insere antes/depois da lista
    this.wrapper.parentNode.insertBefore(this.topNav, this.wrapper);
    this.wrapper.parentNode.appendChild(this.bottomNav);
  }

  collect() {
    this.allProducts = Array.from(this.wrapper.querySelectorAll('.product-card'));
    this.applyFilters();                // preenche this.filtered
  }

  bindFilters() {
    const filters = document.querySelectorAll(
      'input[name="product_type"], input[data-filter="perfil"]'
    );
    filters.forEach(i => i.addEventListener('change', () => {
      this.applyFilters();
      this.currentPage = 1;
      this.render();
    }));
  }

  applyFilters() {
    const type = document.querySelector('input[name="product_type"]:checked')?.value || 'all';
    const profiles = Array.from(
      document.querySelectorAll('input[data-filter="perfil"]:checked')
    ).map(cb => cb.value);

    this.filtered = this.allProducts.filter(card => {
      const okType = type === 'all' || card.dataset.tipo === type;
      const cardProf = (card.dataset.perfil || '').split(/\s+/);
      const okProf = profiles.length === 0 || profiles.every(p => cardProf.includes(p));
      return okType && okProf;
    });
  }

  /* ---------- Renderização ---------- */
  render() {
    const totalPages = Math.max(1, Math.ceil(this.filtered.length / this.itemsPerPage));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    // Oculta tudo
    this.allProducts.forEach(c => (c.style.display = 'none'));

    // Mostra página atual
    const ini = (this.currentPage - 1) * this.itemsPerPage;
    const fim = ini + this.itemsPerPage;
    this.filtered.slice(ini, fim).forEach((c, i) => {
      c.style.display = 'block';
      c.style.opacity = '0';
      c.style.transform = 'translateY(15px)';
      setTimeout(() => {
        c.style.opacity = '1';
        c.style.transform = 'translateY(0)';
        c.style.transition = 'all .3s ease';
      }, i * 80);
    });

    // Reconstrói controles
    this.buildControls(this.topNav,  totalPages);
    this.buildControls(this.bottomNav, totalPages);
  }

  buildControls(container, totalPages) {
    container.innerHTML = '';
    if (totalPages === 1) return;

    // Botão Anterior
    container.appendChild(this.makeBtn('Anterior', this.currentPage === 1, () => {
      this.currentPage--; this.render(); this.scrollToList();
    }));

    // Números (ellipsis inteligente)
    this.visiblePages(totalPages).forEach(p => {
      if (p === '…') {
        const span = document.createElement('span');
        span.textContent = '…';
        span.className = 'px-2 text-gray-500';
        container.appendChild(span);
      } else {
        const active = p === this.currentPage;
        container.appendChild(this.makeBtn(p, active, () => {
          this.currentPage = p; this.render(); this.scrollToList();
        }, active));
      }
    });

    // Botão Próximo
    container.appendChild(this.makeBtn('Próximo', this.currentPage === totalPages, () => {
      this.currentPage++; this.render(); this.scrollToList();
    }));
  }

  makeBtn(label, disabled, onClick, highlighted = false) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.disabled = disabled;
    btn.className = highlighted
      ? 'px-3 py-1 rounded-lg text-sm font-semibold border border-green-600 bg-green-600 text-white'
      : 'px-3 py-1 rounded-lg text-sm font-medium border ' +
        (disabled
          ? 'text-gray-400 border-gray-300 cursor-not-allowed'
          : 'border-gray-300 text-gray-700 hover:bg-gray-100');
    if (!disabled && !highlighted) btn.addEventListener('click', onClick);
    return btn;
  }

  visiblePages(total) {
    const max = 5;                 // máximo de botões numerados
    if (total <= max) return [...Array(total).keys()].map(i => i + 1);

    const pages = [];
    const c = this.currentPage;

    if (c <= 3) {
      pages.push(1, 2, 3, 4, '…', total);
    } else if (c >= total - 2) {
      pages.push(1, '…', total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '…', c - 1, c, c + 1, '…', total);
    }
    return pages;
  }

  scrollToList() {
    window.scrollTo({ top: this.wrapper.offsetTop - 80, behavior: 'smooth' });
  }
}

/* ----------- Inicialização automática ----------- */
document.addEventListener('DOMContentLoaded', () => {
  window.productPagination = new ProductPagination({ itemsPerPage: 6 });
});

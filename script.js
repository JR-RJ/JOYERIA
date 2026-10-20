const pageLoader = document.createElement('div');
pageLoader.className = 'jr-page-loader';
pageLoader.setAttribute('aria-hidden', 'true');
pageLoader.setAttribute('role', 'status');
pageLoader.setAttribute('aria-live', 'polite');
pageLoader.innerHTML = '<span class="jr-page-loader-mark">JR</span><span class="jr-page-loader-label">Cargando</span><span class="jr-page-loader-progress" aria-hidden="true"></span>';
document.body.appendChild(pageLoader);

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target.closest?.('a[href]');
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) return;
  if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

  event.preventDefault();
  pageLoader.classList.add('is-visible');
  pageLoader.setAttribute('aria-hidden', 'false');
  setTimeout(() => window.location.assign(destination.href), 180);
});

const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('nav-glass');
    } else {
      navbar.classList.remove('nav-glass');
    }
  });

  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });
  revealElements.forEach(el => observer.observe(el));

  const cartStorageKey = 'jr-joyeria-cart';
  const cartPriceAdjustmentKey = 'jr-joyeria-price-adjustment-1-5';
  const checkoutPendingKey = 'jr-joyeria-checkout-pending';
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  let cart = loadCart();

  function showToast(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.transform = 'translateY(6rem)';
      toast.style.opacity = '0';
    }, 2500);
  }

  function loadCart() {
    try {
      const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
      const loadedCart = Array.isArray(savedCart)
        ? savedCart.filter(item => item && item.id && item.name && Number(item.price) > 0 && Number(item.quantity) > 0)
          .map(item => ({ ...item, price: Number(item.price), quantity: Math.floor(Number(item.quantity)) }))
        : [];
      if (localStorage.getItem(cartPriceAdjustmentKey) !== 'true') {
        loadedCart.forEach(item => {
          item.price = Math.round(item.price * 1.5);
          item.id = `${item.name}|${item.price}|${item.image}`;
        });
        localStorage.setItem(cartStorageKey, JSON.stringify(loadedCart));
        localStorage.setItem(cartPriceAdjustmentKey, 'true');
      }
      return loadedCart;
    } catch {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch {
      showToast('No se pudo guardar el carrito en este navegador.');
    }
    renderCart();
  }

  function clearCartAfterCheckoutReturn() {
    try {
      if (sessionStorage.getItem(checkoutPendingKey) !== 'true') return;
      sessionStorage.removeItem(checkoutPendingKey);
    } catch {
      return;
    }
    cart = [];
    saveCart();
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(price);
  }

  function renderImportedCatalog() {
    const productGrid = document.getElementById('productGrid');
    const isChainCatalog = Array.isArray(window.CADENAS_PRODUCTS);
    const isPulseraCatalog = Array.isArray(window.PULSERAS_PRODUCTS);
    const isAretesCatalog = Array.isArray(window.ARETES_PRODUCTS);
    const isDijeCatalog = Array.isArray(window.DIJES_PRODUCTS);
    const isHerrajeCatalog = Array.isArray(window.HERRAJES_PRODUCTS);
    const isRosarioCatalog = Array.isArray(window.ROSARIOS_PRODUCTS);
    const catalogProducts = isChainCatalog
      ? window.CADENAS_PRODUCTS
      : isPulseraCatalog
        ? window.PULSERAS_PRODUCTS
        : isAretesCatalog
          ? window.ARETES_PRODUCTS
          : isDijeCatalog
            ? window.DIJES_PRODUCTS
            : isHerrajeCatalog
              ? window.HERRAJES_PRODUCTS
              : isRosarioCatalog
                ? window.ROSARIOS_PRODUCTS
                : window.ANILLOS_PRODUCTS;
    if (!productGrid || !Array.isArray(catalogProducts)) return;

    const productCards = document.createDocumentFragment();
    catalogProducts.forEach(product => {
      const card = document.createElement('article');
      card.className = 'product-card chain-product-card';
      card.dataset.available = String(product.available);

        const media = document.createElement('button');
        media.type = 'button';
      media.className = 'chain-product-media';
      const image = document.createElement('img');
      const imageUrl = new URL(product.image);
      imageUrl.searchParams.set('width', '720');
      image.src = imageUrl.href;
      image.alt = product.name;
      image.loading = 'lazy';
      image.decoding = 'async';
      media.appendChild(image);

      const details = document.createElement('div');
      details.className = 'chain-product-details';
      const material = document.createElement('div');
      material.className = 'chain-product-material';
      const productType = isChainCatalog
        ? 'Cadena'
        : isPulseraCatalog
          ? (/^pulso\b/i.test(product.name) ? 'Pulso' : 'Pulsera')
          : isAretesCatalog
            ? (/^topos?\b/i.test(product.name) ? 'Topo' : (/^candonga/i.test(product.name) ? 'Candonga' : 'Arete'))
            : isDijeCatalog
              ? 'Dije'
              : isHerrajeCatalog
                ? 'Herraje'
                : isRosarioCatalog
                  ? 'Rosario'
                  : 'Anillo';
      const materialType = product.material || (/nacional/i.test(product.name) ? 'Oro nacional' : 'Oro 18k');
      material.textContent = `${productType} · ${materialType}`;
        media.setAttribute('aria-label', `Ver fotos de ${product.name}`);
        media.addEventListener('click', () => openProductDetails(product, productType, card));

      const name = document.createElement('h3');
      name.className = 'font-serif chain-product-name';
        const nameButton = document.createElement('button');
        nameButton.type = 'button';
        nameButton.className = 'jr-product-name-button';
        nameButton.textContent = product.name;
        name.appendChild(nameButton);
        nameButton.addEventListener('click', () => openProductDetails(product, productType, card));

      const price = document.createElement('span');
      price.className = 'chain-product-price';
      price.textContent = formatPrice(Number(product.price));

      details.append(material, name, price);
      card.append(media, details);
      productCards.appendChild(card);
    });

    productGrid.replaceChildren(productCards);
  }

  function getProductDetailDialog() {
    let dialog = document.getElementById('jrProductDialog');
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.id = 'jrProductDialog';
    dialog.className = 'jr-product-dialog';
    dialog.setAttribute('aria-labelledby', 'jrProductDetailTitle');
    dialog.innerHTML = `
      <div class="jr-product-dialog-inner">
        <button type="button" class="jr-product-dialog-close" aria-label="Cerrar detalle">&times;</button>
        <div class="jr-product-gallery">
          <div class="jr-product-main-image-wrap">
            <img class="jr-product-main-image" alt="">
            <button type="button" class="jr-product-carousel-arrow is-previous" data-gallery-step="-1" aria-label="Foto anterior">&#8249;</button>
            <button type="button" class="jr-product-carousel-arrow is-next" data-gallery-step="1" aria-label="Foto siguiente">&#8250;</button>
          </div>
          <div class="jr-product-thumbnails" aria-label="Fotos del producto"></div>
          <div class="jr-product-gallery-controls">
            <span data-gallery-count aria-live="polite"></span>
          </div>
        </div>
        <section class="jr-product-dialog-details">
          <p class="jr-product-detail-type"></p>
          <h2 id="jrProductDetailTitle"></h2>
          <section class="jr-product-specifications" aria-label="Detalles de la pieza">
            <h3>Detalles de la pieza</h3>
            <div class="jr-product-specification-list"></div>
          </section>
          <p class="jr-product-detail-price"></p>
          <p class="jr-product-detail-availability"></p>
          <button type="button" class="jr-add-to-cart" data-product-detail-add>Agregar al carrito</button>
        </section>
      </div>`;
    document.body.appendChild(dialog);

    const state = { images: [], index: 0, card: null, direction: 1, touchStartX: null };
    const mainImage = dialog.querySelector('.jr-product-main-image');
    const mainImageWrap = dialog.querySelector('.jr-product-main-image-wrap');
    const thumbnails = dialog.querySelector('.jr-product-thumbnails');
    const galleryCount = dialog.querySelector('[data-gallery-count]');
    const galleryControls = dialog.querySelector('.jr-product-gallery-controls');
    const renderGallery = () => {
      const imageUrl = new URL(state.images[state.index]);
      imageUrl.searchParams.set('width', '1200');
      mainImage.src = imageUrl.href;
      mainImage.classList.remove('is-changing-left', 'is-changing-right');
      void mainImage.offsetWidth;
      mainImage.classList.add(state.direction < 0 ? 'is-changing-left' : 'is-changing-right');
      mainImage.alt = dialog.querySelector('#jrProductDetailTitle').textContent;
      galleryCount.textContent = `${state.index + 1} / ${state.images.length}`;
      thumbnails.replaceChildren();
      state.images.forEach((src, index) => {
        const thumbnailButton = document.createElement('button');
        thumbnailButton.type = 'button';
        thumbnailButton.className = 'jr-product-thumbnail';
        thumbnailButton.setAttribute('aria-label', `Ver foto ${index + 1}`);
        thumbnailButton.setAttribute('aria-pressed', String(index === state.index));
        const thumbnail = document.createElement('img');
        const thumbnailUrl = new URL(src);
        thumbnailUrl.searchParams.set('width', '180');
        thumbnail.src = thumbnailUrl.href;
        thumbnail.alt = '';
        thumbnailButton.appendChild(thumbnail);
        thumbnailButton.addEventListener('click', () => {
          state.direction = index < state.index ? -1 : 1;
          state.index = index;
          renderGallery();
        });
        thumbnails.appendChild(thumbnailButton);
      });
      galleryControls.hidden = state.images.length < 2;
      dialog.querySelectorAll('.jr-product-carousel-arrow').forEach(button => {
        button.hidden = state.images.length < 2;
      });
    };

    dialog._jrProductState = state;
    dialog._jrRenderGallery = renderGallery;
    dialog.querySelector('.jr-product-dialog-close').addEventListener('click', () => dialog.close());
    const stepGallery = direction => {
      if (state.images.length < 2) return;
      state.direction = direction;
      state.index = (state.index + direction + state.images.length) % state.images.length;
      renderGallery();
    };
    dialog.querySelectorAll('[data-gallery-step]').forEach(button => {
      button.addEventListener('click', () => stepGallery(Number(button.dataset.galleryStep)));
    });
    mainImageWrap.addEventListener('touchstart', event => {
      state.touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    mainImageWrap.addEventListener('touchend', event => {
      if (state.touchStartX === null) return;
      const distance = event.changedTouches[0].clientX - state.touchStartX;
      state.touchStartX = null;
      if (Math.abs(distance) > 45) stepGallery(distance < 0 ? 1 : -1);
    }, { passive: true });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') stepGallery(-1);
      if (event.key === 'ArrowRight') stepGallery(1);
    });
    dialog.querySelector('[data-product-detail-add]').addEventListener('click', () => {
      addProductToCart(state.card);
      dialog.close();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    return dialog;
  }

  function openProductDetails(product, productType, card) {
    const dialog = getProductDetailDialog();
    const state = dialog._jrProductState;
    state.card = card;
    state.images = [...new Set([...(product.images || []), product.image].filter(Boolean))];
    state.index = 0;
    state.direction = 1;
    const nameParts = product.name.split(/\s+\/\s+/).map(part => part.trim()).filter(Boolean);
    const specifications = nameParts.slice(1).map(value => ({
      label: /\bgr\b/i.test(value) ? 'Peso'
        : /talla/i.test(value) ? 'Talla'
          : /\bcm\b/i.test(value) ? 'Largo'
            : /\bmm\b/i.test(value) ? 'Medida'
              : /oro/i.test(value) ? 'Metal'
                : 'Detalle',
      value
    }));
    if (product.sku) specifications.push({ label: 'Referencia', value: product.sku });
    dialog.querySelector('.jr-product-detail-type').textContent = productType;
    dialog.querySelector('#jrProductDetailTitle').textContent = nameParts[0] || product.name;
    const specificationsSection = dialog.querySelector('.jr-product-specifications');
    const specificationsList = dialog.querySelector('.jr-product-specification-list');
    specificationsList.replaceChildren();
    specifications.forEach(specification => {
      const item = document.createElement('div');
      item.className = 'jr-product-specification';
      const label = document.createElement('span');
      label.textContent = specification.label;
      const value = document.createElement('strong');
      value.textContent = specification.value;
      item.append(label, value);
      specificationsList.appendChild(item);
    });
    specificationsSection.hidden = specifications.length === 0;
    dialog.querySelector('.jr-product-detail-price').textContent = card.querySelector('.chain-product-price').textContent;
    const available = product.available !== false;
    dialog.querySelector('.jr-product-detail-availability').textContent = available ? 'Disponible' : 'Agotado';
    const addButton = dialog.querySelector('[data-product-detail-add]');
    addButton.disabled = !available;
    addButton.hidden = !available;
    dialog._jrRenderGallery();
    dialog.showModal();
  }

  async function refreshShopifyCatalog() {
    const catalogSources = [
      { key: 'CADENAS_PRODUCTS', handle: 'cadenas' },
      { key: 'ANILLOS_PRODUCTS', handle: 'candongas-copia' },
      { key: 'PULSERAS_PRODUCTS', handle: 'dijes-copia' },
      { key: 'ROSARIOS_PRODUCTS', handle: 'rosarios-y-camandulas' },
      { key: 'HERRAJES_PRODUCTS', handle: 'tobilleras-copia' },
      { key: 'DIJES_PRODUCTS', handle: 'solitario-copia' },
      { key: 'ARETES_PRODUCTS', handle: 'cadenas-60-cm-copia' }
    ];
    const catalog = catalogSources.find(source => Array.isArray(window[source.key]));
    if (!catalog) return;

    try {
      const response = await fetch(`https://joyeriaiconiq.com/collections/${catalog.handle}/products.json?limit=250`, {
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Shopify respondió ${response.status}`);

      const data = await response.json();
      const products = Array.isArray(data.products)
        ? data.products.map(product => ({
            id: String(product.id),
            name: product.title,
            price: Number(product.variants?.[0]?.price),
            image: product.images?.[0]?.src || product.image?.src,
            images: product.images?.map(image => image.src).filter(Boolean) || [],
            sku: product.variants?.[0]?.sku || '',
            available: product.variants?.some(variant => variant.available) || false
          })).filter(product => product.name && product.price > 0 && product.image)
        : [];

      if (products.length === 0) throw new Error('Shopify no devolvió productos válidos');

      window[catalog.key] = products;
      renderImportedCatalog();
      setupProductButtons();
      window.dispatchEvent(new Event('jr:catalog-updated'));
    } catch (error) {
      console.warn(`No se pudo actualizar ${catalog.key}; se conserva la copia local.`, error);
    }
  }

  function createCartInterface() {
    if (document.getElementById('jrCartPanel')) return;

    const cartButton = document.createElement('button');
    cartButton.id = 'jrCartToggle';
    cartButton.type = 'button';
    cartButton.className = 'jr-cart-toggle';
    cartButton.setAttribute('aria-label', 'Abrir carrito');
    cartButton.setAttribute('aria-controls', 'jrCartPanel');
    cartButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>Carrito</span><span id="cartCount" class="jr-cart-count">0</span>';

    const overlay = document.createElement('button');
    overlay.id = 'cartOverlay';
    overlay.type = 'button';
    overlay.className = 'jr-cart-overlay';
    overlay.setAttribute('aria-label', 'Cerrar carrito');

    const panel = document.createElement('aside');
    panel.id = 'jrCartPanel';
    panel.className = 'jr-cart-panel';
    panel.setAttribute('aria-labelledby', 'jrCartTitle');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="jr-cart-header">
        <div><span class="jr-cart-eyebrow">JR JOYERÍA</span><h2 id="jrCartTitle">Tu carrito</h2></div>
        <button type="button" class="jr-cart-close" aria-label="Cerrar carrito">&times;</button>
      </div>
      <div id="cartItems" class="jr-cart-items" aria-live="polite"></div>
      <div class="jr-cart-footer">
        <div class="jr-cart-total"><span>Total</span><strong id="cartTotal">$0</strong></div>
        <p>El envío y la disponibilidad se confirman por WhatsApp.</p>
        <section class="jr-payment-methods" aria-label="Métodos de pago">
          <div class="jr-payment-heading">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><path d="M12 14v3"></path></svg>
            <span>Pagos seguros</span>
          </div>
          <div class="jr-payment-logos" aria-label="PSE, Nequi y DaviPlata">
            <span class="jr-payment-logo jr-payment-pse">PSE</span>
            <span class="jr-payment-logo jr-payment-nequi">Nequi</span>
            <span class="jr-payment-logo jr-payment-daviplata">DaviPlata</span>
          </div>
          <p class="jr-payment-note">Coordina el pago con nuestro equipo por WhatsApp.</p>
        </section>
        <button type="button" id="jrCheckout" class="jr-cart-checkout">Continuar por WhatsApp</button>
      </div>`;

    (document.querySelector('.navbar-container') || document.body).appendChild(cartButton);
    document.body.append(overlay, panel);
  }

  function renderCart() {
    const itemsContainer = document.getElementById('cartItems');
    const countElement = document.getElementById('cartCount');
    const totalElement = document.getElementById('cartTotal');
    const checkoutButton = document.getElementById('jrCheckout');
    if (!itemsContainer || !countElement || !totalElement || !checkoutButton) return;

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    countElement.textContent = itemCount;
    countElement.hidden = itemCount === 0;
    totalElement.textContent = formatPrice(cartTotal);
    checkoutButton.disabled = cart.length === 0;
    itemsContainer.replaceChildren();

    if (cart.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'jr-cart-empty';
      emptyMessage.textContent = 'Tu carrito está vacío. Explora las colecciones y agrega tus piezas favoritas.';
      itemsContainer.appendChild(emptyMessage);
      return;
    }

    cart.forEach(item => {
      const row = document.createElement('article');
      row.className = 'jr-cart-item';

      const image = document.createElement('img');
      image.src = item.image;
      image.alt = '';
      image.loading = 'lazy';

      const details = document.createElement('div');
      details.className = 'jr-cart-item-details';
      const name = document.createElement('h3');
      name.textContent = item.name;
      const price = document.createElement('p');
      price.textContent = formatPrice(item.price * item.quantity);

      const controls = document.createElement('div');
      controls.className = 'jr-cart-item-controls';
      controls.innerHTML = `
        <div class="jr-quantity-control" aria-label="Cantidad">
          <button type="button" data-cart-action="decrease" data-cart-id="${encodeURIComponent(item.id)}" aria-label="Quitar una unidad">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-cart-action="increase" data-cart-id="${encodeURIComponent(item.id)}" aria-label="Agregar una unidad">+</button>
        </div>
        <button type="button" class="jr-cart-remove" data-cart-action="remove" data-cart-id="${encodeURIComponent(item.id)}">Eliminar</button>`;

      details.append(name, price, controls);
      row.append(image, details);
      itemsContainer.appendChild(row);
    });
  }

  function openCart() {
    const panel = document.getElementById('jrCartPanel');
    const overlay = document.getElementById('cartOverlay');
    panel?.classList.add('open');
    overlay?.classList.add('open');
    panel?.setAttribute('aria-hidden', 'false');
    document.getElementById('jrCartToggle')?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  }

  function closeCart() {
    const panel = document.getElementById('jrCartPanel');
    const overlay = document.getElementById('cartOverlay');
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
    panel?.setAttribute('aria-hidden', 'true');
    document.getElementById('jrCartToggle')?.setAttribute('aria-expanded', 'false');
    if (!document.querySelector('.mobile-menu.open')) {
      document.body.classList.remove('no-scroll');
    }
  }

  function addProductToCart(card) {
    const name = card.querySelector('h3')?.textContent.trim();
    const image = card.querySelector('img')?.getAttribute('src');
    const priceElement = card.querySelector('span[style*="color: #c9a961"], .chain-product-price');
    const price = Number(priceElement?.textContent.replace(/[^\d]/g, '')) || 0;
    if (!name || !image || !price) return;

    const id = `${name}|${price}|${image}`;
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, image, price, quantity: 1 });
    }

    saveCart();
    showToast(`${name} agregado al carrito`);
  }

  function setupProductButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
      if (card.querySelector('.jr-add-to-cart')) return;

      const productName = card.querySelector('h3')?.textContent.trim();
      const info = card.lastElementChild;
      if (!productName || !info) return;

      const priceElement = card.querySelector('span[style*="color: #c9a961"], .chain-product-price');
      if (priceElement && priceElement.dataset.priceAdjusted !== 'true') {
        const currentPrice = Number(priceElement.textContent.replace(/[^\d]/g, '')) || 0;
        if (currentPrice > 0) {
          priceElement.textContent = formatPrice(currentPrice * 1.5);
          priceElement.dataset.priceAdjusted = 'true';
        }
      }
      const price = Number(priceElement?.textContent.replace(/[^\d]/g, '')) || 0;
      if (price > 0 && card.dataset.available !== 'false') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'jr-add-to-cart';
        button.textContent = 'Agregar al carrito';
        button.addEventListener('click', () => addProductToCart(card));
        info.appendChild(button);
      } else if (card.dataset.available === 'false') {
        const unavailableLabel = document.createElement('button');
        unavailableLabel.type = 'button';
        unavailableLabel.className = 'jr-add-to-cart jr-sold-out';
        unavailableLabel.disabled = true;
        unavailableLabel.textContent = 'Agotado';
        info.appendChild(unavailableLabel);
      } else {
        const contactLink = document.createElement('a');
        contactLink.className = 'jr-add-to-cart jr-inquire-price';
        contactLink.href = `https://wa.me/573003715460?text=${encodeURIComponent(`Hola, quisiera consultar el precio de ${productName}.`)}`;
        contactLink.target = '_blank';
        contactLink.rel = 'noopener noreferrer';
        contactLink.textContent = 'Consultar disponibilidad';
        info.appendChild(contactLink);
      }
    });
  }

  function setupCartEvents() {
    window.addEventListener('pageshow', clearCartAfterCheckoutReturn);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') clearCartAfterCheckoutReturn();
    });
    document.getElementById('jrCartToggle')?.addEventListener('click', openCart);
    document.getElementById('cartOverlay')?.addEventListener('click', closeCart);
    document.querySelector('.jr-cart-close')?.addEventListener('click', closeCart);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeCart();
    });

    document.getElementById('cartItems')?.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-cart-action]');
      if (!actionButton) return;

      const itemId = decodeURIComponent(actionButton.dataset.cartId);
      const item = cart.find(cartItem => cartItem.id === itemId);
      if (!item) return;

      if (actionButton.dataset.cartAction === 'increase') item.quantity += 1;
      if (actionButton.dataset.cartAction === 'decrease') item.quantity -= 1;
      if (actionButton.dataset.cartAction === 'remove' || item.quantity < 1) {
        cart = cart.filter(cartItem => cartItem.id !== itemId);
      }
      saveCart();
    });

    document.getElementById('jrCheckout')?.addEventListener('click', () => {
      if (cart.length === 0) return;
      const orderLines = cart.map(item => `- ${item.name} x${item.quantity}: ${formatPrice(item.price * item.quantity)}`);
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const message = `Hola, quiero hacer este pedido:\n${orderLines.join('\n')}\n\nTotal: ${formatPrice(total)}\n¿Me confirman disponibilidad y envío?`;
      try {
        sessionStorage.setItem(checkoutPendingKey, 'true');
      } catch {}
      cart = [];
      saveCart();
      window.location.href = `https://wa.me/573003715460?text=${encodeURIComponent(message)}`;
    });

    window.addEventListener('storage', event => {
      if (event.key === cartStorageKey) {
        cart = loadCart();
        renderCart();
      }
    });
  }

  renderImportedCatalog();
  createCartInterface();
  setupProductButtons();
  refreshShopifyCatalog();
  setupCartEvents();
  renderCart();

/*MEN MOVIL*/
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const mobileOverlay = document.getElementById("mobileOverlay");
const closeMobileMenu = document.getElementById("closeMobileMenu");

function openMobileMenu() {
  mobileMenu.classList.add("open");
  mobileOverlay.classList.add("open");

  document.body.classList.add("no-scroll");
}

function closeMobileMenuFunction() {
  mobileMenu.classList.remove("open");
  mobileOverlay.classList.remove("open");

  document.body.classList.remove("no-scroll");
}

/*Abrir*/
mobileMenuBtn.addEventListener("click", openMobileMenu);

/*errar con X*/
closeMobileMenu.addEventListener("click", closeMobileMenuFunction);

/*Cerrar haciendo clic fuera*/
mobileOverlay.addEventListener("click", closeMobileMenuFunction);

/*Cerrar al seleccionar una opción*/
const mobileLinks = document.querySelectorAll(".mobile-menu-links a");

mobileLinks.forEach(link => {
  link.addEventListener("click", closeMobileMenuFunction);
});


document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("productSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const priceFilter = document.getElementById("priceFilter");
    const gridColumnsFilter = document.getElementById("gridColumnsFilter");
    const clearSearch = document.getElementById("clearSearch");
    const filterInfo = document.getElementById("filterInfo");
    const productGrid = document.getElementById("productGrid");

    if (
        !searchInput ||
        !categoryFilter ||
        !priceFilter ||
        !gridColumnsFilter ||
        !clearSearch ||
        !filterInfo ||
        !productGrid
    ) {
        return;
    }

      const mobileGridMediaQuery = window.matchMedia("(max-width: 600px)");

      function getGridColumnsStorageKey() {
        return `jr-grid-columns-${mobileGridMediaQuery.matches ? "mobile" : "desktop"}`;
      }

      function applyGridColumns() {
        productGrid.style.gridTemplateColumns = `repeat(${gridColumnsFilter.value}, minmax(0, 1fr))`;
      }

      function loadGridColumnsPreference() {
        const defaultColumns = mobileGridMediaQuery.matches ? "2" : "4";
        let selectedColumns = defaultColumns;
        try {
          const savedColumns = localStorage.getItem(getGridColumnsStorageKey());
          if (["1", "2", "3", "4"].includes(savedColumns)) {
            selectedColumns = savedColumns;
          }
        } catch {}
        gridColumnsFilter.value = selectedColumns;
        applyGridColumns();
      }

      gridColumnsFilter.addEventListener("change", () => {
        applyGridColumns();
        try {
          localStorage.setItem(getGridColumnsStorageKey(), gridColumnsFilter.value);
        } catch {}
      });
      mobileGridMediaQuery.addEventListener("change", loadGridColumnsPreference);
      loadGridColumnsPreference();

    let products = Array.from(
        productGrid.querySelectorAll(".product-card")
    );

    // Mensaje de "sin resultados"
    const noResults = document.createElement("div");

    noResults.className = "no-results";

    noResults.innerHTML = `
        <h3>No encontramos productos</h3>
        <p>Prueba con otro nombre, categoría, peso o diseño.</p>
    `;

    noResults.style.display = "none";

    productGrid.appendChild(noResults);

    function normalizeText(text) {

        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[.,/]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    }

    // OBTENER PRECIO

    function getProductPrice(product) {

    const priceElement = product.querySelector(
        'span[style*="color: #c9a961"], .chain-product-price'
    );

    if (!priceElement) {
        return 0;
    }

    const priceText = priceElement.textContent
        .replace(/[^\d]/g, "");

    return Number(priceText) || 0;
}

    // FILTRAR
    function filterProducts() {

        const searchValue = normalizeText(searchInput.value);

        const categoryValue = normalizeText(categoryFilter.value);

        const selectedPriceFilter = priceFilter.value;
        const maxPrice = /^\d+$/.test(selectedPriceFilter)
          ? Number(selectedPriceFilter)
          : Infinity;

        const sortedProducts = [...products];
        if (selectedPriceFilter === "sort-asc") {
          sortedProducts.sort((first, second) => getProductPrice(first) - getProductPrice(second));
        } else if (selectedPriceFilter === "sort-desc") {
          sortedProducts.sort((first, second) => getProductPrice(second) - getProductPrice(first));
        }

        let visibleProducts = 0;

        sortedProducts.forEach(product => {
          productGrid.insertBefore(product, noResults);

            const productText = normalizeText(product.textContent);
            // Permite buscar varias palabras:
            // "corazon diamantado"
            // y exige que ambas aparezcan
            const searchWords = searchValue
                .split(" ")
                .filter(word => word.length > 0);

            const matchesSearch = searchWords.every(word =>
                productText.includes(word)
            );


            // CATEGORiA
            let matchesCategory = true;

            if (categoryValue !== "all") {

                matchesCategory = productText.includes(categoryValue);

            }

            // PRECIO
            const productPrice = getProductPrice(product);

            const matchesPrice = productPrice <= maxPrice;

            // RESULTADO FINAL
            const showProduct =
                matchesSearch &&
                matchesCategory &&
                matchesPrice;


            if (showProduct) {

                product.style.display = "";

                visibleProducts++;

            } else {

                product.style.display = "none";

            }

        });

        // Mostrar / ocultar "sin resultados"
        noResults.style.display =
            visibleProducts === 0 ? "block" : "none";


        if (visibleProducts === 0) {

            filterInfo.textContent = "0 productos encontrados";

        } else if (
            searchValue === "" &&
            categoryValue === "all" &&
            priceFilter.value === "all"
        ) {

            filterInfo.textContent =
                `Mostrando ${visibleProducts} productos`;

        } else {

            filterInfo.textContent =
                `${visibleProducts} producto${visibleProducts !== 1 ? "s" : ""} encontrado${visibleProducts !== 1 ? "s" : ""}`;

        }


        // Mostrar botón X solamente cuando hay búsqueda
        clearSearch.style.display =
            searchInput.value.length > 0 ? "block" : "none";

    }

      window.addEventListener("jr:catalog-updated", () => {
        products = Array.from(productGrid.querySelectorAll(".product-card"));
        productGrid.appendChild(noResults);
        filterProducts();
      });

    searchInput.addEventListener("input", filterProducts);

    categoryFilter.addEventListener("change", filterProducts);

    priceFilter.addEventListener("change", filterProducts);


    // Limpiar búsqueda
    clearSearch.addEventListener("click", () => {

        searchInput.value = "";

        filterProducts();

        searchInput.focus();

    });

    filterProducts();

});

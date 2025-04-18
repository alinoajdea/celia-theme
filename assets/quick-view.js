if (!customElements.get('quick-view')) {
  customElements.define(
    'quick-view',
    class QuickView extends HTMLElement {
      constructor() {
        super();
        this.quickViewButtons = document.querySelectorAll('.quick-view-button');
        this.quickViewModal = document.getElementById('quick-view-modal');
        this.quickViewContent = document.getElementById('quick-view-product-content');
        this.closeQuickView = document.querySelector('.close-quick-view');
        this.selectedVariantId = null;

        this.initEventListeners();
      }

      initEventListeners() {
        this.reinitializeEventListeners();
      
        if (this.closeQuickView) {
          this.closeQuickView.addEventListener('click', () => {
            this.quickViewModal.classList.add('hidden');
          });
        }
      
        this.quickViewModal.addEventListener('click', (event) => {
          const modalContent = this.quickViewContent.parentElement; // Assuming modal content is wrapped
          if (!modalContent.contains(event.target)) {
            this.quickViewModal.classList.add('hidden');
          }
        });
      
        // Listen for DOM updates (e.g., AJAX-loaded sections)
        const observer = new MutationObserver(() => {
          this.reinitializeEventListeners();
        });
      
        observer.observe(document.body, { childList: true, subtree: true });
      }      

      reinitializeEventListeners() {
        // Re-scan the DOM for all Quick View buttons
        const quickViewButtons = document.querySelectorAll('.quick-view-button');
      
        quickViewButtons.forEach((button) => {
          // Prevent duplicate listeners
          if (!button.dataset.quickViewInitialized) {
            const card = button.closest('.card');
            const imageContainer = card?.querySelector('.card__media');
      
            if (imageContainer) {
              const imageHeight = imageContainer.offsetHeight;
            
              // Adjust the offset based on the screen width
              const offset = window.innerWidth <= 768 ? 10 : 20; // Use -10px for mobile (screen width <= 768px), otherwise -20px
              button.style.top = `calc(${imageHeight}px - ${button.offsetHeight}px - ${offset}px)`;
            }            
      
            button.addEventListener('click', async (event) => {
              const productHandle = event.target.getAttribute('data-product-handle');
              await this.showQuickView(productHandle);
            });
      
            // Mark the button as initialized
            button.dataset.quickViewInitialized = true;
          }
        });
      }      

      async showQuickView(productHandle) {
        this.quickViewContent.innerHTML = `<p>${translations.loading}</p>`;
        this.quickViewModal.classList.remove('hidden');

        try {
          const response = await fetch(`/products/${productHandle}.js`);
          if (!response.ok) throw new Error('Failed to fetch product data');

          const product = await response.json();
          const images = product.images.map((img) =>
            img.startsWith('//') ? `https:${img}` : img
          );

          this.populateQuickView(product, images);
        } catch (error) {
          this.quickViewContent.innerHTML = `<p>${translations.errorLoading}</p>`;
          console.error('Quick View Error:', error);
        }
      }

      populateQuickView(product, images) {
        const variantsHTML = this.renderOptions(product.options, product.variants);
        const MAX_DESCRIPTION_LENGTH = 100;
        const description = product.description || "";
  
        const truncatedDescription =
          description.length > MAX_DESCRIPTION_LENGTH
            ? `${description.slice(0, MAX_DESCRIPTION_LENGTH)}...`
            : description;
            
        this.quickViewContent.innerHTML = `
          <div class="quick-view-wrapper">
            <div class="quick-view-gallery">${this.renderGallery(images)}</div>
            <div class="quick-view-details">
              <h2 class="product-title">${product.title}</h2>
              <div class="product-price">
                ${product.variants[0].compare_at_price > product.variants[0].price
                  ? `<span class="compare-price">${this.formatMoney(product.variants[0].compare_at_price)}</span>
                     <span class="sale-price">${this.formatMoney(product.variants[0].price)}</span>`
                  : `<span>${this.formatMoney(product.variants[0].price)}</span>`}
              </div>
              <div class="product-description">${truncatedDescription}</div>
              <a href="${product.url}" class="view-full-details">${translations.viewFullDetails}</a>
              ${variantsHTML}
              <div class="quantity-and-cart">
                <label for="quantity">${translations.quantity}</label>
                <input type="number" id="quantity" class="quantity-input" value="1" min="1">
                <button class="add-to-cart" ${
                  variantsHTML ? 'disabled' : ''
                }>${translations.addToCart}</button>
              </div>
            </div>
          </div>
        `;
      
        this.initializeGallery(images);
        if (variantsHTML) {
          this.initializeVariantSelection(product.variants);
        } else {
          this.selectedVariantId = product.variants[0]?.id; // Automatically select the single variant
          const addToCartButton = this.quickViewContent.querySelector('.add-to-cart');
          addToCartButton.disabled = !product.variants[0]?.available;
        }
        this.initializeAddToCart(product);
      }            

      renderGallery(images) {
        return `
          <div class="main-image-container">
            <img src="${images[0]}" alt="${translations.galleryViewer}" class="main-image">
          </div>
          <div class="thumbnails-container">
            ${images
              .map(
                (image, index) =>
                  `<img src="${image}" alt="${translations.loadImage}" class="thumbnail ${
                    index === 0 ? 'active' : ''
                  }" data-index="${index}">`
              )
              .join('')}
          </div>
        `;
      }

      renderOptions(options, variants) {
        if (
          variants.length === 1 &&
          options.length === 1 &&
          options[0].name.toLowerCase() === 'title' &&
          variants[0].options[0] === 'Default Title'
        ) {
          return ''; // No need to render options for a single "Default Title" variant
        }

        return options
          .map((option, optionIndex) => {
            const optionName = option.name || option;
            const isColorOption = optionName.toLowerCase() === 'color';
            const values = [...new Set(variants.map((variant) => variant.options[optionIndex]))];

            return `
              <div class="variant-option">
                <label>${optionName}:</label>
                <div>
                  ${values
                    .map((value) =>
                      isColorOption
                        ? `<button class="variant-button color-swatch" data-option-index="${optionIndex}" 
                            data-value="${value}" style="background-color: ${this.getColor(value)};" title="${value}"></button>`
                        : `<button class="variant-button" data-option-index="${optionIndex}" data-value="${value}">${value}</button>`
                    )
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('');
      }

      getColor(value) {
        const colors = {
          Red: '#FF0000',
          Blue: '#0000FF',
          Green: '#008000',
          Black: '#000000',
          White: '#FFFFFF',
        };
        return colors[value] || value;
      }

      initializeGallery(images) {
        const thumbnails = this.quickViewContent.querySelectorAll('.thumbnail');
        const mainImage = this.quickViewContent.querySelector('.main-image');
        thumbnails.forEach((thumbnail) => {
          thumbnail.addEventListener('click', (e) => {
            if (mainImage) mainImage.src = e.target.src;
            thumbnails.forEach((thumb) => thumb.classList.remove('active'));
            e.target.classList.add('active');
          });
        });
      }

      initializeVariantSelection(variants) {
        const variantButtons = this.quickViewContent.querySelectorAll('.variant-button');
        variantButtons.forEach((button) => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const optionIndex = button.dataset.optionIndex;
            const value = button.dataset.value;

            const buttons = this.quickViewContent.querySelectorAll(
              `.variant-button[data-option-index="${optionIndex}"]`
            );
            buttons.forEach((btn) => btn.classList.remove('selected'));
            button.classList.add('selected');

            this.updateSelectedVariant(variants);
          });
        });

        this.updateSelectedVariant(variants);
      }

      updateSelectedVariant(variants) {
        const selectedOptions = Array.from(
          this.quickViewContent.querySelectorAll('.variant-button.selected'),
          (button) => button.dataset.value
        );
      
        const matchingVariant = variants.find((variant) =>
          variant.options.every((option, index) => option === selectedOptions[index])
        );
      
        const addToCartButton = this.quickViewContent.querySelector('.add-to-cart');
        const priceContainer = this.quickViewContent.querySelector('.product-price');
        const mainImage = this.quickViewContent.querySelector('.main-image');
      
        if (matchingVariant) {
          this.selectedVariantId = matchingVariant.id;
      
          priceContainer.innerHTML = matchingVariant.compare_at_price > matchingVariant.price
            ? `<span class="compare-price">${this.formatMoney(matchingVariant.compare_at_price)}</span>
               <span class="sale-price">${this.formatMoney(matchingVariant.price)}</span>`
            : `<span>${this.formatMoney(matchingVariant.price)}</span>`;
      
          if (matchingVariant.featured_image) {
            mainImage.src = matchingVariant.featured_image.src;
          }
      
          addToCartButton.disabled = !matchingVariant.available;
          addToCartButton.textContent = matchingVariant.available
            ? translations.addToCart
            : translations.unavailable;
        } else {
          this.selectedVariantId = null;
      
          priceContainer.innerHTML = `<span>${translations.chooseOptions}</span>`;
          addToCartButton.disabled = true;
          addToCartButton.textContent = translations.chooseOptions;
        }
      }
                 

      initializeAddToCart(product) {
        const addToCartButton = this.quickViewContent.querySelector('.add-to-cart');
        if (addToCartButton) {
          addToCartButton.addEventListener('click', () => {
            const quantityInput = this.quickViewContent.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value, 10);
            const variantId = this.selectedVariantId || product.variants[0]?.id;

            if (variantId && quantity > 0) {
              this.addToCart(variantId, quantity);
            } else {
              alert('Invalid Selection');
            }
          });
        }
      }

      async addToCart(variantId, quantity) {
        try {
          const addResponse = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: variantId, quantity }),
          });

          if (!addResponse.ok) throw new Error('Failed to add product to cart.');

          const addedProduct = await addResponse.json();
          const sectionsResponse = await fetch(
            `${routes.cart_url}?sections=cart-notification-product,cart-notification-button,cart-icon-bubble,cart-drawer`
          );
          const sectionsData = await sectionsResponse.json();

          const cartNotification = document.querySelector('cart-notification');
          if (cartNotification && typeof cartNotification.renderContents === 'function') {
            cartNotification.renderContents({
              key: addedProduct.key,
              sections: sectionsData,
            });
          }

          // Update cart-drawer if available
          const cartDrawer = document.querySelector('cart-drawer');
          if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
            try {
              cartDrawer.renderContents({
                id: addedProduct.id,
                sections: sectionsData,
              });
      
              // Handle empty cart state
              const isEmpty = !sectionsData['cart-drawer'] || sectionsData['cart-drawer'].includes('is-empty');
              cartDrawer.classList.toggle('is-empty', isEmpty);
      
              // Open the cart drawer
              if (typeof cartDrawer.open === 'function') {
                cartDrawer.open();
              }
            } catch (error) {
              console.warn('Failed to update cart drawer:', error);
            }
          }

          this.quickViewModal.classList.add('hidden');
        } catch (error) {
          console.error('Error adding product to cart:', error);
          alert(translations.addToCartError);
        }
      }

      formatMoney(cents) {
        const activeCurrency = Shopify.currency?.active || '$';
        const afterSymbolCurrencies = [
          'RON', 'SEK', 'CZK', 'HUF', 'PLN', 
          'NOK', 'DKK', 'ISK', 'BGN', 'HRK', 
          'TRY', 'ZAR'
        ];
      
        const amount = (cents / 100).toFixed(2);
        const isAfter = afterSymbolCurrencies.includes(activeCurrency);
      
        return isAfter ? `${amount} ${activeCurrency}` : `${activeCurrency} ${amount}`;
      }      
      
    }
  );
}

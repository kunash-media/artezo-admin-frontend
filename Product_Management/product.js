// =============================================
// Product Management - Admin Panel
// FIXED: view in overlay (read-only), full population, progress bar, main image column
// =============================================

const BASE_URL = 'http://localhost:8085';
let currentProductId = null;
let products = [];
let categories = new Set();
let isReadOnlyMode = false;

// Toast
function showToast(message, type = 'success') {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: type === 'error' ? "#dc2626" : type === 'warning' ? "#d97706" : "#957A54",
        stopOnFocus: true
    }).showToast();
}

// Safe clear
function safeClear(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
}

// Reset form
function resetForm() {
    currentProductId = null;
    isReadOnlyMode = false;

    document.getElementById('form-title').textContent = 'Add New Product';
    document.getElementById('btn-submit-product').textContent = 'Save Product';
    document.getElementById('btn-submit-product').disabled = false;
    document.getElementById('btn-submit-product').style.display = 'inline-flex';

    document.getElementById('product-form').reset();
    safeClear('variants-container');
    safeClear('hero-banners-container');
    safeClear('installation-steps-container');
    ['main-image-preview', 'mockup-preview', 'product-video-preview'].forEach(safeClear);

    variantCounter = 0;
    bannerCounter = 0;
    stepCounter = 0;

    //custom fields patch
    customFieldCounter = 0;
    safeClear('custom-fields-container');
    document.getElementById('custom-fields-section').classList.add('hidden');


    document.getElementById('variants-section').classList.add('hidden');
    document.getElementById('has-variants').checked = false;

    // Remove read-only
    document.querySelectorAll('#product-form input, #product-form textarea, #product-form select').forEach(el => {
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
    });
    document.querySelectorAll('#product-form button:not(#btn-close-form):not(#btn-cancel-form)').forEach(btn => {
        btn.style.display = 'inline-flex';
    });
}

// Open form (create / edit / view)
async function openForm(mode = 'create', product = null, readOnly = false) {
    resetForm();
    isReadOnlyMode = readOnly;

    const titleEl = document.getElementById('form-title');
    const submitBtn = document.getElementById('btn-submit-product');

    if (readOnly) {
        titleEl.textContent = 'View Product';
        submitBtn.style.display = 'none';
        document.querySelectorAll('#product-form button:not(#btn-close-form):not(#btn-cancel-form)').forEach(btn => {
            btn.style.display = 'none';
        });
        document.querySelectorAll('#product-form input, #product-form textarea, #product-form select').forEach(el => {
            el.setAttribute('readonly', 'readonly');
            if (el.type !== 'checkbox') el.disabled = true;
        });
    } else {
        titleEl.textContent = mode === 'edit' ? 'Edit Product' : 'Add New Product';
        submitBtn.textContent = mode === 'edit' ? 'Update Product' : 'Save Product';
    }

    if (!readOnly) {
        document.getElementById('add-variant-btn')?.addEventListener('click', addVariant);
        document.getElementById('add-hero-banner-btn')?.addEventListener('click', addHeroBanner);
        document.getElementById('add-step-btn')?.addEventListener('click', addInstallationStep);
    }

    if (product) {
        currentProductId = product.productPrimeId;

        // Basic fields
        document.getElementById('product-name').value = product.productName || '';
        document.getElementById('brand-name').value = product.brandName || '';
        document.getElementById('product-category').value = product.productCategory || '';
        document.getElementById('product-subcategory').value = product.productSubCategory || '';
        document.getElementById('selected-color').value = product.selectedColor || '';
        document.getElementById('current-sku').value = product.currentSku || '';
        document.getElementById('current-selling-price').value = product.currentSellingPrice || '';
        document.getElementById('current-mrp-price').value = product.currentMrpPrice || '';
        document.getElementById('current-stock').value = product.currentStock || 0;
        document.getElementById('category-path').value = (product.categoryPath || []).join(', ');

        document.getElementById('has-variants').checked = !!product.hasVariants;
        document.getElementById('is-exchange').checked = product.isExchange ?? true;
        document.getElementById('return-available').checked = product.returnAvailable ?? true;
        document.getElementById('is-customizable').checked = !!product.isCustomizable;
        document.getElementById('trending-category').checked = !!product.underTrendCategory;

        document.getElementById('description').value = (product.description || []).join('\n');

        if (product.hasVariants) {
            document.getElementById('variants-section').classList.remove('hidden');
        }

        try {
            const res = await fetch(`${BASE_URL}/api/products/admin/get-by-productPrimeId/${product.productPrimeId}`);
            if (!res.ok) throw new Error(await res.text());
            const full = await res.json();

            document.getElementById('about-item').value = (full.aboutItem || []).join('\n');
            document.getElementById('specifications').value = Object.entries(full.specifications || {})
                .map(([k, v]) => `${k}: ${v}`).join('\n');
            document.getElementById('faq').value = Object.entries(full.faq || {})
                .map(([k, v]) => `${k}: ${v}`).join('\n');

            const info = full.additionalInfo || {};
            document.getElementById('seller-name').value = info.sellerName || '';
            document.getElementById('seller-address').value = info.sellerAddress || '';
            document.getElementById('manufacturer-details').value = info.manufacturerDetails || '';
            document.getElementById('package-details').value = info.packageDetails || '';
            document.getElementById('country').value = info.country || 'india';

            document.getElementById('global-tags').value = (full.globalTags || []).join(', ');
            document.getElementById('addon-keys').value = (full.addonKeys || []).join(', ');
            document.getElementById('youtube-url').value = full.youtubeUrl || '';

            // PATCH: Populate custom fields on edit/view
            if (full.customFields) {
                let fields = full.customFields;
                // Handle if stored as JSON string in DB
                if (typeof fields === 'string') {
                    try { fields = JSON.parse(fields); } catch { fields = []; }
                }
                if (Array.isArray(fields) && fields.length > 0) {
                    document.getElementById('is-customizable').checked = true;
                    document.getElementById('custom-fields-section').classList.remove('hidden');
                    fields.forEach(f => {
                        addCustomField();
                        const blocks = document.querySelectorAll('.custom-field-block');
                        const last = blocks[blocks.length - 1];

                        last.querySelector('.cf-fieldname').value = f.fieldName || '';
                        const typeEl = last.querySelector('.cf-fieldtype');
                        typeEl.value = f.fieldInputType || 'text';
                        last.querySelector('.cf-note').value = f.note || '';

                        // PATCH: restore dropdown options if type is dropdown
                        if (f.fieldInputType === 'dropdown') {
                            last.querySelector('.cf-dropdown-options').classList.remove('hidden');
                            const opts = Array.isArray(f.dropdownOptions) ? f.dropdownOptions : [];
                            opts.forEach(opt => last._addDropdownOption && last._addDropdownOption(opt));
                        }
                    });
                }
            }
            // END PATCH populate

            // Previews
            if (full.mainImage) {
                document.getElementById('main-image-preview').innerHTML = `<img src="${BASE_URL}${full.mainImage}" class="max-h-20 rounded">`;
            }
            if (full.mockupImages?.length) {
                const cont = document.getElementById('mockup-preview');
                full.mockupImages.forEach(url => {
                    cont.innerHTML += `<img src="${BASE_URL}${url}" class="max-h-20 rounded ml-2">`;
                });
            }
            if (full.productVideoUrl) {
                document.getElementById('product-video-preview').innerHTML = 'Video available';
            }

            // Variants
            if (full.availableVariants?.length) {
                full.availableVariants.forEach(v => {
                    addVariant();
                    const blocks = document.querySelectorAll('.variant-block');
                    const last = blocks[blocks.length - 1];


                    last.querySelector('.variant-title').value = v.titleName || '';
                    last.querySelector('.variant-color').value = v.color || '';
                    last.querySelector('.variant-sku').value = v.sku || '';
                    last.querySelector('.variant-price').value = v.price || '';
                    last.querySelector('.variant-mrp').value = v.mrp || '';
                    last.querySelector('.variant-stock').value = v.stock || '';
                    last.querySelector('.variant-mfgdate').value = v.mfgDate || '';
                    last.querySelector('.variant-expdate').value = v.expDate || '';
                    last.querySelector('.variant-size').value = v.size || '';
                    if (v.mainImage) {
                        last.querySelector('.variant-preview').innerHTML = `<img src="${BASE_URL}${v.mainImage}" class="max-h-20 rounded">`;
                    }
                    if (v.mockupImages?.length) {
                        const mcont = last.querySelector('.variant-mockup-preview');
                        v.mockupImages.forEach(url => {
                            mcont.innerHTML += `<img src="${url}" class="max-h-20 rounded ml-2">`;
                        });
                    }
                });
            }

            // Hero Banners
           // Hero Banners — fix bannerId
if (full.heroBanners?.length) {
    full.heroBanners.forEach(b => {
        addHeroBanner();
        const blocks = document.querySelectorAll('.hero-banner-block');
        const last = blocks[blocks.length - 1];

        // ✅ Fix: use b.bannerId not s.step
        last.dataset.bannerId = b.bannerId;

        last.querySelector('.banner-description').value = b.imgDescription || '';
        if (b.bannerImg) {
            last.querySelector('.banner-preview').innerHTML = `<img src="${BASE_URL}${b.bannerImg}" class="max-h-20 rounded">`;
        }
    });
}

// Installation Steps — fix stepNum
if (full.installationSteps?.length) {
    full.installationSteps.forEach(s => {
        addInstallationStep();
        const blocks = document.querySelectorAll('.step-block');
        const last = blocks[blocks.length - 1];

        // ✅ Already correct: s.step
        last.dataset.step = s.step;

        last.querySelector('.step-title').value = s.title || '';
        last.querySelector('.step-shortdesc').value = s.shortDescription || '';
        last.querySelector('.step-shortnote').value = s.shortNote || '';
        if (s.stepImage) {
            last.querySelector('.step-image-preview').innerHTML = `<img src="${BASE_URL}${s.stepImage}" class="max-h-20 rounded">`;
        }
        if (s.videoUrl) {
            last.querySelector('.step-video-preview').innerHTML = `<video src="${BASE_URL}${s.videoUrl}" class="max-h-20 rounded">`;
        }
    });
}

        } catch (err) {
            showToast('Could not load full product details', 'error');
            console.error(err);
        }
    }

    document.getElementById('product-form-overlay').style.display = 'flex';
}

// Close form
function closeForm() {
    document.getElementById('product-form-overlay').style.display = 'none';
    document.getElementById('upload-progress-container').style.display = 'none';
    resetForm();
}

// Counters
let variantCounter = 0;
let bannerCounter = 0;
let stepCounter = 0;

// Templates (unchanged from your original)
const variantTemplate = `
<div class="variant-block p-4 border border border-[#D89F34] rounded-lg space-y-4">
    <div class="flex justify-between items-center">
        <h4 class="font-medium text-gray-900">Variant <span class="variant-index"></span></h4>
        <button type="button" class="remove-variant text-red-500 hover:text-red-700 text-sm">Remove</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input type="text" class="variant-title px-3 py-2 border border-gray-400 rounded-lg" placeholder="Title Name (glossy)">
        <input type="text" class="variant-color px-3 py-2 border border-gray-400 rounded-lg" placeholder="Color (Golden)">
        <input type="text" class="variant-sku px-3 py-2 border border-gray-400 rounded-lg" placeholder="SKU">
        <input type="number" step="0.01" class="variant-price px-3 py-2 border border-gray-400 rounded-lg" placeholder="Price">
        <input type="number" step="0.01" class="variant-mrp px-3 py-2 border border-gray-400 rounded-lg" placeholder="MRP">
        <input type="number" min="0" class="variant-stock px-3 py-2 border border-gray-300 rounded-lg" placeholder="Stock">
        <input type="date" class="variant-mfgdate px-3 py-2 border border-gray-400 rounded-lg">
        <input type="date" class="variant-expdate px-3 py-2 border border-gray-400 rounded-lg" placeholder="Exp Date (optional)">
        <input type="text" class="variant-size px-3 py-2 border border-gray-400 rounded-lg" placeholder="Size">
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Variant Main Image</label>
            <input type="file" accept="image/*" class="variant-main-image w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#957A54]/10 file:text-[#957A54]">
            <div class="variant-preview mt-2"></div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Variant Mockup Images (multiple)</label>
            <input type="file" accept="image/*" multiple class="variant-mockup-images w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#957A54]/10 file:text-[#957A54]">
            <div class="variant-mockup-preview mt-2 grid grid-cols-3 gap-2"></div>
        </div>
    </div>
</div>`;

const heroBannerTemplate = `
<div class="hero-banner-block p-4 border border border-[#D89F34] rounded-lg space-y-3">
    <div class="flex justify-between items-center">
        <h4 class="font-medium text-gray-900">Banner <span class="banner-index"></span></h4>
        <button type="button" class="remove-banner text-red-500 hover:text-red-700 text-sm">Remove</button>
    </div>
    <textarea class="banner-description w-full px-3 py-2 border border-gray-400 rounded-lg" rows="2" placeholder="e.g. Golden premium finish close-up"
            focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54]"></textarea>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Banner Image</label>
        <input type="file" accept="image/*" class="banner-image w-full px-3 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#957A54]/10 file:text-[#957A54]
           focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] ">
        <div class="banner-preview mt-2"></div>
    </div>
</div>`;

const installationStepTemplate = `
<div class="step-block p-4 border border border-[#D89F34] rounded-lg space-y-3">
    <div class="flex justify-between items-center">
        <h4 class="font-medium text-gray-900">Step <span class="step-index"></span></h4>
        <button type="button" class="remove-step text-red-500 hover:text-red-700 text-sm">Remove</button>
    </div>
    <input type="text" class="step-title w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Title"
       focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] ">
    <textarea class="step-shortdesc w-full px-3 py-2 border border-gray-400 rounded-lg" rows="2" placeholder="Short description"
       focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] "></textarea>
    <input type="text" class="step-shortnote w-full px-3 py-2 border border-gray-400 rounded-lg" placeholder="Short note"
        focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] ">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Step Image</label>
            <input type="file" accept="image/*" class="step-image w-full px-3 py-2 border border-gray-400 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#957A54]/10 file:text-[#957A54]
               focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] ">
            <div class="step-image-preview mt-2"></div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Step Video (optional)</label>
            <input type="file" accept="video/*" class="step-video w-full px-3 py-2 border border-gray-400 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#957A54]/10 file:text-[#957A54]
                focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] ">
            <div class="step-video-preview mt-2 text-sm text-gray-500"></div>
        </div>
    </div>
</div>`;

// PATCH: Custom field template
const customFieldTemplate = `
<div class="custom-field-block p-4 border border border-[#D89F34] rounded-lg space-y-3 bg-gray-50">
    <div class="flex justify-between items-center">
        <h4 class="font-medium text-gray-900 text-sm">Field <span class="field-index"></span></h4>
        <button type="button" class="remove-custom-field text-red-500 hover:text-red-700 text-sm">Remove</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Field Name <span class="text-red-400">*</span></label>
            <input type="text" class="cf-fieldname w-full px-3 py-2 border border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54]" placeholder="e.g. Size, Color, upload Imgae">
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Input Type</label>
            <select class="cf-fieldtype w-full px-3 py-2 border border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54] bg-white">
                <option value="text">✏️  Text</option>
                <option value="number">🔢  Number</option>
                <option value="checkbox">☑️  Checkbox</option>
                <option value="radio">🔘  Yes / No (Radio)</option>
                <option value="image">🖼️  Image Upload</option>
                <option value="dropdown">📋  Dropdown</option>
            </select>
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <input type="text" class="cf-note w-full px-3 py-2 border border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54]" placeholder="e.g. in cm">
        </div>
        <div class="cf-dropdown-options hidden space-y-2 pt-1">
            <label class="block text-xs font-medium text-gray-600 mb-1">Dropdown Options</label>
            <div class="cf-options-list space-y-2"></div>
            <button type="button" class="cf-add-option mt-1 px-3 py-1.5 text-xs border border-[#D89F34] bg-[#957A54]/10 text-[#957A54] rounded-lg hover:bg-[#957A54]/20">+ Add Option</button>
        </div>
    </div>`;
// END PATCH template

// Add functions
function addVariant() {
    variantCounter++;
    const container = document.getElementById('variants-container');
    const temp = document.createElement('div');
    temp.innerHTML = variantTemplate;
    const block = temp.firstElementChild;
    block.querySelector('.variant-index').textContent = variantCounter;
    container.appendChild(block);
    block.querySelector('.remove-variant').addEventListener('click', () => block.remove());
}


function addHeroBanner() {
    bannerCounter++;
    const container = document.getElementById('hero-banners-container');
    const temp = document.createElement('div');
    temp.innerHTML = heroBannerTemplate;
    const block = temp.firstElementChild;
    block.querySelector('.banner-index').textContent = bannerCounter;
    block.dataset.bannerId = bannerCounter; // ✅ ADD THIS
    container.appendChild(block);
    block.querySelector('.remove-banner').addEventListener('click', () => block.remove());
}

function addInstallationStep() {
    stepCounter++;
    const container = document.getElementById('installation-steps-container');
    const temp = document.createElement('div');
    temp.innerHTML = installationStepTemplate;
    const block = temp.firstElementChild;
    block.querySelector('.step-index').textContent = stepCounter;
    block.dataset.step = stepCounter; // ✅ ADD THIS
    container.appendChild(block);
    block.querySelector('.remove-step').addEventListener('click', () => block.remove());
}


// PATCH: Custom fields counter and add function
let customFieldCounter = 0;

function addCustomField() {
    customFieldCounter++;
    const container = document.getElementById('custom-fields-container');
    const temp = document.createElement('div');
    temp.innerHTML = customFieldTemplate;
    const block = temp.firstElementChild;
    block.querySelector('.field-index').textContent = customFieldCounter;
    container.appendChild(block);
   block.querySelector('.remove-custom-field').addEventListener('click', () => {
        block.remove();
        document.querySelectorAll('.custom-field-block .field-index').forEach((el, i) => {
            el.textContent = i + 1;
        });
    });

    // PATCH: show/hide dropdown options panel based on selected type
    const typeSelect = block.querySelector('.cf-fieldtype');
    const optionsPanel = block.querySelector('.cf-dropdown-options');
    const optionsList = block.querySelector('.cf-options-list');
    const addOptionBtn = block.querySelector('.cf-add-option');

    function addDropdownOption(value = '') {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        row.innerHTML = `
            <input type="text" class="cf-option-value flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D89F34]/30 focus:border-[#957A54]" placeholder="e.g. Small">
            <button type="button" class="cf-remove-option text-red-400 hover:text-red-600 text-xs px-2 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">✕</button>`;
        row.querySelector('.cf-remove-option').addEventListener('click', () => row.remove());
        if (value) row.querySelector('.cf-option-value').value = value;
        optionsList.appendChild(row);
    }

    typeSelect.addEventListener('change', () => {
        const isDropdown = typeSelect.value === 'dropdown';
        optionsPanel.classList.toggle('hidden', !isDropdown);
        if (isDropdown && optionsList.children.length === 0) {
            addDropdownOption();
            addDropdownOption();
        }
    });

    addOptionBtn.addEventListener('click', () => addDropdownOption());

    // expose helper on block for populate use
    block._addDropdownOption = addDropdownOption;
}
// END PATCH addCustomField

// Variants toggle
document.getElementById('has-variants').addEventListener('change', e => {
    document.getElementById('variants-section').classList.toggle('hidden', !e.target.checked);
    if (e.target.checked && variantCounter === 0) addVariant();
});

// PATCH: Toggle custom fields section when isCustomizable is checked
document.getElementById('is-customizable').addEventListener('change', e => {
    document.getElementById('custom-fields-section').classList.toggle('hidden', !e.target.checked);
    if (e.target.checked && customFieldCounter === 0) addCustomField();
});

document.getElementById('add-custom-field-btn').addEventListener('click', addCustomField);
// END PATCH toggle

// File preview
document.addEventListener('change', e => {
    if (e.target.type !== 'file') return;
    const files = e.target.files;
    if (!files.length) return;
    const preview = e.target.closest('div').querySelector('[class*="preview"]') || e.target.parentElement.querySelector('[class*="preview"]');
    if (!preview) return;

    if (e.target.multiple) {
        preview.innerHTML = '';
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'max-h-20 rounded';
                preview.appendChild(img);
            } else {
                preview.innerHTML += `<div class="text-sm">${file.name}</div>`;
            }
        });
    } else {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            preview.innerHTML = `<img src="${BASE_URL}${URL.createObjectURL(file)}" class="max-h-20 rounded">`;
        } else if (file.type.startsWith('video/')) {
            preview.textContent = file.name;
        }
    }
});

// Load products
// Pagination state
let currentPage = 0;
const PAGE_SIZE = 10;

async function loadProducts(page = 0) {

     if (typeof page !== 'number') page = 0;

    try {   
        renderTable(null, 'loading');
        const res = await fetch(`${BASE_URL}/api/products/get-all-active-products?page=${page}&size=${PAGE_SIZE}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        products = data.content || [];
        currentPage = data.page.number;

        renderTable(products);
        renderPagination(data.page);
        updateStats();
        populateCategories();
    } catch (err) {
        showToast('Error loading products', 'error');
        renderTable([], 'error');
        renderPagination(null);
    }
}

function renderPagination(pageInfo) {
    // Create pagination container if it doesn't exist
    let paginationEl = document.getElementById('pagination-container');
    if (!paginationEl) {
        paginationEl = document.createElement('div');
        paginationEl.id = 'pagination-container';
        // Insert after your table's parent — adjust selector to match your layout
        const tableWrapper = document.getElementById('product-table-body').closest('table').parentElement;
        tableWrapper.insertAdjacentElement('afterend', paginationEl);
    }

    if (!pageInfo || pageInfo.totalElements === 0) {
        paginationEl.innerHTML = '';
        return;
    }

    const { number: current, totalPages, totalElements, size } = pageInfo;
    const from = current * size + 1;
    const to = Math.min((current + 1) * size, totalElements);

    // Build page number buttons (show max 5 around current)
    const delta = 2;
    const pages = [];
    for (let i = Math.max(0, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
        pages.push(i);
    }

    const pageButtons = pages.map(i => `
        <button
            onclick="loadProducts(${i})"
            style="
                min-width: 34px; height: 34px;
                padding: 0 10px;
                border-radius: 6px;
                border: 1px solid ${i === current ? '#D89F34' : '#e5e7eb'};
                background: ${i === current ? '#D89F34' : '#fff'};
                color: ${i === current ? '#fff' : '#374151'};
                font-size: 13px;
                font-weight: ${i === current ? '600' : '400'};
                cursor: ${i === current ? 'default' : 'pointer'};
                transition: all 0.15s ease;
            "
            ${i === current ? 'disabled' : ''}
            onmouseover="if(${i !== current}) { this.style.background='#f5f3ff'; this.style.borderColor='#6366f1'; this.style.color='#6366f1'; }"
            onmouseout="if(${i !== current}) { this.style.background='#fff'; this.style.borderColor='#e5e7eb'; this.style.color='#374151'; }"
        >${i + 1}</button>
    `).join('');

    const btnBase = `
        min-width: 34px; height: 34px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: #fff;
        color: #374151;
        font-size: 13px;
        cursor: pointer;
        display: inline-flex; align-items: center; gap: 4px;
        transition: all 0.15s ease;
    `;

    paginationEl.innerHTML = `
        <style>
            #pagination-container button:disabled {
                opacity: 0.4;
                cursor: not-allowed !important;
            }
        </style>
        <div style="
            display: flex;
            align-items: center;
            justify-content: between;
            flex-wrap: wrap;
            gap: 8px;
            padding: 14px 4px;
            border-top: 1px solid #f3f4f6;
            margin-top: 4px;
        ">
            <!-- Left: count info -->
            <span style="font-size: 13px; color: #9ca3af; flex: 1; min-width: 140px;">
                Showing <strong style="color: #374151;">${from}–${to}</strong> of <strong style="color: #374151;">${totalElements}</strong> products
            </span>

            <!-- Right: controls -->
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">

                <!-- Prev -->
                <button
                    onclick="loadProducts(${current - 1})"
                    ${current === 0 ? 'disabled' : ''}
                    style="${btnBase}"
                    onmouseover="if(!this.disabled){ this.style.background='#f5f3ff'; this.style.borderColor='#6366f1'; this.style.color='#6366f1'; }"
                    onmouseout="this.style.background='#fff'; this.style.borderColor='#e5e7eb'; this.style.color='#374151';"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 10.5L5 7l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Prev
                </button>

                <!-- Page numbers -->
                ${pages[0] > 0 ? `
                    <button onclick="loadProducts(0)" style="${btnBase}" onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background='#fff'">1</button>
                    ${pages[0] > 1 ? `<span style="color:#d1d5db; font-size:13px;">…</span>` : ''}
                ` : ''}

                ${pageButtons}

                ${pages[pages.length - 1] < totalPages - 1 ? `
                    ${pages[pages.length - 1] < totalPages - 2 ? `<span style="color:#d1d5db; font-size:13px;">…</span>` : ''}
                    <button onclick="loadProducts(${totalPages - 1})" style="${btnBase}" onmouseover="this.style.background='#f5f3ff'" onmouseout="this.style.background='#fff'">${totalPages}</button>
                ` : ''}

                <!-- Next -->
                <button
                    onclick="loadProducts(${current + 1})"
                    ${current >= totalPages - 1 ? 'disabled' : ''}
                    style="${btnBase}"
                    onmouseover="if(!this.disabled){ this.style.background='#f5f3ff'; this.style.borderColor='#6366f1'; this.style.color='#6366f1'; }"
                    onmouseout="this.style.background='#fff'; this.style.borderColor='#e5e7eb'; this.style.color='#374151';"
                >
                    Next
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 3.5L9 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </div>
        </div>`;
}

function renderTable(data, state = 'empty') {
    const tbody = document.getElementById('product-table-body');
    tbody.innerHTML = '';

    if (!data || data.length === 0 || state === 'loading') {
        const COLSPAN = 10;

        if (state === 'loading') {
            tbody.innerHTML = `
                <tr><td colspan="${COLSPAN}" style="padding:0;">
                    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;gap:16px;font-family:inherit;">
                        <svg viewBox="0 0 48 48" width="48" height="48" style="animation:spin 0.9s linear infinite;display:block;" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" stroke-width="4"/>
                            <circle cx="24" cy="24" r="20" fill="none" stroke="#D89F34" stroke-width="4" stroke-linecap="round" stroke-dasharray="30 96"/>
                        </svg>
                        <div style="text-align:center;">
                            <p style="margin:0;font-size:15px;font-weight:600;color:#374151;">Loading products…</p>
                            <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Hang tight, fetching your inventory.</p>
                        </div>
                    </div>
                    <style>@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }</style>
                </td></tr>`;
            return;
        }

        const isError = state === 'error';
        const icon = isError
            ? `<svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="28" fill="#fef2f2" stroke="#fca5a5" stroke-width="2"/><path d="M36 22v16" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/><circle cx="36" cy="46" r="2" fill="#ef4444"/></svg>`
            : `<svg width="72" height="72" viewBox="0 0 72 72" fill="none"><rect x="8" y="26" width="56" height="38" rx="4" fill="#f3f4f6" stroke="#d1d5db" stroke-width="2"/><path d="M8 34h56" stroke="#d1d5db" stroke-width="2"/><path d="M27 26V18a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" stroke="#d1d5db" stroke-width="2"/><rect x="29" y="40" width="14" height="9" rx="2" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1.5"/><line x1="33" y1="44.5" x2="39" y2="44.5" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/><circle cx="52" cy="53" r="10" fill="#fff" stroke="#e5e7eb" stroke-width="2"/><circle cx="51" cy="52" r="4" stroke="#9ca3af" stroke-width="1.8"/><line x1="54.5" y1="55.5" x2="59" y2="60" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/></svg>`;

        tbody.innerHTML = `
            <tr><td colspan="${COLSPAN}" style="padding:0;">
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;gap:14px;font-family:inherit;">
                    ${icon}
                    <div style="text-align:center;">
                        <p style="margin:0;font-size:15px;font-weight:600;color:#374151;">${isError ? 'Failed to load products' : 'No products found'}</p>
                        <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;max-width:300px;line-height:1.6;">${isError ? 'Something went wrong. Please refresh and try again.' : 'No products to display. Try adjusting your filters or add a new product.'}</p>
                    </div>
                </div>
            </td></tr>`;
        return;
    }

    data.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = p.currentStock === 0 ? 'bg-red-100 border-1-4 border-red-600' : p.currentStock <= 10 ? 'bg-yellow-50 border-l-4 border-yellow-400' : '';

        const mainImg = p.mainImage
            ? `<img src="${BASE_URL}${p.mainImage}" class="h-18 w-18 object-cover rounded" alt="main image">`
            : '<span class="text-gray-400 italic">No image</span>';

        let variantStockHtml = '<span class="text-gray-400 italic text-xs">No variants</span>';
        if (p.availableVariants && p.availableVariants.length > 0) {
            variantStockHtml = p.availableVariants.map(v => {
                const isLow = v.stock <= 10 && v.stock > 0;
                const isOut = v.stock === 0;
                const badgeColor = isOut ? 'bg-red-100 text-red-700 border-red-300' : isLow ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-green-100 text-green-700 border-green-300';
                const label = v.titleName || v.color || v.sku;
                return `<div class="flex items-center justify-between gap-2 px-2 py-1 rounded border text-xs border border-[#D89F34] rounded-md bg-gray-100">
                    <span class="font-medium truncate max-w-[80px]" title="${v.color || ''} - ${v.sku}">${label}</span>
                    <span class="font-bold whitespace-nowrap"> : ${v.stock}</span>
                </div>`;
            }).join('');
        }

        tr.innerHTML = `
            <td class="px-4 py-3" style="min-width:70px;">${mainImg}</td>
            <td class="px-4 py-3" style="min-width:200px;">
                <div style="font-size:13.5px;font-weight:500;color:#1a1a14;line-height:1.4;">${p.productName || '—'}</div>
            </td>
            <td class="px-4 py-3" style="white-space:nowrap;">
                <span style="font-family:monospace;font-size:12px;">${p.currentSku || '—'}</span>
            </td>
            <td class="px-4 py-3" style="text-align:center;white-space:nowrap;">
                <span class="inline-flex items-center px-2 py-1 rounded border text-xs font-bold ${p.currentStock === 0 ? 'bg-red-100 text-red-700 border-red-300' : p.currentStock <= 10 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-green-100 text-green-700 border-green-300'}">
                    ${p.currentStock || 0}
                </span>
            </td>
            <td class="px-4 py-3" style="min-width:180px;">
                <div class="flex  flex-wrap gap-1">${variantStockHtml}</div>
            </td>
            <td class="px-4 py-3" style="white-space:nowrap;">${p.productCategory || 'Main Category'}</td>
            <td class="px-4 py-3" style="white-space:nowrap;">${p.productSubCategory || 'Sub Category'}</td>
            <td class="px-4 py-3" style="white-space:nowrap;text-align:right;">₹${(p.currentSellingPrice || 0).toFixed(2)}</td>
            <td class="px-4 py-3" style="white-space:nowrap;text-align:right;">₹${(p.currentMrpPrice || 0).toFixed(2)}</td>
            <td class="px-4 py-3" style="white-space:nowrap;text-align:center;">
                <div style="display:flex;gap:10px;justify-content:center;align-items:center;">
                    <button onclick="viewProduct(${p.productPrimeId})" class="text-[#D89F33] hover:text-[#133F53]"><i class="fas fa-eye"></i></button>
                    <button onclick="editProduct(${p.productPrimeId})" class="text-green-600 hover:text-green-800"><i class="fas fa-edit"></i></button>
                    <button onclick="confirmDelete(${p.productPrimeId})" class="text-red-600 hover:text-red-800"><i class="fas fa-trash"></i></button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

function updateStats() {
    const total = products.length;
    const low = products.filter(p => p.currentStock > 0 && p.currentStock <= 10).length;
    const out = products.filter(p => p.currentStock === 0).length;
    document.getElementById('total-products').textContent = total;
    document.getElementById('low-stock-count').textContent = low;
    document.getElementById('out-of-stock-count').textContent = out;
}

function populateCategories() {
    const select = document.getElementById('category-filter');
    categories.clear();
    products.forEach(p => { if (p.productCategory) categories.add(p.productCategory); });
    select.innerHTML = '<option value="">All Categories</option>';
    [...categories].sort().forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

// Filters
function applyFilters() {
    let filtered = [...products];
    const search = document.getElementById('search-input').value.toLowerCase().trim();
    const cat = document.getElementById('category-filter').value;
    const stock = document.getElementById('stock-filter').value;

    if (search.length >= 3) {
        filtered = filtered.filter(p =>
            (p.productName||'').toLowerCase().includes(search) ||
            (p.currentSku||'').toLowerCase().includes(search) ||
            (p.brandName||'').toLowerCase().includes(search)
        );
    }
    if (cat) filtered = filtered.filter(p => p.productCategory === cat);
    if (stock) {
        if (stock === 'low-stock') filtered = filtered.filter(p => 0 < p.currentStock && p.currentStock <= 10);
        else if (stock === 'out-of-stock') filtered = filtered.filter(p => p.currentStock === 0);
        else if (stock === 'in-stock') filtered = filtered.filter(p => p.currentStock > 10);
    }
    renderTable(filtered);
}

let debounceTimer;
document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 400);
});
['category-filter','stock-filter'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
document.getElementById('reset-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('stock-filter').value = '';
    applyFilters();
});

// Key:value parser
function parseKeyValue(text) {
    const obj = {};
    text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const colon = trimmed.indexOf(':');
        if (colon === -1) return;
        const key = trimmed.substring(0, colon).trim();
        const val = trimmed.substring(colon + 1).trim();
        if (key) obj[key] = val;
    });
    return obj;
}

// Submit with progress bar
document.getElementById('product-form').addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
        productName: document.getElementById('product-name').value.trim(),
        brandName: document.getElementById('brand-name').value.trim(),
        productCategory: document.getElementById('product-category').value.trim(),
        productSubCategory: document.getElementById('product-subcategory').value.trim(),
        categoryPath: document.getElementById('category-path').value.trim().split(',').map(s=>s.trim()).filter(Boolean),
        hasVariants: document.getElementById('has-variants').checked,
        isCustomizable: document.getElementById('is-customizable').checked,
        isExchange: document.getElementById('is-exchange').checked,
        returnAvailable: document.getElementById('return-available').checked,
        underTrendCategory: document.getElementById('trending-category').checked,
        currentSku: document.getElementById('current-sku').value.trim(),
        selectedColor: document.getElementById('selected-color').value.trim(),
        currentSellingPrice: parseFloat(document.getElementById('current-selling-price').value) || null,
        currentMrpPrice: parseFloat(document.getElementById('current-mrp-price').value) || null,
        currentStock: parseInt(document.getElementById('current-stock').value) || 0,
        description: document.getElementById('description').value.trim().split('\n').map(s=>s.trim()).filter(Boolean),
        aboutItem: document.getElementById('about-item').value.trim().split('\n').map(s=>s.trim()).filter(Boolean),
        specifications: parseKeyValue(document.getElementById('specifications').value),
        additionalInfo: {
            sellerName: document.getElementById('seller-name').value.trim(),
            sellerAddress: document.getElementById('seller-address').value.trim(),
            manufacturerDetails: document.getElementById('manufacturer-details').value.trim(),
            packageDetails: document.getElementById('package-details').value.trim(),
            country: document.getElementById('country').value.trim() || 'india'
        },
        faq: parseKeyValue(document.getElementById('faq').value),
        globalTags: document.getElementById('global-tags').value.trim().split(',').map(s=>s.trim()).filter(Boolean),
        addonKeys: document.getElementById('addon-keys').value.trim().split(',').map(s=>s.trim()).filter(Boolean),
        variants: [],
        heroBanners: [],
        installationSteps: [],
        youtubeUrl: document.getElementById('youtube-url').value.trim(),

        // PATCH: Collect custom fields
        customFields: (() => {
            const fields = [];
            document.querySelectorAll('.custom-field-block').forEach((b, i) => {
                const name = b.querySelector('.cf-fieldname').value.trim();
                if (!name) return; // skip empty
                const fieldType = b.querySelector('.cf-fieldtype').value;
                const entry = {
                    fieldId: i + 1,
                    fieldName: name,
                    fieldInputType: fieldType,
                    note: b.querySelector('.cf-note').value.trim()
                };

                // PATCH: collect dropdown options only when type is dropdown
                if (fieldType === 'dropdown') {
                    entry.dropdownOptions = Array.from(
                        b.querySelectorAll('.cf-option-value')
                    ).map(el => el.value.trim()).filter(Boolean);
                }

                fields.push(entry);
            });
            return fields;
        })()
        // END PATCH collect        
    };

    const formData = new FormData();

    // ── Variants ──
    document.querySelectorAll('.variant-block').forEach(b => {
        payload.variants.push({
            titleName: b.querySelector('.variant-title').value.trim(),
            color: b.querySelector('.variant-color').value.trim(),
            sku: b.querySelector('.variant-sku').value.trim(),
            price: parseFloat(b.querySelector('.variant-price').value) || null,
            mrp: parseFloat(b.querySelector('.variant-mrp').value) || null,
            stock: parseInt(b.querySelector('.variant-stock').value) || 0,
            mfgDate: b.querySelector('.variant-mfgdate').value || null,
            expDate: b.querySelector('.variant-expdate').value || null,
            size: b.querySelector('.variant-size').value.trim()
        });
    });

    // ── Variant files ──
    document.querySelectorAll('.variant-block').forEach(b => {
        const imgInput = b.querySelector('.variant-main-image');
        if (imgInput && imgInput.files[0]) formData.append('variantsMainImages', imgInput.files[0]);
    });
    document.querySelectorAll('.variant-mockup-images').forEach(input => {
        Array.from(input.files || []).forEach(f => formData.append('variantMockupImages', f));
    });

    // ── Hero banners ──
    // ── Hero banners — only send banners that have a new file OR description change ──
document.querySelectorAll('.hero-banner-block').forEach((b, i) => {
    const bannerId = parseInt(b.dataset.bannerId) || (i + 1);
    const imgInput = b.querySelector('.banner-image');
    const hasNewFile = imgInput && imgInput.files[0];

    // ✅ Always include in payload (description might have changed)
    payload.heroBanners.push({
        bannerId: bannerId,
        imgDescription: b.querySelector('.banner-description').value.trim()
    });

    // ✅ append file — position in heroBannersImages matches position in heroBanners array
    if (hasNewFile) {
        formData.append('heroBannersImages', imgInput.files[0]);
    }
});

// ── Installation steps — ONLY send steps that have a new file ──
// Steps without files are NOT included in JSON so queue index stays correct
const allStepBlocks = document.querySelectorAll('.step-block');



allStepBlocks.forEach((b, i) => {
    const stepNum = parseInt(b.dataset.step) || (i + 1);
    const imgInput = b.querySelector('.step-image');
    const vidInput = b.querySelector('.step-video');
    const hasNewImg = !!(imgInput && imgInput.files[0]);
    const hasNewVid = !!(vidInput && vidInput.files[0]);

    payload.installationSteps.push({
        step: stepNum,
        title: b.querySelector('.step-title').value.trim(),
        shortDescription: b.querySelector('.step-shortdesc').value.trim(),
        shortNote: b.querySelector('.step-shortnote').value.trim(),
        hasNewImage: hasNewImg, // ✅ ADD THIS
        hasNewVideo: hasNewVid  // ✅ ADD THIS
    });

    if (hasNewImg) formData.append('installationStepsImages', imgInput.files[0]);
    if (hasNewVid) formData.append('installationStepsVideos', vidInput.files[0]);
});
    // Basic validation
    if (!payload.productName || !payload.currentSku || payload.currentStock < 0) {
        showToast('Required: Name, SKU, Stock ≥ 0', 'error');
        return;
    }

    formData.append('productJsonData', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'productJsonData');

    // Core files
    const mainFile = document.getElementById('main-image').files[0];
    if (mainFile) formData.append('mainImage', mainFile);
    Array.from(document.getElementById('mockup-images').files || []).forEach(f => formData.append('mockupImages', f));
    const videoFile = document.getElementById('product-video').files[0];
    if (videoFile) formData.append('productVideo', videoFile);

    // ── Progress UI ──
    const progressContainer = document.getElementById('upload-progress-container');
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Preparing... 0%';

    try {
        const method = currentProductId ? 'PATCH' : 'POST';
        const url = currentProductId
            ? `${BASE_URL}/api/products/patch-product/${currentProductId}`
            : `${BASE_URL}/api/products/create-product`;

        const xhr = new XMLHttpRequest();
        xhr.open(method, url);

        xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = `Uploading... ${percent}%`;
            }
        };

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                showToast(currentProductId ? 'Product updated' : 'Product created');
                closeForm();
                loadProducts();
            } else {
                let msg = `Server error ${xhr.status}`;
                try { msg = JSON.parse(xhr.responseText).message || msg; } catch {}
                showToast('Save failed: ' + msg, 'error');
            }
        };

        xhr.onerror = function() {
            showToast('Network error during upload', 'error');
        };

        xhr.send(formData);

    } finally {
        setTimeout(() => { progressContainer.style.display = 'none'; }, 1200);
    }
});


// ── Image preview helper — call this once on page load ──
function initImagePreviews() {

    // Generic helper
    function attachPreview(inputEl, previewEl) {
        if (!inputEl || !previewEl) return;
        inputEl.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            previewEl.src = url;
            previewEl.style.display = 'block';
            previewEl.onload = () => URL.revokeObjectURL(url); // free memory
        });
    }

    // Main image
    attachPreview(
        document.getElementById('main-image'),
        document.getElementById('main-image-preview')
    );

    // Mockup images — multiple, show thumbnails in a container
    const mockupInput = document.getElementById('mockup-images');
    if (mockupInput) {
        mockupInput.addEventListener('change', function() {
            const container = document.getElementById('mockup-previews');
            if (!container) return;
            container.innerHTML = '';
            Array.from(this.files).forEach(file => {
                const img = document.createElement('img');
                img.className = 'h-16 w-16 object-cover rounded border';
                const url = URL.createObjectURL(file);
                img.src = url;
                img.onload = () => URL.revokeObjectURL(url);
                container.appendChild(img);
            });
        });
    }
}




// ── Variant block preview — call after adding a new variant block ──
function attachVariantPreview(variantBlock) {
    const input = variantBlock.querySelector('.variant-main-image');
    const preview = variantBlock.querySelector('.variant-image-preview');
    if (!input || !preview) return;
    input.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        preview.onload = () => URL.revokeObjectURL(url);
    });
}

// ── Banner block preview — call after adding a new banner block ──
function attachBannerPreview(bannerBlock) {
    const input = bannerBlock.querySelector('.banner-image');
    const preview = bannerBlock.querySelector('.banner-image-preview');
    if (!input || !preview) return;
    input.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        preview.onload = () => URL.revokeObjectURL(url);
    });
}

// ── Step block preview — call after adding a new step block ──
function attachStepPreview(stepBlock) {
    const imgInput = stepBlock.querySelector('.step-image');
    const imgPreview = stepBlock.querySelector('.step-image-preview');
    if (imgInput && imgPreview) {
        imgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            imgPreview.src = url;
            imgPreview.style.display = 'block';
            imgPreview.onload = () => URL.revokeObjectURL(url);
        });
    }

    const vidInput = stepBlock.querySelector('.step-video');
    const vidPreview = stepBlock.querySelector('.step-video-preview');
    if (vidInput && vidPreview) {
        vidInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            vidPreview.src = url;
            vidPreview.style.display = 'block';
            vidPreview.onload = () => URL.revokeObjectURL(url);
        });
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initImagePreviews);

// Actions
function viewProduct(id) {
    const p = products.find(x => x.productPrimeId === id);
    if (p) openForm('view', p, true);
}

function editProduct(id) {
    const p = products.find(x => x.productPrimeId === id);
    if (p) openForm('edit', p, false);
}

function confirmDelete(id) {
    currentProductId = id;
    document.getElementById('delete-modal').style.display = 'flex';
}



async function deleteProduct() {
    if (!currentProductId) return;
    try {
        const res = await fetch(`${BASE_URL}/api/products/delete-by-productPrimeId/${currentProductId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await res.text());
        showToast('Deleted successfully');
        loadProducts();
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    } finally {
        document.getElementById('delete-modal').style.display = 'none';
        currentProductId = null;
    }
}

// Event listeners
document.getElementById('btn-create-product').addEventListener('click', () => openForm('create'));
document.getElementById('btn-close-form').addEventListener('click', closeForm);
document.getElementById('btn-cancel-form').addEventListener('click', closeForm);
document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    document.getElementById('delete-modal').style.display = 'none';
});
document.getElementById('btn-confirm-delete').addEventListener('click', deleteProduct);

// Start
document.addEventListener('DOMContentLoaded', () => loadProducts(0));

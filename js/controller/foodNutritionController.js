import { FoodNutritionService }from "../services/foodNutritionService.js";

import { FoodNutritionComponent }from "../components/foodNutritionComponent.js";

// =========================================================
// INICIALIZACIÓN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeFoodNutrition
);

function initializeFoodNutrition() {

    // =========================================================
    // ELEMENTOS DEL DOM
    // =========================================================

    const productContainer = document.querySelector("#product-container");

    // =========================================================
    // VALIDACIÓN DEL DOM
    // =========================================================

    if (!productContainer) {

        console.error("No se encontró #product-container.");

        return;
    }

    // =========================================================
    // COMPONENT
    // =========================================================

    const foodNutritionComponent = new FoodNutritionComponent(productContainer);

    // =========================================================
    // OBTENER BARCODE DE LA URL
    // =========================================================

    const urlParams = new URLSearchParams(window.location.search);

    const barcode = urlParams.get("barcode")?.trim();

    // =========================================================
    // VALIDACIÓN DEL BARCODE
    // =========================================================

    if (!barcode) {

        renderError("No se especificó un código de barras.");

        return;
    }

    if (!/^\d{8,14}$/.test(barcode)) {

        renderError("El código de barras no tiene un formato válido.");

        return;
    }

    // =========================================================
    // CARGAR PRODUCTO
    // =========================================================

    loadProduct(barcode);

    // =========================================================
    // CARGAR PRODUCTO DESDE LA API
    // =========================================================

    async function loadProduct(productBarcode) {

        try {

            renderLoading();

            // -------------------------------------------------
            // CONSULTAR API
            // -------------------------------------------------

            const product = await FoodNutritionService.getProductByBarcode(productBarcode);

            // -------------------------------------------------
            // RENDERIZAR PRODUCTO
            // -------------------------------------------------

            foodNutritionComponent.render(product);

            // -------------------------------------------------
            // ACTUALIZAR TÍTULO
            // -------------------------------------------------

            updateDocumentTitle(product);

        } catch (error) {

            console.error("Error al cargar el producto:",error);

            const message = error instanceof Error? error.message: "No fue posible cargar la información del producto.";

            renderError(message);

        }

    }

    // =========================================================
    // LOADING
    // =========================================================

    function renderLoading() {

        productContainer.innerHTML = `

            <div class="food-error" role="status" aria-live="polite">

                <p>
                    Cargando información del producto...
                </p>

            </div>
        `;
    }

    // =========================================================
    // ERROR
    // =========================================================

    function renderError(message) {

        productContainer.innerHTML = `

            <div class="food-error" role="alert">

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>
        `;
    }

    // =========================================================
    // ACTUALIZAR TÍTULO
    // =========================================================

    function updateDocumentTitle(product) {

        const productName =
            product?.product_name_es ||
            product?.product_name ||
            product?.product_name_en;

        if (!productName) {

            return;
        }

        document.title = `${productName} - Food Nutrition`;

    }

    // =========================================================
    // ESCAPAR HTML
    // =========================================================

    function escapeHtml(value) {

        return String(value)
        
            .replaceAll("&","&amp;")

            .replaceAll("<","&lt;")

            .replaceAll(">","&gt;")

            .replaceAll('"',"&quot;")

            .replaceAll("'","&#039;");

    }

}
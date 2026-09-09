import { FoodNutritionService } from "../services/foodNutritionService.js";
import { StorageService } from "../services/storageService.js";
import { FoodNutritionComponent } from "../components/foodNutritionComponent.js";

// =========================================================
// INICIALIZACIÓN
// =========================================================
document.addEventListener(
    "astro:page-load",
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

    const urlParams = new URLSearchParams( window.location.search);

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

    const request = new AbortController();
    document.addEventListener("astro:before-swap", () => request.abort(), { once: true });
    loadProduct(barcode);

    productContainer.addEventListener("wishlist:submit", event => {

            const {
                priority,
                category,
                note
            } = event.detail;

            const errors = validateWishlistForm({
                    priority,
                    category,
                    note
                });

            if (Object.keys(errors).length > 0) {

                foodNutritionComponent.showWishlistFieldErrors(errors);

                return;
            }

            foodNutritionComponent.clearWishlistFieldErrors();

            try {

                StorageService.addToWishlist(foodNutritionComponent.getCurrentProduct(),
                    {
                        priority: Number(priority),
                        category: category.trim(),
                        note: note.trim()
                    }
                );

                foodNutritionComponent.showWishlistSuccess();

            } catch (error) {

                const message = error instanceof Error
                        ? error.message
                        : "No fue posible guardar el producto.";

                foodNutritionComponent.showWishlistStatus(message, "error");
            }
        }
    );

    function validateWishlistForm({priority, category, note}) {

        const errors = {};

        // -------------------------------------------------
        // PRIORIDAD: requerido, numérico, mayor a 0
        // -------------------------------------------------

        const priorityNumber = Number(priority);

        if (priority === null || priority === undefined || String(priority).trim() === "") {

            errors.priority = "Ingresá una prioridad.";

        } else if (Number.isNaN(priorityNumber) || priorityNumber <= 0) {

            errors.priority = "La prioridad debe ser un número mayor a 0.";
        }

        // -------------------------------------------------
        // CATEGORÍA: requerido
        // -------------------------------------------------

        if (!category || !category.trim()) {

            errors.category = "Ingresá una categoría o etiqueta.";

        } else if (category.trim().length > 40) {

            errors.category = "La categoría no puede superar los 40 caracteres.";

        }

        // -------------------------------------------------
        // NOTA: opcional, con límite de caracteres
        // -------------------------------------------------

        if (note && note.trim().length > 200) {

            errors.note = "La nota no puede superar los 200 caracteres.";
        }

        return errors;

    }

    // =========================================================
    // CARGAR PRODUCTO DESDE LA API
    // =========================================================

    async function loadProduct(productBarcode) {

        try {

            renderLoading();

            // -------------------------------------------------
            // CONSULTAR API
            // -------------------------------------------------

            const product = await FoodNutritionService.getProductByBarcode(productBarcode, {
                signal: request.signal
            });
            if (request.signal.aborted) return;

            // -------------------------------------------------
            // RENDERIZAR PRODUCTO
            // -------------------------------------------------

            const isInWishlist = StorageService.isInWishlist(product.code);

            foodNutritionComponent.render(product,{ isInWishlist });

            // -------------------------------------------------
            // ACTUALIZAR TÍTULO
            // -------------------------------------------------

            updateDocumentTitle(product);

            // -------------------------------------------------
            // REGISTRAR EN EL HISTORIAL (RF6)
            // -------------------------------------------------
            //
            // Sólo se registra cuando la carga del producto
            // fue exitosa, nunca en caso de error.
            // -------------------------------------------------

            StorageService.registerVisit(product);

        } catch (error) {

            if (request.signal.aborted) return;

            console.error("Error al cargar el producto:", error);

            const message = error instanceof Error
                    ? error.message
                    : "No fue posible cargar la información del producto.";

            renderError(message);
        }
    }

    // =========================================================
    // LOADING
    // =========================================================

    function renderLoading(message = "Cargando información del producto...") {

        productContainer.innerHTML = `

            <div
                class="food-error"
                role="status"
                aria-live="polite"
            >
                <p>
                    ${escapeHtml(message)}
                </p>

            </div>
        `;
    }

    // =========================================================
    // ERROR
    // =========================================================

    function renderError(message) {

        productContainer.innerHTML = `
            <div
                class="food-error"
                role="alert"
            >
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

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );
    }
}

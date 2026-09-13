import { FoodNutritionService }
    from "../services/foodNutritionService.js";

import { SearchComponent }
    from "../components/searchComponent.js";


// =========================================================
// CONFIGURACIÓN IMAGENES DE INICIO
// =========================================================

const FEATURED_PRODUCTS_COUNT = 3;
const FEATURED_POOL_SIZE = 12;
const FEATURED_PAGE_SIZE = 24;
const MAX_FEATURED_PAGES = 5;


// =========================================================
// INICIALIZACIÓN
// =========================================================

document.addEventListener(
    "astro:page-load",
    initializeHome
);


function initializeHome() {

    // =========================================================
    // ELEMENTOS DEL DOM
    // =========================================================

    const featuredContainer =
        document.querySelector(
            "#featured-container"
        );

    const featuredStatus =
        document.querySelector(
            "#featured-status"
        );


    if (!featuredContainer) {
        return;
    }


    // =========================================================
    // COMPONENT
    // =========================================================

    const featuredComponent =
        new SearchComponent(
            featuredContainer
        );


    // =========================================================
    // CARGAR PRODUCTOS DESTACADOS
    // =========================================================

    const request = new AbortController();
    document.addEventListener("astro:before-swap", () => request.abort(), { once: true });
    loadFeaturedProducts();


    // =========================================================
    // OBTENER PRODUCTOS
    // =========================================================

    async function loadFeaturedProducts() {

        try {

            // -------------------------------------------------
            // LOADING
            // -------------------------------------------------

            featuredComponent.renderLoading();


            // -------------------------------------------------
            // OBTENER PRODUCTOS DE ARGENTINA CON NUTRI-SCORE A
            // -------------------------------------------------

            const candidates = [];
            const seenCodes = new Set();

            for (let page = 1; page <= MAX_FEATURED_PAGES; page++) {
                const data = await FoodNutritionService.searchProducts(
                    "",
                    "",
                    "a",
                    page,
                    FEATURED_PAGE_SIZE,
                    {
                        signal: request.signal,
                        onRetry: () => {
                            if (featuredStatus && !request.signal.aborted) {
                                featuredStatus.textContent = "La conexión está tardando. Seguimos buscando productos...";
                            }
                        }
                    }
                );

                if (request.signal.aborted) return;

                for (const product of data.products) {
                    const grade = product?.nutriscore_grade || product?.nutrition_grades;
                    if (String(grade ?? "").trim().toLowerCase() !== "a") continue;
                    if (!product.code || seenCodes.has(product.code)) continue;
                    seenCodes.add(product.code);
                    candidates.push(product);
                }

                if (
                    candidates.length >= FEATURED_POOL_SIZE ||
                    data.products.length === 0 ||
                    page * FEATURED_PAGE_SIZE >= data.count
                ) break;
            }

            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }

            const products = candidates.slice(0, FEATURED_PRODUCTS_COUNT);


            // -------------------------------------------------
            // RENDERIZAR RESULTADOS
            // -------------------------------------------------

            featuredComponent.renderResults(
                products
            );


            // -------------------------------------------------
            // LIMPIAR ESTADO
            // -------------------------------------------------

            if (featuredStatus) {

                featuredStatus.innerHTML = "";

            }


        } catch (error) {
            if (request.signal.aborted) return;

            console.error(
                "Error al cargar productos destacados:",
                error
            );


            const message =
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar productos destacados.";


            if (featuredStatus) {

                featuredStatus.innerHTML = `

                    <p
                        class="featured-error"
                    >
                        ${escapeHtml(message)}
                    </p>

                `;

            }


            featuredContainer.innerHTML = "";

        }

    }


    // =========================================================
    // ESCAPAR HTML
    // =========================================================

    function escapeHtml(
        value
    ) {

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

import { FoodNutritionService }
    from "../services/foodNutritionService.js";

import { SearchComponent }
    from "../components/searchComponent.js";


// =========================================================
// CONFIGURACIÓN IMAGENES DE INICIO
// =========================================================

const FEATURED_PRODUCTS_COUNT = 3;


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
            // OBTENER PRODUCTOS DE ARGENTINA
            // -------------------------------------------------

            const data =
                await FoodNutritionService.searchProducts(
                    "",
                    "",
                    "",
                    1,
                    FEATURED_PRODUCTS_COUNT
                );

            const products = data.products;


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
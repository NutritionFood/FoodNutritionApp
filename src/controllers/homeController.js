import { FoodNutritionService }
    from "../services/foodNutritionService.js";

import { SearchComponent }
    from "../components/searchComponent.js";


// =========================================================
// CONFIGURACIÓN
// =========================================================

const FEATURED_PRODUCTS_COUNT = 6;


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

        console.error(
            "No se encontró #featured-container."
        );

        return;
    }


    // =========================================================
    // COMPONENT (reutilizado de la vista de búsqueda)
    // =========================================================

    const featuredComponent =
        new SearchComponent(
            featuredContainer
        );


    // =========================================================
    // CARGAR PRODUCTOS DESTACADOS
    // =========================================================

    loadFeaturedProducts();


    async function loadFeaturedProducts() {

        try {

            featuredComponent.renderLoading();


            const data =
                await FoodNutritionService
                    .searchProducts(
                        "",
                        "",
                        "",
                        1,
                        FEATURED_PRODUCTS_COUNT
                    );


            const products =
                Array.isArray(data?.products)
                    ? data.products
                    : [];


            featuredComponent.renderResults(
                products
            );

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
                    <p class="featured-error">
                        ${message}
                    </p>
                `;

            }

            featuredContainer.innerHTML = "";

        }

    }

}

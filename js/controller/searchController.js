import { FoodNutritionService }from "../services/foodNutritionService.js";

import { SearchComponent }from "../components/searchComponent.js";

// =========================================================
// INICIALIZACIÓN
// =========================================================

document.addEventListener("DOMContentLoaded",initializeSearch);

function initializeSearch() {

    // =========================================================
    // ELEMENTOS DEL DOM
    // =========================================================

    const barcodeForm = document.querySelector("#barcode-form");

    const filtersForm = document.querySelector("#filters-form");

    const barcodeInput = document.querySelector("#barcode");

    const categoryInput = document.querySelector("#category");

    const brandInput = document.querySelector("#brand");

    const nutritionGradeInput = document.querySelector("#nutrition-grade");

    const resultsContainer = document.querySelector("#results-container");

    const resultsCount = document.querySelector("#results-count");

    const searchStatus = document.querySelector("#search-status");

    const pagination = document.querySelector("#pagination");

    const resultsSection = document.querySelector("#results-section");

    // =========================================================
    // VALIDACIÓN DE ELEMENTOS
    // =========================================================

    if (
    !barcodeForm ||
    !barcodeInput ||
    !filtersForm ||
    !categoryInput ||
    !brandInput ||
    !nutritionGradeInput ||
    !resultsContainer ||
    !resultsCount ||
    !searchStatus ||
    !pagination ||
    !resultsSection
    ) {
        console.error("No se pudieron obtener todos los elementos necesarios.");
        return;
    }

    // =========================================================
    // COMPONENT
    // =========================================================

    const searchComponent = new SearchComponent(resultsContainer);

    // =========================================================
    // ESTADO DE LA BÚSQUEDA
    // =========================================================

    const state = {

        category: "",
        brand: "",
        nutritionGrade: "",
        page: 1,
        pageSize: 10,
        total: 0
    };

    // =========================================================
    // BÚSQUEDA POR CÓDIGO DE BARRAS
    // =========================================================

    barcodeForm.addEventListener("submit",event => {

            event.preventDefault();

            const barcode = barcodeInput.value.trim();

            // -------------------------------------------------
            // VALIDACIÓN
            // -------------------------------------------------

            if (!barcode) {

                showStatus("Ingresá un código de barras.", "error");

                barcodeInput.focus();

                return;
            }

            if (!/^\d{8,14}$/.test(barcode)) {

                showStatus("El código de barras debe contener entre 8 y 14 números.", "error");

                barcodeInput.focus();

                return;
            }

            window.location.assign(`./foodNutrition.html?barcode=${encodeURIComponent(barcode)}`);
        }
    );

    // =========================================================
    // BÚSQUEDA CON FILTROS
    // =========================================================

    filtersForm.addEventListener("submit", async event => {

            event.preventDefault();

            // -------------------------------------------------
            // OBTENER ELEMENTOS
            // -------------------------------------------------

            const category = categoryInput.value.trim();
            const brand = brandInput.value.trim();
            const nutritionGrade = nutritionGradeInput.value.trim();

            // -------------------------------------------------
            // VALIDACIÓN
            // -------------------------------------------------

            if (!category && !brand && !nutritionGrade
            ) {

                showStatus("Seleccioná al menos un filtro.", "error");

                return;
            }

            // -------------------------------------------------
            // GUARDAR ESTADO
            // -------------------------------------------------

            state.category = category;
            state.brand = brand;
            state.nutritionGrade = nutritionGrade;
            state.page = 1;
            state.total = 0;

            // -------------------------------------------------
            // EJECUTAR BÚSQUEDA
            // -------------------------------------------------

            await executeSearch();
        }
    );

    // =========================================================
    // EJECUTAR BÚSQUEDA
    // =========================================================

    async function executeSearch() {

        try {

            clearStatus();

            clearResults();

            hidePagination();

            searchComponent.renderLoading();

            // -------------------------------------------------
            // CONSULTAR API
            // -------------------------------------------------

            const data = await FoodNutritionService.searchProducts(
                        state.category,
                        state.brand,
                        state.nutritionGrade,
                        state.page,
                        state.pageSize
                    );

            // -------------------------------------------------
            // PRODUCTOS
            // -------------------------------------------------
            const products = Array.isArray(data?.products)? data.products: [];

            // -------------------------------------------------
            // TOTAL
            // -------------------------------------------------

            state.total = Number.isInteger(data?.count) ? data.count: 0;

            // -------------------------------------------------
            // RENDER RESULTADOS
            // -------------------------------------------------

            searchComponent.renderResults(products);

            renderResultsCount(state.total);

            renderPagination();

            // -------------------------------------------------
            // SCROLL
            // -------------------------------------------------

            resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error("Error durante la búsqueda:",error);

            const message =  error instanceof Error? error.message: "Ocurrió un error inesperado durante la búsqueda.";

            searchComponent.renderError(message);

            showStatus(message,"error");
        }
    }

    // =========================================================
    // PAGINACIÓN
    // =========================================================

    function renderPagination() {

        if (state.total <=state.pageSize) {

            hidePagination();

            return;
        }

        const totalPages = Math.ceil(state.total /state.pageSize);

        pagination.innerHTML = `

            <button
                id="previous-page"
                type="button"
                ${
                    state.page <= 1
                        ? "disabled"
                        : ""
                }
            >
                ← Anterior
            </button>

            <span>
                Página
                ${state.page}
                de
                ${totalPages}
            </span>

            <button
                id="next-page"
                type="button"
                ${
                    state.page >= totalPages
                        ? "disabled"
                        : ""
                }
            >
                Siguiente →
            </button>

        `;

        // -----------------------------------------------------
        // ANTERIOR
        // -----------------------------------------------------

        const previousButton =document.querySelector("#previous-page");

        previousButton?.addEventListener("click",async () => {

                if (
                    state.page <= 1
                ) {

                    return;
                }

                state.page--;

                await executeSearch();
            }
        );

        // -----------------------------------------------------
        // SIGUIENTE
        // -----------------------------------------------------

        const nextButton =
            document.querySelector(
                "#next-page"
            );


        nextButton?.addEventListener(
            "click",
            async () => {

                if (
                    state.page >= totalPages
                ) {

                    return;
                }


                state.page++;

                await executeSearch();

            }
        );

    }

    // =========================================================
    // CANTIDAD DE RESULTADOS
    // =========================================================

    function renderResultsCount(total) {

        if (total === 0) {

            resultsCount.textContent =
                "No se encontraron productos.";

            return;
        }


        resultsCount.textContent =
            `${total.toLocaleString("es-AR")} productos encontrados`;

    }


    // =========================================================
    // STATUS
    // =========================================================

    function showStatus(message, type) {
    searchStatus.innerHTML = "";

    const statusElement = document.createElement("div");

    statusElement.className = `status-${type}`;
    statusElement.textContent = message;

    searchStatus.appendChild(statusElement);
    }


    // =========================================================
    // LIMPIAR STATUS
    // =========================================================

    function clearStatus() {

        searchStatus.innerHTML = "";

    }

    // =========================================================
    // LIMPIAR RESULTADOS
    // =========================================================

    function clearResults() {

        resultsContainer.innerHTML = "";

        resultsCount.textContent = "";

    }

    // =========================================================
    // OCULTAR PAGINACIÓN
    // =========================================================

    function hidePagination() {

        pagination.innerHTML = "";

    }
}
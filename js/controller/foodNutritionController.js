import { FoodNutritionService }
    from "../services/foodNutritionService.js";


import { SearchComponent }
    from "../components/searchComponent.js";


// =========================================================
// ELEMENTOS DEL DOM
// =========================================================

const barcodeForm =
    document.querySelector("#barcode-form");


const filtersForm =
    document.querySelector("#filters-form");


const resultsContainer =
    document.querySelector("#results-container");


const resultsCount =
    document.querySelector("#results-count");


const searchStatus =
    document.querySelector("#search-status");


const pagination =
    document.querySelector("#pagination");


const resultsSection =
    document.querySelector("#results-section");


// =========================================================
// COMPONENT
// =========================================================

const searchComponent =
    new SearchComponent(
        resultsContainer
    );


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
// BARCODE
// =========================================================

barcodeForm.addEventListener(

    "submit",

    async event => {


        event.preventDefault();


        const barcode =

            document
                .querySelector("#barcode")
                .value
                .trim();


        // -----------------------------------------------------
        // VALIDACIÓN
        // -----------------------------------------------------

        if (!barcode) {

            showStatus(

                "Ingresá un código de barras.",

                "error"

            );

            return;

        }


        if (!/^\d{8,14}$/.test(barcode)) {

            showStatus(

                "El código de barras debe contener entre 8 y 14 números.",

                "error"

            );

            return;

        }


        try {


            clearStatus();

            clearResults();

            hidePagination();


            searchComponent.renderLoading();


            // -------------------------------------------------
            // CONSULTAR PRODUCTO
            // -------------------------------------------------

            const product =

                await FoodNutritionService
                    .getProductByBarcode(
                        barcode
                    );


            // -------------------------------------------------
            // NAVEGAR AL DETALLE
            // -------------------------------------------------

            window.location.href =

                `./foodNutrition.html?barcode=${encodeURIComponent(
                    product.code
                )}`;


        } catch (error) {


            console.error(

                "Error al buscar producto:",

                error

            );


            searchComponent.renderError(

                error.message

            );


            showStatus(

                error.message,

                "error"

            );

        }

    }

);


// =========================================================
// BÚSQUEDA CON FILTROS
// =========================================================

filtersForm.addEventListener(

    "submit",

    async event => {


        event.preventDefault();


        // -----------------------------------------------------
        // OBTENER VALORES
        // -----------------------------------------------------

        const category =

            document
                .querySelector("#category")
                .value;


        const brand =

            document
                .querySelector("#brand")
                .value
                .trim();


        const nutritionGrade =

            document
                .querySelector("#nutrition-grade")
                .value;


        // -----------------------------------------------------
        // VALIDACIÓN
        // -----------------------------------------------------

        if (

            !category &&
            !brand &&
            !nutritionGrade

        ) {

            showStatus(

                "Seleccioná al menos un filtro.",

                "error"

            );

            return;

        }


        // -----------------------------------------------------
        // GUARDAR ESTADO
        // -----------------------------------------------------

        state.category =
            category;


        state.brand =
            brand;


        state.nutritionGrade =
            nutritionGrade;


        state.page =
            1;


        state.total =
            0;


        // -----------------------------------------------------
        // EJECUTAR BÚSQUEDA
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // CONSULTAR API
        // -----------------------------------------------------

        const data =

            await FoodNutritionService
                .searchProducts(

                    state.category,

                    state.brand,

                    state.nutritionGrade,

                    state.page,

                    state.pageSize

                );


        // -----------------------------------------------------
        // PRODUCTOS
        // -----------------------------------------------------

        const products =
            data?.products ?? [];


        // -----------------------------------------------------
        // TOTAL
        // -----------------------------------------------------

        state.total =
            data?.count ?? 0;


        // -----------------------------------------------------
        // RENDER
        // -----------------------------------------------------

        searchComponent.renderResults(
            products
        );


        renderResultsCount(
            state.total
        );


        renderPagination();


        // -----------------------------------------------------
        // SCROLL
        // -----------------------------------------------------

        resultsSection.scrollIntoView({

            behavior: "smooth"

        });


    } catch (error) {


        console.error(

            "Error durante la búsqueda:",

            error

        );


        searchComponent.renderError(

            error.message

        );


        showStatus(

            error.message,

            "error"

        );

    }

}


// =========================================================
// PAGINACIÓN
// =========================================================

function renderPagination() {


    if (

        state.total <=
        state.pageSize

    ) {

        hidePagination();

        return;

    }


    const totalPages =

        Math.ceil(

            state.total /
            state.pageSize

        );


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


    // ---------------------------------------------------------
    // ANTERIOR
    // ---------------------------------------------------------

    document

        .querySelector("#previous-page")

        ?.addEventListener(

            "click",

            async () => {


                if (

                    state.page <= 1

                ) {

                    return;

                }


                state.page--;


                await executeSearch();

            }

        );


    // ---------------------------------------------------------
    // SIGUIENTE
    // ---------------------------------------------------------

    document

        .querySelector("#next-page")

        ?.addEventListener(

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

function showStatus(

    message,

    type

) {


    searchStatus.innerHTML = `

        <div class="status-${type}">

            ${escapeHtml(message)}

        </div>

    `;

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
import { FoodNutritionService }
    from "../services/foodNutritionService.js";

import { StorageService }
    from "../services/storageService.js";

import { FoodNutritionComponent }
    from "../components/foodNutritionComponent.js";

import { initNav }
    from "../components/navComponent.js";


// =========================================================
// INICIALIZACIÓN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeFoodNutrition
);


function initializeFoodNutrition() {

    // =========================================================
    // NAVEGACIÓN
    // =========================================================
    //
    // El detalle no es en sí mismo un ítem del menú
    // principal, por eso no se marca ningún link como activo.
    // =========================================================

    initNav();


    // =========================================================
    // ELEMENTOS DEL DOM
    // =========================================================

    const productContainer =
        document.querySelector(
            "#product-container"
        );


    // =========================================================
    // VALIDACIÓN DEL DOM
    // =========================================================

    if (!productContainer) {

        console.error(
            "No se encontró #product-container."
        );

        return;
    }


    // =========================================================
    // COMPONENT
    // =========================================================

    const foodNutritionComponent =
        new FoodNutritionComponent(
            productContainer
        );


    // =========================================================
    // OBTENER BARCODE DE LA URL
    // =========================================================

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const barcode =
        urlParams
            .get("barcode")
            ?.trim();


    // =========================================================
    // VALIDACIÓN DEL BARCODE
    // =========================================================

    if (!barcode) {

        renderError(
            "No se especificó un código de barras."
        );

        return;
    }


    if (!/^\d{8,14}$/.test(barcode)) {

        renderError(
            "El código de barras no tiene un formato válido."
        );

        return;
    }


    // =========================================================
    // CARGAR PRODUCTO
    // =========================================================

    loadProduct(
        barcode
    );


    // =========================================================
    // LISTA DE DESEOS - MANEJO DEL FORMULARIO (RF5, Variante B)
    // =========================================================
    //
    // El componente emite "wishlist:submit" con los valores
    // crudos del formulario. El controller valida y persiste.
    // =========================================================

    productContainer.addEventListener(
        "wishlist:submit",
        event => {

            const {
                priority,
                category,
                note
            } = event.detail;


            const errors =
                validateWishlistForm({
                    priority,
                    category,
                    note
                });


            if (Object.keys(errors).length > 0) {

                foodNutritionComponent
                    .showWishlistFieldErrors(
                        errors
                    );

                return;
            }


            foodNutritionComponent
                .clearWishlistFieldErrors();


            try {

                StorageService.addToWishlist(
                    foodNutritionComponent.getCurrentProduct(),
                    {
                        priority: Number(priority),
                        category: category.trim(),
                        note: note.trim()
                    }
                );


                foodNutritionComponent
                    .showWishlistSuccess();

            } catch (error) {

                const message =
                    error instanceof Error
                        ? error.message
                        : "No fue posible guardar el producto.";


                foodNutritionComponent
                    .showWishlistStatus(
                        message,
                        "error"
                    );

            }

        }
    );


    // =========================================================
    // LISTA DE DESEOS - VALIDACIÓN (RF5)
    // =========================================================

    function validateWishlistForm({
        priority,
        category,
        note
    }) {

        const errors = {};


        // -------------------------------------------------
        // PRIORIDAD: requerido, numérico, mayor a 0
        // -------------------------------------------------

        const priorityNumber =
            Number(priority);


        if (
            priority === null ||
            priority === undefined ||
            String(priority).trim() === ""
        ) {

            errors.priority =
                "Ingresá una prioridad.";

        } else if (
            Number.isNaN(priorityNumber) ||
            priorityNumber <= 0
        ) {

            errors.priority =
                "La prioridad debe ser un número mayor a 0.";

        }


        // -------------------------------------------------
        // CATEGORÍA: requerido
        // -------------------------------------------------

        if (!category || !category.trim()) {

            errors.category =
                "Ingresá una categoría o etiqueta.";

        } else if (category.trim().length > 40) {

            errors.category =
                "La categoría no puede superar los 40 caracteres.";

        }


        // -------------------------------------------------
        // NOTA: opcional, con límite de caracteres
        // -------------------------------------------------

        if (note && note.trim().length > 200) {

            errors.note =
                "La nota no puede superar los 200 caracteres.";

        }


        return errors;

    }


    // =========================================================
    // CARGAR PRODUCTO DESDE LA API
    // =========================================================

    async function loadProduct(
        productBarcode
    ) {

        try {

            renderLoading();


            // -------------------------------------------------
            // CONSULTAR API
            // -------------------------------------------------

            const product =
                await FoodNutritionService
                    .getProductByBarcode(
                        productBarcode
                    );


            // -------------------------------------------------
            // RENDERIZAR PRODUCTO
            // -------------------------------------------------

            const isInWishlist =
                StorageService.isInWishlist(
                    product.code
                );


            foodNutritionComponent.render(
                product,
                { isInWishlist }
            );


            // -------------------------------------------------
            // ACTUALIZAR TÍTULO
            // -------------------------------------------------

            updateDocumentTitle(
                product
            );


            // -------------------------------------------------
            // REGISTRAR EN EL HISTORIAL (RF6)
            // -------------------------------------------------
            //
            // Sólo se registra cuando la carga del producto
            // fue exitosa, nunca en caso de error.
            // -------------------------------------------------

            StorageService.registerVisit(
                product
            );

        } catch (error) {

            console.error(
                "Error al cargar el producto:",
                error
            );


            const message =
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar la información del producto.";


            renderError(
                message
            );

        }

    }


    // =========================================================
    // LOADING
    // =========================================================

    function renderLoading() {

        productContainer.innerHTML = `

            <div
                class="food-error"
                role="status"
                aria-live="polite"
            >

                <p>
                    Cargando información del producto...
                </p>

            </div>

        `;

    }


    // =========================================================
    // ERROR
    // =========================================================

    function renderError(
        message
    ) {

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

    function updateDocumentTitle(
        product
    ) {

        const productName =
            product?.product_name_es ||
            product?.product_name ||
            product?.product_name_en;


        if (!productName) {

            return;
        }


        document.title =
            `${productName} - Food Nutrition`;

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
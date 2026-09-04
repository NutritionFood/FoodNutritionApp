export class SearchComponent {

    constructor(container) {

        this.container =
            container;

    }


    // =========================================================
    // RESULTADOS
    // =========================================================

    renderResults(
        products = []
    ) {

        if (
            !Array.isArray(products) ||
            products.length === 0
        ) {

            this.container.innerHTML = `

                <div
                    class="search-empty"
                    role="status"
                    aria-live="polite"
                >

                    <h3>
                        No se encontraron productos
                    </h3>

                    <p>
                        Probá con otra búsqueda.
                    </p>

                </div>

            `;

            return;
        }


        this.container.innerHTML =
            products
                .map(
                    product =>
                        this.renderProduct(
                            product
                        )
                )
                .join("");

    }


    // =========================================================
    // PRODUCTO
    // =========================================================

    renderProduct(
        product
    ) {

        const name =
            product?.product_name_es ||
            product?.product_name ||
            "Producto sin nombre";


        const brand =
            product?.brands ||
            "Marca no disponible";


        const barcode =
            product?.code ||
            "";


        const image =
            product?.image_front_url ||
            null;


        const calories =
            product?.nutriments?.[
                "energy-kcal_100g"
            ];


        const proteins =
            product?.nutriments?.[
                "proteins_100g"
            ];


        const sugars =
            product?.nutriments?.[
                "sugars_100g"
            ];


        const nutritionGrade =
            product?.nutriscore_grade ||
            product?.nutrition_grades ||
            null;


        return `

            <article
                class="product-card"
            >

                <div
                    class="product-image"
                >

                    ${
                        image

                            ? `

                                <img
                                    src="${this.escapeHtml(image)}"
                                    alt="${this.escapeHtml(name)}"
                                    loading="lazy"
                                    decoding="async"
                                >

                            `

                            : `

                                <div
                                    class="no-image"
                                    role="img"
                                    aria-label="Imagen no disponible"
                                >
                                    Imagen no disponible
                                </div>

                            `
                    }

                </div>


                <div
                    class="product-info"
                >

                    <span
                        class="product-brand"
                    >
                        ${this.escapeHtml(brand)}
                    </span>


                    <h3
                        class="product-name"
                    >
                        ${this.escapeHtml(name)}
                    </h3>


                    <div
                        class="product-nutrition"
                    >

                        ${this.renderNutrient(
                            calories,
                            "kcal",
                            "Calorías"
                        )}

                        ${this.renderNutrient(
                            proteins,
                            "g",
                            "Proteínas"
                        )}

                        ${this.renderNutrient(
                            sugars,
                            "g",
                            "Azúcares"
                        )}

                    </div>


                    ${
                        nutritionGrade

                            ? `

                                <span
                                    class="
                                        nutrition-grade
                                        nutrition-grade-${this.escapeHtml(
                                            String(
                                                nutritionGrade
                                            ).toLowerCase()
                                        )}
                                    "
                                >

                                    Nutri-Score:

                                    ${this.escapeHtml(
                                        String(
                                            nutritionGrade
                                        ).toUpperCase()
                                    )}

                                </span>

                            `

                            : `

                                <span
                                    class="nutrition-unavailable"
                                >
                                    Nutri-Score no disponible
                                </span>

                            `
                    }


                    ${
                        barcode

                            ? `

                                <a
                                    class="detail-button"
                                    href="/html/foodNutrition.html?barcode=${encodeURIComponent(
                                        barcode
                                    )}"
                                    aria-label="Ver detalle de ${this.escapeHtml(name)}"
                                >
                                    Ver detalle
                                </a>

                            `

                            : ""

                    }

                </div>

            </article>

        `;

    }


    // =========================================================
    // NUTRIENTE
    // =========================================================

    renderNutrient(
        value,
        unit,
        label
    ) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return `

                <span>
                    ${this.escapeHtml(label)}:
                    no disponible
                </span>

            `;

        }


        return `

            <span>

                ${this.escapeHtml(label)}:

                <strong>
                    ${this.formatNumber(value)}
                    ${this.escapeHtml(unit)}
                </strong>

            </span>

        `;

    }


    // =========================================================
    // ERROR
    // =========================================================

    renderError(
        message
    ) {

        this.container.innerHTML = `

            <div
                class="search-error"
                role="alert"
            >

                <h3>
                    No fue posible realizar la búsqueda
                </h3>

                <p>
                    ${this.escapeHtml(
                        message
                    )}
                </p>

            </div>

        `;

    }


    // =========================================================
    // LOADING
    // =========================================================

    renderLoading() {

        this.container.innerHTML = `

            <div
                class="search-loading"
                role="status"
                aria-live="polite"
                aria-busy="true"
            >

                <div
                    class="loading-spinner"
                    aria-hidden="true"
                ></div>


                <p
                    class="loading-title"
                >
                    Buscando productos...
                </p>


                <p
                    class="loading-description"
                >
                    Consultando Open Food Facts.
                </p>

            </div>

        `;

    }


    // =========================================================
    // FORMATEAR NÚMERO
    // =========================================================

    formatNumber(
        value
    ) {

        const number =
            Number(value);


        if (
            Number.isNaN(number)
        ) {

            return this.escapeHtml(
                value
            );

        }


        return number.toLocaleString(
            "es-AR",
            {
                maximumFractionDigits: 2
            }
        );

    }


    // =========================================================
    // ESCAPAR HTML
    // =========================================================

    escapeHtml(
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
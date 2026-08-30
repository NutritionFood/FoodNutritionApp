export class SearchComponent {

    constructor(container) {

        this.container = container;
    }


    renderResults(products = []) {

        if (products.length === 0) {

            this.container.innerHTML = `
                <div class="search-empty">

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
                .map(product =>
                    this.renderProduct(product)
                )
                .join("");
    }


    renderProduct(product) {

        const name =
            product.product_name_es ||
            product.product_name ||
            "Producto sin nombre";


        const brand =
            product.brands ||
            "Marca no disponible";


        const barcode =
            product.code ||
            "";


        const image =
            product.image_front_url ||
            null;


        const calories =
            product.nutriments?.[
                "energy-kcal_100g"
            ];


        const proteins =
            product.nutriments?.[
                "proteins_100g"
            ];


        const sugars =
            product.nutriments?.[
                "sugars_100g"
            ];


        const nutritionGrade =
            product.nutriscore_grade ||
            product.nutrition_grades ||
            null;


        return `
            <article class="product-card">

                <div class="product-image">

                    ${
                        image

                            ? `
                                <img
                                    src="${this.escapeHtml(image)}"
                                    alt="${this.escapeHtml(name)}"
                                    loading="lazy"
                                >
                            `

                            : `
                                <div class="no-image">
                                    Imagen no disponible
                                </div>
                            `
                    }

                </div>


                <div class="product-info">

                    <span class="product-brand">
                        ${this.escapeHtml(brand)}
                    </span>


                    <h3 class="product-name">
                        ${this.escapeHtml(name)}
                    </h3>


                    <div class="product-nutrition">

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
                                            nutritionGrade.toLowerCase()
                                        )}
                                    "
                                >
                                    Nutri-Score:
                                    ${this.escapeHtml(
                                        nutritionGrade.toUpperCase()
                                    )}
                                </span>
                            `

                            : `
                                <span class="nutrition-unavailable">
                                    Nutri-Score no disponible
                                </span>
                            `
                    }


                    ${
                        barcode

                            ? `
                                <a
                                    class="detail-button"
                                    href="./foodNutrition.html?barcode=${encodeURIComponent(barcode)}"
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


    renderNutrient(value, unit, label) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return `
                <span>
                    ${label}: no disponible
                </span>
            `;
        }


        return `
            <span>
                ${label}:
                <strong>
                    ${this.formatNumber(value)}
                    ${unit}
                </strong>
            </span>
        `;
    }


    // =========================================================
    // ESTE MÉTODO ES EL QUE ESTÁ FALTANDO
    // =========================================================

    renderError(message) {

        this.container.innerHTML = `
            <div class="search-error">

                <h3>
                    No fue posible realizar la búsqueda
                </h3>

                <p>
                    ${this.escapeHtml(message)}
                </p>

            </div>
        `;
    }


    renderLoading() {

        this.container.innerHTML = `
            <div class="search-loading">

                <p>
                    Buscando productos...
                </p>

            </div>
        `;
    }


    formatNumber(value) {

        const number =
            Number(value);


        if (Number.isNaN(number)) {

            return value;
        }


        return number.toLocaleString(
            "es-AR",
            {
                maximumFractionDigits: 2
            }
        );
    }


    escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
}
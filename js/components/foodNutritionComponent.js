export class FoodNutritionComponent {
    constructor(container) {
        this.container = container;
    }

    render(product) {
        if (!product) {
            this.container.innerHTML = `
                <div class="food-error">
                    <p>No se encontró información del producto.</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <article class="food-product">

                ${this.renderHeader(product)}

                ${this.renderNutrition(product)}

                ${this.renderNutrientLevels(product)}

                ${this.renderAdditionalImages(product)}

            </article>
        `;

        this.bindEvents();
    }

    // =========================================================
    // HEADER
    // =========================================================

    renderHeader(product) {
        const image = this.getProductImage(product);

        const name =
            product.product_name_es ||
            product.product_name ||
            product.product_name_en ||
            "Producto sin nombre";

        const brand =
            product.brands ||
            "Marca no disponible";

        const quantity =
            product.product_quantity && product.product_quantity_unit
                ? `${product.product_quantity} ${product.product_quantity_unit}`
                : product.quantity || "Cantidad no disponible";

        const categories =
            product.categories
                ? product.categories
                    .split(",")
                    .map(category => category.trim())
                    .join(" · ")
                : "Categoría no disponible";

        return `
            <section class="food-header">

                <div class="food-image-container">
                    ${
                        image
                            ? `<img
                                src="${image}"
                                alt="${this.escapeHtml(name)}"
                                class="food-main-image"
                            >`
                            : `<div class="food-no-image">
                                Sin imagen
                               </div>`
                    }
                </div>

                <div class="food-product-info">

                    <span class="food-brand">
                        ${this.escapeHtml(brand)}
                    </span>

                    <h1 class="food-product-name">
                        ${this.escapeHtml(name)}
                    </h1>

                    <p class="food-quantity">
                        ${this.escapeHtml(String(quantity))}
                    </p>

                    <p class="food-category">
                        ${this.escapeHtml(categories)}
                    </p>

                    ${
                        product.code
                            ? `
                                <p class="food-barcode">
                                    Código: ${this.escapeHtml(product.code)}
                                </p>
                            `
                            : ""
                    }

                </div>

            </section>

            ${this.renderNutriScore(product)}
        `;
    }

    // =========================================================
    // NUTRI-SCORE
    // =========================================================

    renderNutriScore(product) {
        const grade =
            product.nutriscore_grade ||
            product.nutrition_grade_fr ||
            "unknown";

        if (grade === "unknown") {
            return `
                <section class="food-nutriscore">

                    <h2>Nutri-Score</h2>

                    <div class="nutriscore-unavailable">
                        <strong>N/D</strong>
                        <span>No disponible</span>
                    </div>

                </section>
            `;
        }

        return `
            <section class="food-nutriscore">

                <h2>Nutri-Score</h2>

                <div class="nutriscore-value nutriscore-${grade}">
                    ${grade.toUpperCase()}
                </div>

            </section>
        `;
    }

    // =========================================================
    // NUTRICIÓN
    // =========================================================

    renderNutrition(product) {
        const nutrients = product.nutriments || {};

        const nutrition = [
            {
                key: "energy-kcal_100g",
                label: "Energía",
                unit: "kcal"
            },
            {
                key: "proteins_100g",
                label: "Proteínas",
                unit: "g"
            },
            {
                key: "carbohydrates_100g",
                label: "Carbohidratos",
                unit: "g"
            },
            {
                key: "fat_100g",
                label: "Grasas",
                unit: "g"
            },
            {
                key: "saturated-fat_100g",
                label: "Grasas saturadas",
                unit: "g"
            },
            {
                key: "fiber_100g",
                label: "Fibra",
                unit: "g"
            },
            {
                key: "sugars_100g",
                label: "Azúcares",
                unit: "g"
            },
            {
                key: "salt_100g",
                label: "Sal",
                unit: "g"
            }
        ];

        const availableNutrients = nutrition.filter(
            nutrient =>
                nutrients[nutrient.key] !== undefined &&
                nutrients[nutrient.key] !== null
        );

        if (availableNutrients.length === 0) {
            return `
                <section class="food-nutrition">

                    <h2>Información nutricional</h2>

                    <p class="food-no-data">
                        No hay información nutricional disponible.
                    </p>

                </section>
            `;
        }

        return `
            <section class="food-nutrition">

                <div class="food-section-header">
                    <h2>Información nutricional</h2>
                    <span>Por 100 g</span>
                </div>

                <div class="nutrition-grid">

                    ${availableNutrients
                        .map(nutrient => `
                            <div class="nutrition-item">

                                <span class="nutrition-label">
                                    ${nutrient.label}
                                </span>

                                <strong class="nutrition-value">
                                    ${this.formatNumber(
                                        nutrients[nutrient.key]
                                    )}
                                    ${nutrient.unit}
                                </strong>

                            </div>
                        `)
                        .join("")}

                </div>

                ${this.renderServing(product)}

            </section>
        `;
    }

    // =========================================================
    // PORCIÓN
    // =========================================================

    renderServing(product) {
        if (
            product.serving_quantity === undefined ||
            product.serving_quantity === null
        ) {
            return "";
        }

        const unit =
            product.serving_quantity_unit || "";

        return `
            <div class="food-serving">

                <span>Porción</span>

                <strong>
                    ${this.formatNumber(product.serving_quantity)}
                    ${this.escapeHtml(unit)}
                </strong>

            </div>
        `;
    }

    // =========================================================
    // NIVELES NUTRICIONALES
    // =========================================================

    renderNutrientLevels(product) {
        const levels = product.nutrient_levels;

        if (!levels) {
            return "";
        }

        const nutrients = [
            {
                key: "fat",
                label: "Grasas"
            },
            {
                key: "saturated-fat",
                label: "Grasas saturadas"
            },
            {
                key: "sugars",
                label: "Azúcares"
            },
            {
                key: "salt",
                label: "Sal"
            }
        ];

        const available = nutrients.filter(
            nutrient => levels[nutrient.key]
        );

        if (available.length === 0) {
            return "";
        }

        return `
            <section class="food-levels">

                <h2>Indicadores nutricionales</h2>

                <div class="nutrient-level-list">

                    ${available
                        .map(nutrient => `
                            <div class="nutrient-level">

                                <span>
                                    ${nutrient.label}
                                </span>

                                <strong class="
                                    level-${levels[nutrient.key]}
                                ">
                                    ${this.translateLevel(
                                        levels[nutrient.key]
                                    )}
                                </strong>

                            </div>
                        `)
                        .join("")}

                </div>

            </section>
        `;
    }

    // =========================================================
    // IMÁGENES
    // =========================================================

    renderAdditionalImages(product) {
        const images = product.selected_images;

        if (!images) {
            return "";
        }

        const availableImages = [];

        if (images.front?.display?.es) {
            availableImages.push({
                label: "Frente",
                src: images.front.display.es
            });
        }

        if (images.nutrition?.display?.es) {
            availableImages.push({
                label: "Nutrición",
                src: images.nutrition.display.es
            });
        }

        if (images.ingredients?.display?.es) {
            availableImages.push({
                label: "Ingredientes",
                src: images.ingredients.display.es
            });
        }

        if (availableImages.length === 0) {
            return "";
        }

        return `
            <section class="food-images">

                <h2>Imágenes</h2>

                <div class="food-image-gallery">

                    ${availableImages
                        .map((image, index) => `
                            <button
                                type="button"
                                class="food-gallery-item"
                                data-image="${this.escapeHtml(image.src)}"
                                data-index="${index}"
                            >
                                <img
                                    src="${this.escapeHtml(image.src)}"
                                    alt="${this.escapeHtml(image.label)}"
                                >

                                <span>
                                    ${this.escapeHtml(image.label)}
                                </span>
                            </button>
                        `)
                        .join("")}

                </div>

            </section>
        `;
    }

    // =========================================================
    // EVENTOS
    // =========================================================

    bindEvents() {
        const galleryItems =
            this.container.querySelectorAll(
                ".food-gallery-item"
            );

        galleryItems.forEach(item => {

            item.addEventListener("click", () => {

                const imageUrl =
                    item.dataset.image;

                const mainImage =
                    this.container.querySelector(
                        ".food-main-image"
                    );

                if (mainImage && imageUrl) {
                    mainImage.src = imageUrl;
                }
            });

        });
    }

    // =========================================================
    // HELPERS
    // =========================================================

    getProductImage(product) {
        return (
            product.selected_images?.front?.display?.es ||
            product.selected_images?.front?.display?.en ||
            product.image_front_url ||
            product.image_url ||
            null
        );
    }

    formatNumber(value) {
        const number = Number(value);

        if (Number.isNaN(number)) {
            return value;
        }

        return number.toLocaleString("es-AR", {
            maximumFractionDigits: 2
        });
    }

    translateLevel(level) {
        const translations = {
            low: "Bajo",
            moderate: "Moderado",
            high: "Alto"
        };

        return translations[level] || level;
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
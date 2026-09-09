export class WishlistComponent {

    constructor(container) {
        this.container = container;
    }


    // =========================================================
    // RENDER PRINCIPAL
    // =========================================================

    render(items = []) {

        if (!Array.isArray(items) || items.length === 0) {

            this.container.innerHTML = `

                <div
                    class="wishlist-empty"
                    role="status"
                >

                    <h3>
                        Tu lista de deseos está vacía
                    </h3>

                    <p>
                        Buscá productos y agregalos desde su
                        vista de detalle.
                    </p>

                    <a
                        href="/search"
                        class="primary-button-link"
                    >
                        Buscar productos
                    </a>

                </div>

            `;

            return;
        }


        this.container.innerHTML =
            items
                .map(item => this.renderItem(item))
                .join("");

    }


    // =========================================================
    // ITEM
    // =========================================================

    renderItem(item) {

        const image =
            item.image;


        const grade =
            item.nutritionGrade;


        return `

            <article
                class="wishlist-card"
                data-barcode="${this.escapeHtml(item.barcode)}"
            >

                <div class="wishlist-card-image">

                    ${
                        image

                            ? `
                                <img
                                    src="${this.escapeHtml(image)}"
                                    alt="${this.escapeHtml(item.name)}"
                                    loading="lazy"
                                >
                            `

                            : `
                                <div class="no-image">
                                    Sin imagen
                                </div>
                            `
                    }

                </div>


                <div class="wishlist-card-info">

                    <span class="product-brand">
                        ${this.escapeHtml(item.brand)}
                    </span>

                    <h3 class="product-name">
                        ${this.escapeHtml(item.name)}
                    </h3>


                    ${
                        grade

                            ? `
                                <span
                                    class="
                                        nutrition-grade
                                        nutrition-grade-${this.escapeHtml(
                                            String(grade).toLowerCase()
                                        )}
                                    "
                                >
                                    Nutri-Score:
                                    ${this.escapeHtml(
                                        String(grade).toUpperCase()
                                    )}
                                </span>
                            `

                            : ""
                    }


                    <dl class="wishlist-preferences">

                        <div>
                            <dt>Prioridad</dt>
                            <dd>

                                <span class="wishlist-priority">
                                    ${this.renderPriority(item.priority)}
                                </span>

                            </dd>
                        </div>

                        <div>
                            <dt>Categoría</dt>
                            <dd>${this.escapeHtml(item.category)}</dd>
                        </div>

                        ${
                            item.note

                                ? `
                                    <div class="wishlist-note">
                                        <dt>Nota</dt>
                                        <dd>${this.escapeHtml(item.note)}</dd>
                                    </div>
                                `

                                : ""
                        }

                    </dl>


                    <div class="wishlist-card-actions">

                        <a
                            href="/foodNutrition?barcode=${encodeURIComponent(item.barcode)}"
                            class="detail-button"
                        >
                            Ver detalle
                        </a>

                        <button
                            type="button"
                            class="remove-button"
                            data-action="remove"
                            data-barcode="${this.escapeHtml(item.barcode)}"
                            aria-label="Eliminar ${this.escapeHtml(item.name)} de la lista de deseos"
                        >
                            Eliminar
                        </button>

                    </div>

                </div>

            </article>

        `;

    }

    // =========================================================
    // RENDER PRIORIDAD
    // =========================================================

    renderPriority(priority) {

        const value =
            Number(priority);


        if (
            Number.isNaN(value) ||
            value < 1 ||
            value > 5
        ) {

            return "Sin prioridad";

        }


        const labels = {

            1: "Muy baja",

            2: "Baja",

            3: "Media",

            4: "Alta",

            5: "Muy alta"

        };


        const stars =
            "★".repeat(value) +
            "☆".repeat(5 - value);


        return `

            <span class="wishlist-priority-stars">
                ${stars}
            </span>

            <span class="wishlist-priority-label">
                ${labels[value]}
            </span>

        `;

    }
    // =========================================================
    // ESCAPAR HTML
    // =========================================================

    escapeHtml(value) {

        return String(value)

            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }

}

export class HistoryComponent {

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
                    class="history-empty"
                    role="status"
                >

                    <h3>
                        Todavía no visitaste ningún producto
                    </h3>

                    <p>
                        Los productos que consultes van a
                        aparecer acá.
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


        this.container.innerHTML = `

            <ul class="history-list">

                ${items
                    .map(item => this.renderItem(item))
                    .join("")
                }

            </ul>

        `;

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

            <li
                class="history-item"
                data-history-item
                data-barcode="${this.escapeHtml(item.barcode)}"
            >

                <a
                    class="history-item-link"
                    href="/foodNutrition?barcode=${encodeURIComponent(item.barcode)}"
                >

                    <div class="history-item-image">

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


                    <div class="history-item-info">

                        <span class="product-brand">
                            ${this.escapeHtml(item.brand)}
                        </span>

                        <span class="history-item-name">
                            ${this.escapeHtml(item.name)}
                        </span>

                        <span class="history-item-date">
                            Visitado el
                            ${this.formatDate(item.visitedAt)}
                        </span>

                    </div>


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
                                    ${this.escapeHtml(
                                        String(grade).toUpperCase()
                                    )}
                                </span>
                            `

                            : ""
                    }

                </a>


                <!-- =========================================
                     BOTÓN ELIMINAR
                     ========================================= -->

                <button
                    type="button"
                    class="history-delete-button"
                    data-delete-history
                    data-barcode="${this.escapeHtml(item.barcode)}"
                    aria-label="Eliminar ${this.escapeHtml(item.name)} del historial"
                    title="Eliminar del historial"
                >

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                    >

                        <path d="M3 6h18"></path>

                        <path d="M8 6V4h8v2"></path>

                        <path d="M19 6l-1 15H6L5 6"></path>

                        <path d="M10 11v6"></path>

                        <path d="M14 11v6"></path>

                    </svg>

                </button>

            </li>

        `;

    }


    // =========================================================
    // FORMATEAR FECHA
    // =========================================================

    formatDate(isoString) {

        try {

            return new Date(isoString)
                .toLocaleString(
                    "es-AR",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

        } catch (error) {

            return "";

        }

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
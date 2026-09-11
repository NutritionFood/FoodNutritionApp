import { StorageService }
    from "../services/storageService.js";

import { HistoryComponent }
    from "../components/historyComponent.js";


// =========================================================
// INICIALIZACIÓN
// =========================================================

document.addEventListener(
    "astro:page-load",
    initializeHistory
);


function initializeHistory() {


    // =========================================================
    // ELEMENTOS DEL DOM
    // =========================================================

    const historyContainer =
        document.querySelector(
            "#history-container"
        );

    const historyCount =
        document.querySelector(
            "#history-count"
        );

    const clearHistoryButton =
        document.querySelector(
            "#clear-history-button"
        );


    if (!historyContainer) {
        return;
    }


    // =========================================================
    // COMPONENT
    // =========================================================

    const historyComponent =
        new HistoryComponent(
            historyContainer
        );


    // =========================================================
    // RENDER INICIAL
    // =========================================================

    renderHistory();


    // =========================================================
    // RENDER HISTORIAL
    // =========================================================

    function renderHistory() {

        const items =
            StorageService.getHistory();


        historyComponent.render(
            items
        );


        // -----------------------------------------------------
        // ACTUALIZAR CONTADOR
        // -----------------------------------------------------

        if (historyCount) {

            historyCount.textContent =
                items.length === 0
                    ? "Sin productos visitados."
                    : `${items.length} producto${
                        items.length === 1 ? "" : "s"
                    } visitado${
                        items.length === 1 ? "" : "s"
                    }`;

        }


        // -----------------------------------------------------
        // MOSTRAR / OCULTAR BOTÓN "VACIAR HISTORIAL"
        // -----------------------------------------------------

        if (clearHistoryButton) {

            clearHistoryButton.hidden =
                items.length === 0;

        }

    }


    // =========================================================
    // VACIAR HISTORIAL
    // =========================================================

    clearHistoryButton?.addEventListener(
        "click",
        () => {
            StorageService.clearHistory();
            renderHistory();
        }
    );


    // =========================================================
    // ELIMINAR ELEMENTO INDIVIDUAL
    // =========================================================
    //
    // Utilizamos delegación de eventos porque los botones
    // son generados dinámicamente por HistoryComponent.
    // =========================================================

    historyContainer.addEventListener(
        "click",
        event => {

            const deleteButton =
                event.target.closest(
                    "[data-delete-history]"
                );


            if (!deleteButton) {
                return;
            }


            // -------------------------------------------------
            // EVITAR QUE EL CLICK CONTINÚE HACIA EL ENLACE
            // -------------------------------------------------

            event.preventDefault();

            event.stopPropagation();


            // -------------------------------------------------
            // OBTENER CÓDIGO DEL PRODUCTO
            // -------------------------------------------------

            const barcode =
                deleteButton.dataset.barcode;


            if (!barcode) {
                return;
            }

            // -------------------------------------------------
            // ELEMENTO VISUAL
            // -------------------------------------------------

            const historyItem =
                deleteButton.closest(
                    "[data-history-item]"
                );


            // -------------------------------------------------
            // ANIMACIÓN DE SALIDA
            // -------------------------------------------------

            historyItem?.classList.add(
                "is-removing"
            );


            // -------------------------------------------------
            // ESPERAR LA ANIMACIÓN
            // -------------------------------------------------

            window.setTimeout(
                () => {

                    StorageService.removeFromHistory(
                        barcode
                    );


                    renderHistory();

                },
                180
            );

        }
    );

}
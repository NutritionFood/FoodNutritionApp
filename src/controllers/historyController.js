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

        console.error(
            "No se encontró #history-container."
        );

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


    function renderHistory() {

        const items =
            StorageService.getHistory();


        historyComponent.render(
            items
        );


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

            const confirmed =
                window.confirm(
                    "¿Vaciar todo el historial de productos visitados?"
                );


            if (!confirmed) {
                return;
            }


            StorageService.clearHistory();

            renderHistory();

        }
    );

}

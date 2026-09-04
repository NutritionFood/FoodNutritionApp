import { StorageService }
    from "../services/storageService.js";

import { WishlistComponent }
    from "../components/wishlistComponent.js";

import { initNav }
    from "../components/navComponent.js";


// =========================================================
// INICIALIZACIÓN
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeWishlist
);


function initializeWishlist() {

    // =========================================================
    // NAVEGACIÓN
    // =========================================================

    initNav("wishlist");


    // =========================================================
    // ELEMENTOS DEL DOM
    // =========================================================

    const wishlistContainer =
        document.querySelector(
            "#wishlist-container"
        );

    const wishlistCount =
        document.querySelector(
            "#wishlist-count"
        );


    if (!wishlistContainer) {

        console.error(
            "No se encontró #wishlist-container."
        );

        return;
    }


    // =========================================================
    // COMPONENT
    // =========================================================

    const wishlistComponent =
        new WishlistComponent(
            wishlistContainer
        );


    // =========================================================
    // RENDER INICIAL
    // =========================================================

    renderWishlist();


    function renderWishlist() {

        const items =
            StorageService.getWishlist();


        wishlistComponent.render(
            items
        );


        if (wishlistCount) {

            wishlistCount.textContent =
                items.length === 0
                    ? "No tenés productos guardados."
                    : `${items.length} producto${
                        items.length === 1 ? "" : "s"
                    } guardado${
                        items.length === 1 ? "" : "s"
                    }`;

        }

    }


    // =========================================================
    // ELIMINAR (delegación de eventos)
    // =========================================================

    wishlistContainer.addEventListener(
        "click",
        event => {

            const removeButton =
                event.target.closest(
                    '[data-action="remove"]'
                );


            if (!removeButton) {
                return;
            }


            const barcode =
                removeButton.dataset.barcode;


            if (!barcode) {
                return;
            }


            StorageService.removeFromWishlist(
                barcode
            );


            renderWishlist();

        }
    );

}

// =========================================================
// STORAGE SERVICE
// =========================================================
//
// Encapsula toda la persistencia en localStorage de la
// aplicación: Lista de deseos (RF5) e Historial (RF6).
//
// Ninguna otra parte de la app debe acceder a localStorage
// directamente: siempre a través de este service.
// =========================================================

export class StorageService {

    static WISHLIST_KEY = "foodNutrition:wishlist";

    static HISTORY_KEY = "foodNutrition:history";

    static HISTORY_MAX_ITEMS = 50;


    // =========================================================
    // ===================  LISTA DE DESEOS  ====================
    // =========================================================

    // =========================================================
    // OBTENER TODOS
    // =========================================================

    static getWishlist() {

        return this.readList(
            this.WISHLIST_KEY
        );

    }


    // =========================================================
    // VERIFICAR SI YA ESTÁ GUARDADO
    // =========================================================

    static isInWishlist(barcode) {

        return this
            .getWishlist()
            .some(
                item => item.barcode === barcode
            );

    }


    // =========================================================
    // AGREGAR
    // =========================================================
    //
    // product: objeto crudo devuelto por la API.
    // preferences: { priority, category, note } (Variante B).
    // =========================================================

    static addToWishlist(product, preferences) {

        const wishlist =
            this.getWishlist();


        const barcode =
            product?.code;


        if (!barcode) {

            throw new Error(
                "El producto no tiene un código de barras válido."
            );

        }


        if (
            wishlist.some(
                item => item.barcode === barcode
            )
        ) {

            throw new Error(
                "Este producto ya está en tu lista de deseos."
            );

        }


        const item = {

            barcode,

            name:
                product.product_name_es ||
                product.product_name ||
                "Producto sin nombre",

            brand:
                product.brands ||
                "Marca no disponible",

            image:
                product.selected_images?.front?.display?.es ||
                product.image_front_url ||
                null,

            nutritionGrade:
                product.nutriscore_grade ||
                product.nutrition_grade_fr ||
                null,

            priority:
                preferences.priority,

            category:
                preferences.category,

            note:
                preferences.note || "",

            addedAt:
                new Date().toISOString()

        };


        wishlist.unshift(item);


        this.writeList(
            this.WISHLIST_KEY,
            wishlist
        );


        return item;

    }


    // =========================================================
    // ELIMINAR
    // =========================================================

    static removeFromWishlist(barcode) {

        const wishlist =
            this.getWishlist()
                .filter(
                    item => item.barcode !== barcode
                );


        this.writeList(
            this.WISHLIST_KEY,
            wishlist
        );

    }


    // =========================================================
    // =====================  HISTORIAL  ========================
    // =========================================================

    // =========================================================
    // OBTENER TODOS (orden cronológico inverso)
    // =========================================================

    static getHistory() {

        return this.readList(
            this.HISTORY_KEY
        );

    }


    // =========================================================
    // REGISTRAR VISITA
    // =========================================================
    //
    // Si el producto ya estaba en el historial, se remueve
    // la entrada anterior y se vuelve a insertar al principio
    // (queda como "más reciente").
    // =========================================================

    static registerVisit(product) {

        const barcode =
            product?.code;


        if (!barcode) {
            return;
        }


        const history =
            this.getHistory()
                .filter(
                    item => item.barcode !== barcode
                );


        const item = {

            barcode,

            name:
                product.product_name_es ||
                product.product_name ||
                "Producto sin nombre",

            brand:
                product.brands ||
                "Marca no disponible",

            image:
                product.selected_images?.front?.display?.es ||
                product.image_front_url ||
                null,

            nutritionGrade:
                product.nutriscore_grade ||
                product.nutrition_grade_fr ||
                null,

            visitedAt:
                new Date().toISOString()

        };


        history.unshift(item);


        // -------------------------------------------------
        // LIMITAR TAMAÑO DEL HISTORIAL
        // -------------------------------------------------

        const trimmedHistory =
            history.slice(
                0,
                this.HISTORY_MAX_ITEMS
            );


        this.writeList(
            this.HISTORY_KEY,
            trimmedHistory
        );

    }


    // =========================================================
    // VACIAR HISTORIAL
    // =========================================================

    static clearHistory() {

        this.writeList(
            this.HISTORY_KEY,
            []
        );

    }


    // =========================================================
    // =====================  HELPERS  ==========================
    // =========================================================

    static readList(key) {

        try {

            const raw =
                localStorage.getItem(key);


            const parsed =
                raw ? JSON.parse(raw) : [];


            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch (error) {

            console.error(
                `No se pudo leer "${key}" de localStorage.`,
                error
            );

            return [];

        }

    }


    static writeList(key, list) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(list)
            );

        } catch (error) {

            console.error(
                `No se pudo guardar "${key}" en localStorage.`,
                error
            );

            throw new Error(
                "No se pudo guardar la información. " +
                "Verificá el espacio disponible del navegador."
            );

        }

    }

}

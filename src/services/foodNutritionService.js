import { API } from "../config/urls.js";

export class FoodNutritionService {

    // =========================================================
    // CONFIGURACIÓN DE REINTENTOS
    // =========================================================

    static MAX_RETRIES = 5;

    static RETRY_DELAY_MS = 1000;

    static REQUEST_TIMEOUT_MS = 20000;

    static FIRST_ATTEMPT_TIMEOUT_MS = 8000;

    static TOTAL_TIMEOUT_MS = 65000;


    // =========================================================
    // CAMPOS UTILIZADOS EN EL LISTADO
    // =========================================================

    static SEARCH_FIELDS = [

        "code",
        "product_name",
        "product_name_es",
        "brands",
        "categories",
        "categories_tags",
        "nutriscore_grade",
        "nutrition_grades",
        "image_front_url",
        "nutriments"

    ].join(",");


    // =========================================================
    // CAMPOS UTILIZADOS EN EL DETALLE
    // =========================================================

    static PRODUCT_FIELDS = [

        "code",
        "product_name",
        "product_name_es",
        "product_name_en",
        "brands",
        "categories",
        "categories_tags",
        "product_quantity",
        "product_quantity_unit",
        "quantity",
        "nutriscore_grade",
        "nutrition_grade_fr",
        "nutrition_grades",
        "nutriments",
        "nutrient_levels",
        "selected_images",
        "image_front_url",
        "image_url",
        "serving_quantity",
        "serving_quantity_unit"

    ].join(",");


    // =========================================================
    // OBTENER PRODUCTO POR CÓDIGO DE BARRAS
    // =========================================================

    static async getProductByBarcode(barcode, options = {}) {

        const cleanBarcode =
            String(barcode).trim();


        // -----------------------------------------------------
        // VALIDACIÓN
        // -----------------------------------------------------

        if (!/^\d{8,14}$/.test(cleanBarcode)) {

            throw new Error(
                "El código de barras debe contener entre 8 y 14 números."
            );

        }


        // -----------------------------------------------------
        // PARÁMETROS
        // -----------------------------------------------------

        const params =
            new URLSearchParams({

                fields:
                    this.PRODUCT_FIELDS

            });


        const url =
            `${API.OPEN_FOOD_FACTS}/product/${encodeURIComponent(
                cleanBarcode
            )}?${params.toString()}`;


        // -----------------------------------------------------
        // REQUEST CON REINTENTOS
        // -----------------------------------------------------

        let data;

        try {
            data = await this.requestWithRetry(url, options);
        } catch (error) {
            if (error?.status === 404) {
                const notFoundError = new Error(
                    "Producto no encontrado. No hay un producto registrado con ese código de barras."
                );
                notFoundError.status = 404;
                throw notFoundError;
            }

            throw error;
        }


        // -----------------------------------------------------
        // PRODUCTO NO ENCONTRADO
        // -----------------------------------------------------

        if (
            data.status !== 1 ||
            !data.product
        ) {

            throw new Error(
                "Producto no encontrado. No hay un producto registrado con ese código de barras."
            );

        }


        return data.product;

    }


    // =========================================================
    // BUSCAR PRODUCTOS CON FILTROS
    // =========================================================

    static async searchProducts(

        category = "",
        brand = "",
        nutritionGrade = "",
        page = 1,
        pageSize = 10,
        options = {}

    ) {


        const params =
            new URLSearchParams();
            params.set("countries_tags_en", "argentina");

        // -----------------------------------------------------
        // CATEGORÍA
        // -----------------------------------------------------

        if (category) {

            params.set(
                "categories_tags_en",
                category
            );

        }


        // -----------------------------------------------------
        // MARCA
        // -----------------------------------------------------

        if (brand) {

            params.set(
                "brands_tags",
                brand
            );

        }


        // -----------------------------------------------------
        // NUTRI-SCORE
        // -----------------------------------------------------

        if (nutritionGrade) {

            params.set(
                "nutrition_grades_tags",
                nutritionGrade
            );

        }


        // -----------------------------------------------------
        // CAMPOS
        // -----------------------------------------------------

        params.set(
            "fields",
            this.SEARCH_FIELDS
        );


        // -----------------------------------------------------
        // PAGINACIÓN
        // -----------------------------------------------------

        params.set(
            "page",
            String(page)
        );


        params.set(
            "page_size",
            String(pageSize)
        );


        // -----------------------------------------------------
        // URL
        // -----------------------------------------------------

        const url =
            `${API.OPEN_FOOD_FACTS}/search?${params.toString()}`;


        // -----------------------------------------------------
        // REQUEST CON REINTENTOS
        // -----------------------------------------------------

        const data = await this.requestWithRetry(url, options);

        if (!Array.isArray(data?.products)) {
            throw new Error("No se pudieron cargar los productos.");
        }

        return data;

    }


    // =========================================================
    // REQUEST HTTP CON REINTENTOS
    // =========================================================

    static async requestWithRetry(url, { signal, onRetry } = {}) {
        const deadline = Date.now() + this.TOTAL_TIMEOUT_MS;
        let lastError;
        let retryAfterMs = 0;

        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
            signal?.throwIfAborted();

            if (attempt > 0) {
                const delay = Math.max(
                    this.RETRY_DELAY_MS * 2 ** (attempt - 1),
                    retryAfterMs
                );
                // No reintentar antes de Retry-After ni prolongar la espera indefinidamente.
                if (Date.now() + delay >= deadline) break;
                onRetry?.({ attempt, maxRetries: this.MAX_RETRIES, delay });
                await this.sleep(delay, signal);
            }

            const remaining = deadline - Date.now();
            if (remaining <= 0) break;
            const controller = new AbortController();
            const cancel = () => controller.abort(signal.reason);
            signal?.addEventListener("abort", cancel, { once: true });
            const timer = setTimeout(
                () => controller.abort(new DOMException("Tiempo de espera agotado", "TimeoutError")),
                Math.min(
                    attempt === 0 ? this.FIRST_ATTEMPT_TIMEOUT_MS : this.REQUEST_TIMEOUT_MS,
                    this.REQUEST_TIMEOUT_MS,
                    remaining
                )
            );
            retryAfterMs = 0;

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    signal: controller.signal
                });

                if (!response.ok) {
                    const error = new Error("El servicio no pudo completar la consulta. Volvé a intentarlo.");
                    error.status = response.status;
                    const retryAfter = response.headers.get("Retry-After");
                    if (retryAfter) {
                        const seconds = Number(retryAfter);
                        retryAfterMs = Math.max(0, Number.isFinite(seconds)
                            ? seconds * 1000
                            : (Date.parse(retryAfter) || Date.now()) - Date.now());
                    }
                    // No esperar un cuerpo de error que también podría quedar pendiente.
                    await response.body?.cancel();
                    throw error;
                }

                // El timeout cubre también la descarga y lectura del cuerpo.
                return await response.json();
            } catch (error) {
                signal?.throwIfAborted();
                if (error?.status && !this.isRetryableStatus(error.status)) throw error;
                lastError = controller.signal.aborted ? controller.signal.reason : error;
            } finally {
                clearTimeout(timer);
                signal?.removeEventListener("abort", cancel);
            }
        }

        const error = new Error(
            lastError?.status === 429
                ? "El servicio recibió demasiadas consultas. Esperá un momento y volvé a buscar."
                : "El servicio está tardando demasiado o no está disponible. Volvé a intentar en unos instantes.",
            { cause: lastError }
        );
        error.status = lastError?.status;
        throw error;
    }


    // =========================================================
    // DETERMINAR SI EL STATUS HTTP ES REINTENTABLE
    // =========================================================

    static isRetryableStatus(
        status
    ) {

        return (

            status === 408 ||
            status === 425 ||
            status === 429 ||
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504

        );

    }


    // =========================================================
    // PARSEAR JSON
    // =========================================================

    static async parseJson(
        response
    ) {

        try {

            return await response.json();

        } catch (error) {

            throw new Error(
                "La API devolvió una respuesta que no es JSON válida."
            );

        }

    }


    // =========================================================
    // INTENTAR PARSEAR JSON
    // =========================================================

    static async tryParseJson(
        response
    ) {

        try {

            return await response.json();

        } catch (error) {

            return null;

        }

    }


    // =========================================================
    // ESPERA
    // =========================================================

    static sleep(milliseconds, signal) {
        return new Promise((resolve, reject) => {
            signal?.throwIfAborted();
            const cancel = () => {
                clearTimeout(timer);
                reject(signal.reason);
            };
            const timer = setTimeout(() => {
                signal?.removeEventListener("abort", cancel);
                resolve();
            }, milliseconds);
            signal?.addEventListener("abort", cancel, { once: true });
        });
    }

}

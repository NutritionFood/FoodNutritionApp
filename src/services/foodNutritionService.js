import { API } from "../config/urls.js";

export class FoodNutritionService {

    // 3 reintentos + 1 intento inicial 
    static MAX_RETRIES = 3;

    // Espera corta entre solicitudes
    static RETRY_DELAY_MS = 400;

    // Tiempo máximo permitido para cada solicitud individual
    static REQUEST_TIMEOUT_MS = 5000;

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
    /*
     * =========================================================
     * OBTENER PRODUCTO POR CÓDIGO DE BARRAS
     * =========================================================
     */
    static async getProductByBarcode(barcode,options = {}) {

        const normalizedBarcode =
            String(barcode ?? "").trim();

        if (!/^\d{8,14}$/.test(normalizedBarcode)) {

            throw new Error("El código de barras debe contener entre 8 y 14 números.");
        }

        const url =
            `${API.OPEN_FOOD_FACTS}/product/` +
            `${encodeURIComponent(normalizedBarcode)}` +
            `?fields=${this.PRODUCT_FIELDS}`;

        try {

            const data = await this.requestWithRetry(url, options);
            /*
             * Puede devolver HTTP 200
             * pero indicar que el producto no existe
             */
            if (data?.status !== 1 || !data?.product) {

                throw new Error("No se encontró un producto asociado a ese código de barras.");
            }

            return data.product;

        } catch (error) {

            if (
                error?.status === 404
            ) {

                throw new Error("No se encontró un producto asociado a ese código de barras.");
            }

            throw error;
        }
    }
    /*
     * =========================================================
     * OBTENER PRODUCTO POR FILTROS
     * =========================================================
     */
    static async searchProducts(
        category = "",
        brand = "",
        nutritionGrade = "",
        page = 1,
        pageSize = 10,
        options = {}
    ) {

        const params = new URLSearchParams();

        /*
         * País de búsqueda
         */
        params.set("countries_tags_en", "argentina");

        /*
         * Filtro por categoría
         */
        if (category) {

            params.set("categories_tags_en", category);
        }

        /*
         * Filtro por marca
         */
        if (brand) {

            params.set("brands_tags", brand);
        }

        /*
         * Filtro por Nutri-Score
         */
        if (nutritionGrade) {

            params.set("nutrition_grades_tags", nutritionGrade);
        }

        /*
         * Campos solicitados
         */
        params.set("fields", this.SEARCH_FIELDS);

        /*
         * Paginación
         */
        params.set("page", page);

        params.set("page_size", pageSize);

        const url =`${API.OPEN_FOOD_FACTS}/search?${params.toString()}`;

        const data =await this.requestWithRetry(url, options);

        /*
         * Validación de la respuesta
         */
        if (!Array.isArray( data?.products)
        ) {
            throw new Error(
                "La respuesta de Open Food Facts " +
                "no contiene una lista válida de productos."
            );
        }
        return data;
    }

    /*
     * =========================================================
     * REQUEST CON REINTENTOS
     * =========================================================
     */

    static async requestWithRetry(url,{signal, onRetry} = {}
    ) {

        let lastError = null;
    
        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {

            /*
             * Si el controller canceló la consulta,
             * no continuamos con los reintentos.
             */
            if ( signal?.aborted) {

                throw new DOMException(
                    "La solicitud fue cancelada.",
                    "AbortError"
                );
            }

            if ( attempt > 0) {

                await this.sleep(this.RETRY_DELAY_MS, signal);
            }

            const controller = new AbortController();

            const timeoutId = setTimeout(() => {

                        controller.abort();
                    },
                    this.REQUEST_TIMEOUT_MS
                );

            const abortHandler =() => {

                    controller.abort();
                };

            signal?.addEventListener("abort", abortHandler,{once: true});

            try {

                const response = await fetch(url,
                        {
                            method: "GET",
                            headers: {
                                Accept: "application/json"
                            },
                            signal: controller.signal
                        }
                    );

                /*
                 * La solicitud terminó.
                 * Eliminamos el timeout.
                 */
                clearTimeout(timeoutId);

                signal?.removeEventListener("abort", abortHandler);

                if (response.ok) {

                    return await response.json();
                }

                const error =new Error(`Error HTTP ${response.status}`);

                error.status = response.status;

                const retryAfter = response.headers.get("Retry-After");

                if ( retryAfter) {

                    error.retryAfter =this.getRetryAfterMilliseconds(retryAfter);
                }

                if ( !this.isRetryableStatus(response.status)) {

                    throw error;
                }

                lastError = error;

                if (attempt < this.MAX_RETRIES) {

                    onRetry?.({
                        attempt: attempt + 1,
                        maxRetries: this.MAX_RETRIES,
                        error
                    });

                    console.warn(
                        "Open Food Facts respondió " +
                        `${response.status}. ` +
                        `Reintento ${attempt + 1}/` +
                        `${this.MAX_RETRIES}.`
                    );
                    continue;
                }

                throw error;

            } catch (error) {

                clearTimeout(timeoutId);

                signal?.removeEventListener("abort", abortHandler);

                if (signal?.aborted) {

                    throw new DOMException(
                        "La solicitud fue cancelada.",
                        "AbortError"
                    );
                }

                const isTimeout = error?.name === "AbortError";

                const isNetworkError = !error?.status && !isTimeout;

                const isRetryable = isTimeout || isNetworkError || this.isRetryableStatus(error?.status);

                if (!isRetryable) {

                    throw error;
                }

                lastError = error;

                if ( attempt < this.MAX_RETRIES) {

                    onRetry?.({
                        attempt: attempt + 1,
                        maxRetries: this.MAX_RETRIES,
                        error
                    });

                    console.warn(
                        "Error al consultar Open Food Facts. " +
                        `Reintento ${attempt + 1}/` +
                        `${this.MAX_RETRIES}.`,
                        error
                    );
                    continue;
                }

                break;
            }
        }

        const finalError =
            new Error("No se pudo obtener información de " +
                "Open Food Facts. Intentá nuevamente."
            );

        if (
            lastError?.status
        ) {

            finalError.status = lastError.status;
        }

        finalError.cause = lastError;

        throw finalError;
    }

    /*
     * =========================================================
     * ESTADOS HTTP REINTENTABLES
     * =========================================================
     */

    static isRetryableStatus(status) {

        return [ 408, 425, 429, 500, 502, 503, 504].includes(status);
    }

    /*
     * =========================================================
     * CONVERTIR RETRY-AFTER A MILISEGUNDOS
     * =========================================================
     */

    static getRetryAfterMilliseconds(retryAfter) {

        const numericValue =Number(retryAfter);

        if (Number.isFinite(numericValue)) {

            return Math.max(0, numericValue * 1000);
        }

        const retryDate = Date.parse(retryAfter);

        if (Number.isFinite(retryDate)) {

            return Math.max(0, retryDate - Date.now());
        }
        return 0;
    }

    static sleep(milliseconds, signal) {

        if (signal?.aborted) {

            return Promise.reject(
                new DOMException(
                    "La solicitud fue cancelada.",
                    "AbortError"
                )
            );
        }

        return new Promise((resolve, reject) => {

                let timeoutId;

                const abortHandler = () => {

                        clearTimeout(timeoutId);

                        signal?.removeEventListener("abort", abortHandler);

                        reject(
                            new DOMException(
                                "La solicitud fue cancelada.",
                                "AbortError"
                            )
                        );
                    };

                timeoutId =
                    setTimeout(
                        () => {

                            signal?.removeEventListener(
                                "abort",
                                abortHandler
                            );
                            resolve();
                        },
                        milliseconds
                    );

                signal?.addEventListener("abort", abortHandler,
                    {
                        once: true
                    }
                );
            }
        );
    }

}
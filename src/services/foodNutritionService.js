import { API } from "../config/urls.js";

export class FoodNutritionService {

    // Espera progresiva para no saturar la API durante una falla prolongada.
    static RETRY_DELAY_MS = 1000;
    static MAX_RETRY_DELAY_MS = 30000;

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
    static async getProductByBarcode(barcode, options = {}) {

        const normalizedBarcode =
            String(barcode ?? "").trim();

        if (!/^\d{8,14}$/.test(normalizedBarcode)) {

            throw new Error(
                "El código de barras debe contener entre 8 y 14 números."
            );
        }

        const url =
            `${API.OPEN_FOOD_FACTS}/product/` +
            `${encodeURIComponent(normalizedBarcode)}` +
            `?fields=${this.PRODUCT_FIELDS}`;

        try {

            const data =
                await this.requestWithRetry(url, options);

            /*
             * Puede devolver HTTP 200
             * pero indicar que el producto no existe
             */
            if (data?.status !== 1 || !data?.product) {

                throw new Error(
                    "No se encontró un producto asociado a ese código de barras."
                );
            }

            return data.product;

        } catch (error) {

            if (error?.status === 404) {

                throw new Error(
                    "No se encontró un producto asociado a ese código de barras."
                );
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
        params.set(
            "countries_tags_en",
            "argentina"
        );

        /*
         * Filtro por categoría
         */
        if (category) {

            params.set(
                "categories_tags_en",
                category
            );
        }

        /*
         * Filtro por marca
         */
        if (brand) {

            // La API filtra por la etiqueta normalizada,
            // no por el texto visible.
            const brandTag =
                brand.trim()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/\s+/g, "-");

            params.set(
                "brands_tags",
                brandTag
            );
        }

        /*
         * Filtro por Nutri-Score
         */
        if (nutritionGrade) {

            params.set(
                "nutrition_grades_tags",
                nutritionGrade
            );
        }

        /*
         * Campos solicitados
         */
        params.set(
            "fields",
            this.SEARCH_FIELDS
        );

        /*
         * Paginación
         */
        params.set(
            "page",
            page
        );

        params.set(
            "page_size",
            pageSize
        );

        const url =
            `${API.OPEN_FOOD_FACTS}/search?${params.toString()}`;

        const data =
            await this.requestWithRetry(
                url,
                options
            );

        /*
         * Validación de la respuesta
         */
        if (!Array.isArray(data?.products)) {

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
    static async requestWithRetry(
        url,
        { signal, onRetry } = {}
    ) {

        let attempt = 0;

        while (true) {

            /*
             * Permite cancelar una solicitud/reintento
             * desde el controlador.
             */
            if (signal?.aborted) {

                throw new DOMException(
                    "La solicitud fue cancelada.",
                    "AbortError"
                );
            }

            try {

                /*
                 * No existe timeout.
                 *
                 * La solicitud puede permanecer esperando
                 * indefinidamente hasta recibir una respuesta,
                 * salvo que el AbortSignal sea cancelado.
                 */
                const response =
                    await fetch(url, {
                        method: "GET",
                        headers: {
                            Accept: "application/json"
                        },
                        signal
                    });

                /*
                 * Respuesta correcta
                 */
                if (response.ok) {

                    return await response.json();
                }

                /*
                 * Error HTTP
                 */
                const error =
                    new Error(
                        `Error HTTP ${response.status}`
                    );

                error.status =
                    response.status;

                /*
                 * Respetar Retry-After cuando la API lo envía.
                 */
                const retryAfter =
                    response.headers.get("Retry-After");

                if (retryAfter) {

                    error.retryAfter =
                        this.getRetryAfterMilliseconds(
                            retryAfter
                        );
                }

                throw error;

            } catch (error) {

                /*
                 * Si el usuario/controlador canceló
                 * la solicitud, no reintentamos.
                 */
                if (signal?.aborted) {

                    throw new DOMException(
                        "La solicitud fue cancelada.",
                        "AbortError"
                    );
                }

                /*
                 * Los errores HTTP que no sean reintentables
                 * se propagan inmediatamente.
                 */
                if (
                    error?.status &&
                    !this.isRetryableStatus(
                        error.status
                    )
                ) {

                    throw error;
                }

                /*
                 * Incrementar contador de intentos.
                 */
                attempt++;

                /*
                 * Backoff progresivo:
                 *
                 * 1s
                 * 2s
                 * 4s
                 * 8s
                 * 16s
                 * 30s
                 * 30s
                 * ...
                 *
                 * Nunca supera MAX_RETRY_DELAY_MS.
                 */
                const delay =
                    Math.max(
                        Math.min(
                            this.RETRY_DELAY_MS *
                            2 **
                            Math.min(
                                attempt - 1,
                                10
                            ),
                            this.MAX_RETRY_DELAY_MS
                        ),
                        error?.retryAfter ?? 0
                    );

                /*
                 * Avisar al controlador que hubo
                 * un nuevo intento.
                 */
                onRetry?.({
                    attempt,
                    error,
                    delay
                });

                console.warn(
                    `Error al consultar Open Food Facts. ` +
                    `Reintento ${attempt}.`,
                    error
                );

                /*
                 * Esperar antes del siguiente intento.
                 *
                 * Este sleep también puede cancelarse
                 * mediante AbortSignal.
                 */
                await this.sleep(
                    delay,
                    signal
                );
            }
        }
    }

    /*
     * =========================================================
     * ESTADOS HTTP REINTENTABLES
     * =========================================================
     */
    static isRetryableStatus(status) {

        return [
            408,
            425,
            429,
            500,
            502,
            503,
            504
        ].includes(status);
    }

    /*
     * =========================================================
     * CONVERTIR RETRY-AFTER A MILISEGUNDOS
     * =========================================================
     */
    static getRetryAfterMilliseconds(
        retryAfter
    ) {

        const numericValue =
            Number(retryAfter);

        /*
         * Retry-After expresado en segundos.
         */
        if (Number.isFinite(numericValue)) {

            return Math.max(
                0,
                numericValue * 1000
            );
        }

        /*
         * Retry-After expresado como fecha HTTP.
         */
        const retryDate =
            Date.parse(retryAfter);

        if (Number.isFinite(retryDate)) {

            return Math.max(
                0,
                retryDate - Date.now()
            );
        }

        return 0;
    }

    /*
     * =========================================================
     * ESPERA CANCELABLE
     * =========================================================
     */
    static sleep(
        milliseconds,
        signal
    ) {

        /*
         * Si ya fue cancelada antes de comenzar
         * la espera, rechazamos inmediatamente.
         */
        if (signal?.aborted) {

            return Promise.reject(
                new DOMException(
                    "La solicitud fue cancelada.",
                    "AbortError"
                )
            );
        }

        return new Promise(
            (resolve, reject) => {

                let timeoutId;

                const abortHandler =
                    () => {

                        clearTimeout(
                            timeoutId
                        );

                        signal?.removeEventListener(
                            "abort",
                            abortHandler
                        );

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

                signal?.addEventListener(
                    "abort",
                    abortHandler,
                    {
                        once: true
                    }
                );
            }
        );
    }

}
import { API } from "../config/urls.js";


export class FoodNutritionService {


    // =========================================================
    // CONFIGURACIÓN DE REINTENTOS
    // =========================================================

    static MAX_RETRIES = 3;

    static RETRY_DELAY_MS = 1000;


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

    static async getProductByBarcode(barcode) {

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

        const data =
            await this.requestWithRetry(
                url
            );


        // -----------------------------------------------------
        // PRODUCTO NO ENCONTRADO
        // -----------------------------------------------------

        if (
            data.status !== 1 ||
            !data.product
        ) {

            throw new Error(
                "No se encontró ningún producto con ese código de barras."
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
        pageSize = 10

    ) {


        const params =
            new URLSearchParams();


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

        return await this.requestWithRetry(
            url
        );

    }


    // =========================================================
    // REQUEST HTTP CON REINTENTOS
    // =========================================================

    static async requestWithRetry(
        url
    ) {

        let lastError;


        for (
            let attempt = 0;
            attempt <= this.MAX_RETRIES;
            attempt++
        ) {


            try {

                // -------------------------------------------------
                // ESPERA ANTES DE LOS REINTENTOS
                // -------------------------------------------------

                if (attempt > 0) {

                    const delay =
                        this.RETRY_DELAY_MS *
                        Math.pow(
                            2,
                            attempt - 1
                        );


                    await this.sleep(
                        delay
                    );

                }


                // -------------------------------------------------
                // FETCH
                // -------------------------------------------------

                const response =
                    await fetch(
                        url,
                        {
                            method: "GET",

                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                // -------------------------------------------------
                // RESPUESTA EXITOSA
                // -------------------------------------------------

                if (response.ok) {

                    return await this.parseJson(
                        response
                    );

                }


                // -------------------------------------------------
                // ERROR HTTP
                // -------------------------------------------------

                const data =
                    await this.tryParseJson(
                        response
                    );


                const error =
                    new Error(
                        data?.message ??
                        data?.Message ??
                        `Error HTTP ${response.status}`
                    );


                error.status =
                    response.status;


                // -------------------------------------------------
                // DETERMINAR SI SE PUEDE REINTENTAR
                // -------------------------------------------------

                if (
                    !this.isRetryableStatus(
                        response.status
                    )
                ) {

                    throw error;

                }


                lastError =
                    error;


                console.warn(
                    `Open Food Facts respondió HTTP ${response.status}. ` +
                    `Reintento ${attempt + 1} de ${this.MAX_RETRIES}.`
                );


            } catch (error) {


                // -------------------------------------------------
                // ERRORES DE VALIDACIÓN / HTTP NO REINTENTABLES
                // -------------------------------------------------

                if (
                    error?.status &&
                    !this.isRetryableStatus(
                        error.status
                    )
                ) {

                    throw error;

                }


                // -------------------------------------------------
                // ERROR DE RED / TIMEOUT
                // -------------------------------------------------

                lastError =
                    error;


                console.warn(
                    `Error de conexión con Open Food Facts. ` +
                    `Reintento ${attempt + 1} de ${this.MAX_RETRIES}.`,
                    error
                );

            }

        }


        // =========================================================
        // TODOS LOS INTENTOS FALLARON
        // =========================================================

        console.error(
            "Open Food Facts no respondió correctamente después " +
            "de todos los intentos.",
            lastError
        );


        throw new Error(
            "No se pudo obtener información de Open Food Facts. " +
            "El servicio no está disponible en este momento."
        );

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

    static sleep(
        milliseconds
    ) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );

    }

}
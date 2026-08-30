import { API } from "../config/urls.js";


export class FoodNutritionService {


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
    // BUSCAR POR CÓDIGO DE BARRAS
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

                fields: this.PRODUCT_FIELDS

            });


        let response;


        // -----------------------------------------------------
        // REQUEST
        // -----------------------------------------------------

        try {

            response = await fetch(

                `${API.OPEN_FOOD_FACTS}/product/${encodeURIComponent(cleanBarcode)}?${params.toString()}`,

                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    }
                }

            );

        } catch (error) {

            throw new Error(
                "No se pudo establecer conexión con Open Food Facts."
            );

        }


        // -----------------------------------------------------
        // JSON
        // -----------------------------------------------------

        let data;


        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "La API devolvió una respuesta que no es JSON válida."
            );

        }


        // -----------------------------------------------------
        // ERROR HTTP
        // -----------------------------------------------------

        if (!response.ok) {

            throw new Error(

                data.message ??
                data.Message ??
                `Error HTTP ${response.status}`

            );

        }


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


        return await this.search(params);

    }


    // =========================================================
    // SEARCH GENERAL
    // =========================================================

    static async search(params) {


        let response;


        // -----------------------------------------------------
        // REQUEST
        // -----------------------------------------------------

        try {

            response = await fetch(

                `${API.OPEN_FOOD_FACTS}/search?${params.toString()}`,

                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    }
                }

            );

        } catch (error) {

            throw new Error(
                "No se pudo establecer conexión con Open Food Facts."
            );

        }


        // -----------------------------------------------------
        // JSON
        // -----------------------------------------------------

        let data;


        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "La API devolvió una respuesta que no es JSON válida."
            );

        }


        // -----------------------------------------------------
        // ERROR HTTP
        // -----------------------------------------------------

        if (!response.ok) {

            throw new Error(

                data.message ??
                data.Message ??
                `Error HTTP ${response.status}`

            );

        }


        return data;

    }

}
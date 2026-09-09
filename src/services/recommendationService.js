import { FoodNutritionService }
    from "./foodNutritionService.js";

import { StorageService }
    from "./storageService.js";


// =========================================================
// RECOMMENDATION SERVICE
// =========================================================
//
// Genera los productos destacados de la Home.
//
// Regla:
//
// 1. Si el usuario no tiene historial:
//    - productos con Nutri-Score A o B
//    - información nutricional disponible
//    - imagen disponible
//
// 2. Si el usuario tiene historial:
//    - detectar las categorías que más visitó
//    - buscar productos de esas categorías
//    - priorizar Nutri-Score A y B
//
// =========================================================

export class RecommendationService {


    // =========================================================
    // CONFIGURACIÓN
    // =========================================================

    static DEFAULT_COUNT = 6;

    static HISTORY_CATEGORIES_LIMIT = 2;

    static SEARCH_PAGE_SIZE = 20;


    // =========================================================
    // CATEGORÍAS UTILIZADAS POR LA APLICACIÓN
    // =========================================================
    //
    // Se utilizan únicamente categorías que ya existen
    // como filtros en la aplicación.
    //
    // El orden prioriza categorías específicas sobre
    // categorías generales.
    // =========================================================

    static CATEGORY_PRIORITY = [

        "yogurts",

        "cheeses",

        "chips",

        "candies",

        "pizzas",

        "sauces",

        "fruit-juices",

        "sodas",

        "waters",

        "breakfast-cereals",

        "pastas",

        "breads",

        "meats",

        "fishes",

        "fruits",

        "vegetables",

        "legumes",

        "prepared-meals",

        "dairy-products",

        "snacks",

        "beverages"

    ];


    // =========================================================
    // OBTENER PRODUCTOS DESTACADOS
    // =========================================================

    static async getFeaturedProducts(
        count = this.DEFAULT_COUNT
    ) {

        // -----------------------------------------------------
        // OBTENER HISTORIAL
        // -----------------------------------------------------

        const history =
            StorageService.getHistory();


        // -----------------------------------------------------
        // DETECTAR CATEGORÍAS PREFERIDAS
        // -----------------------------------------------------

        const preferredCategories =
            this.getPreferredCategories(
                history
            );


        // -----------------------------------------------------
        // USUARIO CON HISTORIAL
        // -----------------------------------------------------

        if (
            preferredCategories.length > 0
        ) {

            const personalizedProducts =
                await this.getPersonalizedProducts(
                    preferredCategories,
                    count
                );


            if (
                personalizedProducts.length >= count
            ) {

                return personalizedProducts.slice(
                    0,
                    count
                );

            }


            // -------------------------------------------------
            // Si no conseguimos suficientes productos
            // personalizados, completamos con productos
            // generales.
            // -------------------------------------------------

            const generalProducts =
                await this.getGeneralFeaturedProducts(
                    count
                );


            return this.mergeProducts(
                personalizedProducts,
                generalProducts,
                count
            );

        }


        // -----------------------------------------------------
        // USUARIO SIN HISTORIAL
        // -----------------------------------------------------

        return await this.getGeneralFeaturedProducts(
            count
        );

    }


    // =========================================================
    // OBTENER CATEGORÍAS PREFERIDAS
    // =========================================================
    //
    // Analiza los productos visitados y determina qué
    // categorías aparecen con mayor frecuencia.
    //
    // Cada producto aporta como máximo UNA categoría para
    // evitar que un mismo producto cuente varias veces por
    // tener categorías padre e hija.
    // =========================================================

    static getPreferredCategories(
        history = []
    ) {

        if (
            !Array.isArray(history) ||
            history.length === 0
        ) {

            return [];

        }


        const categoryFrequency =
            new Map();


        history.forEach(
            item => {

                const category =
                    this.getBestCategory(
                        item
                    );


                if (!category) {
                    return;
                }


                const currentCount =
                    categoryFrequency.get(
                        category
                    ) || 0;


                categoryFrequency.set(
                    category,
                    currentCount + 1
                );

            }
        );


        return Array.from(
            categoryFrequency.entries()
        )

            .sort(
                (
                    [categoryA, countA],
                    [categoryB, countB]
                ) => {

                    if (
                        countB !== countA
                    ) {

                        return countB - countA;

                    }


                    return (
                        this.getCategoryPriority(
                            categoryA
                        ) -
                        this.getCategoryPriority(
                            categoryB
                        )
                    );

                }
            )

            .slice(
                0,
                this.HISTORY_CATEGORIES_LIMIT
            )

            .map(
                ([category]) =>
                    category
            );

    }


    // =========================================================
    // DETERMINAR LA MEJOR CATEGORÍA DE UN PRODUCTO
    // =========================================================

    static getBestCategory(
        item
    ) {

        const categories =
            Array.isArray(
                item?.categoriesTags
            )
                ? item.categoriesTags
                : [];


        const normalizedCategories =
            categories

                .map(
                    category =>
                        this.normalizeCategory(
                            category
                        )
                )

                .filter(Boolean);


        // -----------------------------------------------------
        // Buscar una categoría conocida siguiendo el orden
        // de prioridad.
        // -----------------------------------------------------

        for (
            const preferredCategory
            of this.CATEGORY_PRIORITY
        ) {

            if (
                normalizedCategories.includes(
                    preferredCategory
                )
            ) {

                return preferredCategory;

            }

        }


        // -----------------------------------------------------
        // Compatibilidad con entradas antiguas del historial.
        //
        // Las entradas creadas antes de esta implementación
        // pueden no tener categoriesTags.
        // -----------------------------------------------------

        if (
            item?.category
        ) {

            const normalizedCategory =
                this.normalizeCategory(
                    item.category
                );


            if (
                this.CATEGORY_PRIORITY.includes(
                    normalizedCategory
                )
            ) {

                return normalizedCategory;

            }

        }


        return null;

    }


    // =========================================================
    // NORMALIZAR CATEGORÍA
    // =========================================================

    static normalizeCategory(
        category
    ) {

        if (
            !category
        ) {

            return null;

        }


        let normalized =
            String(category)
                .trim()
                .toLowerCase();


        // -----------------------------------------------------
        // Ejemplo:
        //
        // en:yogurts
        //      ↓
        // yogurts
        // -----------------------------------------------------

        if (
            normalized.includes(":")
        ) {

            normalized =
                normalized.split(":").pop();

        }


        // -----------------------------------------------------
        // Las categorías pueden venir separadas por espacios
        // o caracteres especiales.
        // -----------------------------------------------------

        normalized =
            normalized
                .replaceAll(
                    " ",
                    "-"
                );


        return normalized;

    }


    // =========================================================
    // OBTENER PRIORIDAD DE CATEGORÍA
    // =========================================================

    static getCategoryPriority(
        category
    ) {

        const index =
            this.CATEGORY_PRIORITY.indexOf(
                category
            );


        return index === -1
            ? Number.MAX_SAFE_INTEGER
            : index;

    }


    // =========================================================
    // PRODUCTOS PERSONALIZADOS
    // =========================================================

    static async getPersonalizedProducts(
        categories,
        count
    ) {

        const requests = [];


        // -----------------------------------------------------
        // Por cada categoría buscamos productos A y B.
        // -----------------------------------------------------

        categories.forEach(
            category => {

                requests.push(
                    this.searchByCategoryAndGrade(
                        category,
                        "a"
                    )
                );


                requests.push(
                    this.searchByCategoryAndGrade(
                        category,
                        "b"
                    )
                );

            }
        );


        const results =
            await Promise.allSettled(
                requests
            );


        const products = [];


        results.forEach(
            result => {

                if (
                    result.status !== "fulfilled"
                ) {

                    return;

                }


                products.push(
                    ...result.value
                );

            }
        );


        return this.prepareProducts(
            products
        ).slice(
            0,
            count
        );

    }


    // =========================================================
    // BUSCAR POR CATEGORÍA Y NUTRI-SCORE
    // =========================================================

    static async searchByCategoryAndGrade(
        category,
        grade
    ) {

        try {

            const data =
                await FoodNutritionService.searchProducts(
                    category,
                    "",
                    grade,
                    1,
                    this.SEARCH_PAGE_SIZE
                );


            return Array.isArray(
                data?.products
            )
                ? data.products
                : [];

        } catch (error) {

            console.error(
                `No se pudieron obtener recomendaciones para ${category} (${grade}).`,
                error
            );


            return [];

        }

    }


    // =========================================================
    // PRODUCTOS GENERALES
    // =========================================================
    //
    // Para usuarios sin historial:
    //
    // Nutri-Score A
    // +
    // Nutri-Score B
    //
    // Luego se filtran los productos que tengan la
    // información mínima necesaria para mostrarlos.
    // =========================================================

    static async getGeneralFeaturedProducts(
        count
    ) {

        const requests = [

            this.searchByGrade("a"),

            this.searchByGrade("b")

        ];


        const results =
            await Promise.allSettled(
                requests
            );


        const products = [];


        results.forEach(
            result => {

                if (
                    result.status !== "fulfilled"
                ) {

                    return;

                }


                products.push(
                    ...result.value
                );

            }
        );


        const preparedProducts =
            this.prepareProducts(
                products
            );


        if (
            preparedProducts.length === 0
        ) {

            throw new Error(
                "No fue posible obtener productos destacados."
            );

        }


        return preparedProducts.slice(
            0,
            count
        );

    }


    // =========================================================
    // BUSCAR POR NUTRI-SCORE
    // =========================================================

    static async searchByGrade(
        grade
    ) {

        try {

            const data =
                await FoodNutritionService.searchProducts(
                    "",
                    "",
                    grade,
                    1,
                    this.SEARCH_PAGE_SIZE
                );


            return Array.isArray(
                data?.products
            )
                ? data.products
                : [];

        } catch (error) {

            console.error(
                `No se pudieron obtener productos con Nutri-Score ${grade}.`,
                error
            );


            return [];

        }

    }


    // =========================================================
    // PREPARAR PRODUCTOS
    // =========================================================
    //
    // Solamente consideramos productos que tengan:
    //
    // - código
    // - nombre
    // - imagen
    // - Nutri-Score A/B
    // - información nutricional
    // =========================================================

    static prepareProducts(
        products = []
    ) {

        if (
            !Array.isArray(products)
        ) {

            return [];

        }


        const validProducts =
            products.filter(
                product =>
                    this.isValidFeaturedProduct(
                        product
                    )
            );


        // -----------------------------------------------------
        // Eliminar productos repetidos.
        // -----------------------------------------------------

        return this.removeDuplicates(
            validProducts
        );

    }


    // =========================================================
    // VALIDAR PRODUCTO DESTACADO
    // =========================================================

    static isValidFeaturedProduct(
        product
    ) {

        if (!product) {
            return false;
        }


        const barcode =
            String(
                product.code || ""
            ).trim();


        const name =
            String(
                product.product_name_es ||
                product.product_name ||
                ""
            ).trim();


        const image =
            String(
                product.image_front_url ||
                ""
            ).trim();


        const grade =
            String(
                product.nutriscore_grade ||
                product.nutrition_grades ||
                ""
            )
                .trim()
                .toLowerCase();


        const nutriments =
            product.nutriments;


        const hasNutrition =
            nutriments &&
            typeof nutriments === "object" &&
            (
                nutriments["energy-kcal_100g"] !== undefined ||
                nutriments["proteins_100g"] !== undefined ||
                nutriments["sugars_100g"] !== undefined
            );


        return Boolean(

            barcode &&

            name &&

            image &&

            (
                grade === "a" ||
                grade === "b"
            ) &&

            hasNutrition

        );

    }


    // =========================================================
    // COMBINAR PRODUCTOS
    // =========================================================

    static mergeProducts(
        firstProducts = [],
        secondProducts = [],
        count = this.DEFAULT_COUNT
    ) {

        return this.removeDuplicates(
            [
                ...firstProducts,
                ...secondProducts
            ]
        ).slice(
            0,
            count
        );

    }


    // =========================================================
    // ELIMINAR DUPLICADOS
    // =========================================================

    static removeDuplicates(
        products = []
    ) {

        const productsByBarcode =
            new Map();


        products.forEach(
            product => {

                const barcode =
                    product?.code;


                if (
                    !barcode
                ) {

                    return;

                }


                if (
                    !productsByBarcode.has(
                        barcode
                    )
                ) {

                    productsByBarcode.set(
                        barcode,
                        product
                    );

                }

            }
        );


        return Array.from(
            productsByBarcode.values()
        );

    }

}
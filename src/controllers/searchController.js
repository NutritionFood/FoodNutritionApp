import { FoodNutritionService } from "../services/foodNutritionService.js";
import { BarcodeScannerService } from "../services/barcodeScannerService.js";
import { SearchComponent } from "../components/searchComponent.js";

document.addEventListener(
    "astro:page-load",
    initializeSearch
);


function initializeSearch() {

    const searchPage = document.querySelector("#filters-form");

    if (!searchPage) {
        return;
    }
    /*
     * ==========================================
     * ELEMENTOS DEL DOM
     * ==========================================
     */

    const barcodeForm =
        document.querySelector("#barcode-form");

    const filtersForm =
        document.querySelector("#filters-form");

    const barcodeInput =
        document.querySelector("#barcode");

    const barcodeMethodInputs =
        document.querySelectorAll(
            'input[name="barcode-method"]'
        );

    const categoryInput =
        document.querySelector("#category");

    const brandInput =
        document.querySelector("#brand");

    const nutritionGradeInput =
        document.querySelector("#nutrition-grade");

    const resultsContainer =
        document.querySelector("#results-container");

    const resultsCount =
        document.querySelector("#results-count");

    const searchStatus =
        document.querySelector("#search-status");

    const pagination =
        document.querySelector("#pagination");

    const resultsSection =
        document.querySelector("#results-section");

    const cameraSearch =
        document.querySelector("#camera-search");

    const cameraStatus =
        document.querySelector("#camera-status");

    const cameraContainer =
        document.querySelector("#camera-container");

    const barcodeVideo =
        document.querySelector("#barcode-video");

    const scanBarcodeButton =
        document.querySelector("#scan-barcode-button");

    const stopCameraButton =
        document.querySelector("#stop-camera-button");

    /*
     * Botón opcional para volver al
     * ingreso manual.
     */
    const useManualButton =
        document.querySelector("#use-manual-button");


    /*
     * ==========================================
     * VALIDACIÓN DE ELEMENTOS
     * ==========================================
     */

    if (
        !barcodeForm ||
        !barcodeInput ||
        !barcodeMethodInputs.length ||
        !filtersForm ||
        !categoryInput ||
        !brandInput ||
        !nutritionGradeInput ||
        !resultsContainer ||
        !resultsCount ||
        !searchStatus ||
        !pagination ||
        !resultsSection ||
        !cameraSearch ||
        !cameraStatus ||
        !cameraContainer ||
        !barcodeVideo ||
        !scanBarcodeButton ||
        !stopCameraButton
    ) {

        console.error(
            "No se pudieron obtener todos los elementos necesarios."
        );

        return;
    }


    /*
     * ==========================================
     * SERVICIOS
     * ==========================================
     */

    const searchComponent =
        new SearchComponent(
            resultsContainer
        );

    const barcodeScanner =
        new BarcodeScannerService();


    /*
     * ==========================================
     * ESTADO
     * ==========================================
     */

    const state = {

        category: "",

        brand: "",

        nutritionGrade: "",

        page: 1,

        pageSize: 10,

        total: 0,

        /*
         * Evita procesar varias veces
         * el mismo código.
         */
        barcodeDetected: false

    };


    /*
     * Timer utilizado para mostrar
     * ayuda después de 10 segundos.
     */
    let cameraHelpTimer = null;


    /*
     * ==========================================
     * BÚSQUEDA MANUAL POR CÓDIGO
     * ==========================================
     */

    barcodeForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const barcode =
                barcodeInput.value.trim();


            /*
             * Validación realizada mediante
             * JavaScript, como solicita el TP.
             */
            if (!barcode) {

                showStatus(
                    "Ingresá un código de barras.",
                    "error"
                );

                barcodeInput.focus();

                return;
            }


            if (!/^\d{8,14}$/.test(barcode)) {

                showStatus(
                    "El código de barras debe contener entre 8 y 14 números.",
                    "error"
                );

                barcodeInput.focus();

                return;
            }


            stopCamera();


            window.location.assign(
                `/foodNutrition?barcode=${encodeURIComponent(barcode)}`
            );
        }
    );


    /*
     * ==========================================
     * BOTÓN "INGRESAR MANUALMENTE"
     * ==========================================
     */

    useManualButton?.addEventListener(
        "click",
        () => {

            stopCamera();

            hideCameraHelp();

            hideManualFallbackHighlight();

            const manualInput =
                document.querySelector(
                    "#barcode-method-manual"
                );

            if (manualInput) {

                manualInput.checked = true;

                manualInput.dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles: true
                        }
                    )
                );
            }
        }
    );


    /*
     * ==========================================
     * CAMBIO DE MÉTODO
     * ==========================================
     */

    barcodeMethodInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                () => {

                    const method =
                        input.value;


                    clearStatus();


                    /*
                     * ==================================
                     * MÉTODO CÁMARA
                     * ==================================
                     */

                    if (
                        method === "camera"
                    ) {

                        barcodeForm.hidden =
                            true;

                        cameraSearch.hidden =
                            false;

                        resetCameraInterface();

                        return;
                    }


                    /*
                     * ==================================
                     * MÉTODO MANUAL
                     * ==================================
                     */

                    stopCamera();

                    hideCameraHelp();

                    hideManualFallbackHighlight();

                    barcodeForm.hidden =
                        false;

                    cameraSearch.hidden =
                        true;

                    barcodeInput.focus();
                }
            );
        }
    );


    /*
     * ==========================================
     * INICIAR / REINTENTAR CÁMARA
     * ==========================================
     */

    scanBarcodeButton.addEventListener(
        "click",
        async () => {

            await startCamera();
        }
    );


    /*
     * ==========================================
     * DETENER CÁMARA
     * ==========================================
     */

    stopCameraButton.addEventListener(
        "click",
        () => {

            stopCamera();

            hideCameraHelp();

            cameraStatus.textContent =
                'Cámara detenida. Presioná "Iniciar cámara" para volver a escanear.';
        }
    );


    /*
     * ==========================================
     * INICIAR SCANNER
     * ==========================================
     */

    async function startCamera() {

        clearStatus();

        hideCameraHelp();

        hideManualFallbackHighlight();

        state.barcodeDetected =
            false;

        clearCameraHelpTimer();


        /*
         * Deshabilitamos el botón mientras
         * se solicita acceso a la cámara.
         */
        scanBarcodeButton.disabled =
            true;

        scanBarcodeButton.textContent =
            "Iniciando cámara...";


        stopCameraButton.hidden =
            false;

        cameraContainer.hidden =
            false;


        cameraStatus.className =
            "camera-status";

        cameraStatus.textContent =
            "Solicitando acceso a la cámara...";


        try {

            await barcodeScanner.start(
                barcodeVideo,
                handleBarcodeDetected,
                handleCameraError
            );


            /*
             * La cámara comenzó correctamente.
             */
            cameraStatus.textContent =
                "Buscando código... Mantenelo dentro del marco.";

            scanBarcodeButton.disabled =
                true;

            scanBarcodeButton.textContent =
                "Escaneando...";


            /*
             * Después de 10 segundos sin detectar
             * mostramos instrucciones.
             */
            cameraHelpTimer =
                setTimeout(
                    showCameraHelp,
                    10000
                );

        } catch (error) {

            console.error(
                "No se pudo iniciar el scanner:",
                error
            );


            scanBarcodeButton.disabled =
                false;

            scanBarcodeButton.textContent =
                "Intentar nuevamente";


            stopCameraButton.hidden =
                true;

            cameraContainer.hidden =
                true;


            cameraStatus.className =
                "camera-status is-error";

            cameraStatus.textContent =
                getCameraErrorMessage(
                    error
                );
        }
    }


    /*
     * ==========================================
     * CÓDIGO DETECTADO
     * ==========================================
     */

    function handleBarcodeDetected(
        barcode
    ) {

        /*
         * Evitamos procesar varias detecciones
         * simultáneas.
         */
        if (
            state.barcodeDetected
        ) {

            return;
        }


        if (!barcode) {

            return;
        }


        const normalizedBarcode =
            String(
                barcode
            ).trim();


        console.log(
            "Barcode recibido:",
            normalizedBarcode
        );


        /*
         * Estamos trabajando específicamente
         * con EAN-13.
         */
        if (
            !/^\d{13}$/.test(
                normalizedBarcode
            )
        ) {

            cameraStatus.textContent =
                "Se detectó un código, pero no corresponde a un EAN-13 válido.";

            return;
        }


        /*
         * Marcamos que ya encontramos
         * el código.
         */
        state.barcodeDetected =
            true;


        clearCameraHelpTimer();

        hideCameraHelp();

        hideManualFallbackHighlight();


        cameraStatus.className =
            "camera-status is-success";

        cameraStatus.textContent =
            `Código detectado: ${normalizedBarcode}`;


        /*
         * Pequeña pausa para que el usuario
         * pueda ver que fue reconocido.
         */
        setTimeout(
            () => {

                stopCamera();


                window.location.assign(
                    `/foodNutrition?barcode=${encodeURIComponent(
                        normalizedBarcode
                    )}`
                );

            },
            500
        );
    }


    /*
     * ==========================================
     * ERROR DE CÁMARA / SCANNER
     * ==========================================
     */

    function handleCameraError(
        error
    ) {

        /*
         * Los errores de lectura de ZXing
         * durante el escaneo continuo son normales.
         *
         * No mostramos un error al usuario por
         * cada frame en el que no se encontró
         * un código.
         */

        console.debug(
            "Scanner:",
            error
        );
    }


    /*
     * ==========================================
     * AYUDA DESPUÉS DE 10 SEGUNDOS
     * ==========================================
     */

    function showCameraHelp() {

        if (state.barcodeDetected) {
            return;
        }

        /*
        * Detenemos automáticamente la cámara.
        */
        stopCamera();


        /*
        * Mostramos el mensaje de ayuda.
        */
        cameraStatus.className =
            "camera-status is-help";

        cameraStatus.innerHTML = `
            <strong>
                No pudimos detectar el código de barras.
            </strong>

            <span>
                Asegurate de que el código esté bien iluminado,
                enfocado y dentro del marco de escaneo.
            </span>
        `;


        /*
        * Como la cámara se detuvo por timeout,
        * ofrecemos volver a intentarlo.
        */
        scanBarcodeButton.textContent =
            "Reintentar escaneo";


        /*
        * Destacamos la alternativa manual.
        */
        useManualButton?.classList.add(
            "is-highlighted"
        );


        cameraHelpTimer = null;
    }


    /*
     * ==========================================
     * OCULTAR AYUDA
     * ==========================================
     */

    function hideCameraHelp() {

        /*
         * La ayuda está integrada al
         * mensaje de cameraStatus, por lo
         * que restauramos el estado normal
         * solamente cuando sea necesario.
         */

        if (
            state.barcodeDetected
        ) {

            return;
        }


        if (
            cameraContainer.hidden
        ) {

            return;
        }
    }


    /*
     * ==========================================
     * RESALTAR / QUITAR FALLBACK MANUAL
     * ==========================================
     */

    function hideManualFallbackHighlight() {

        useManualButton?.classList.remove(
            "is-highlighted"
        );
    }


    /*
     * ==========================================
     * REINICIAR INTERFAZ DE CÁMARA
     * ==========================================
     */

    function resetCameraInterface() {

        clearCameraHelpTimer();

        state.barcodeDetected =
            false;

        cameraContainer.hidden =
            true;

        stopCameraButton.hidden =
            true;

        scanBarcodeButton.disabled =
            false;

        scanBarcodeButton.textContent =
            "Iniciar cámara";

        cameraStatus.className =
            "camera-status";

        cameraStatus.textContent =
            'Presioná "Iniciar cámara" para comenzar.';
    }


    /*
     * ==========================================
     * DETENER CÁMARA
     * ==========================================
     */

    function stopCamera() {

    clearCameraHelpTimer();

    barcodeScanner.stop();

    scanBarcodeButton.disabled = false;

    scanBarcodeButton.textContent =
        "Escanear cámara";

    stopCameraButton.hidden = true;

    cameraContainer.hidden = true;
}


    /*
     * ==========================================
     * TIMER
     * ==========================================
     */

    function clearCameraHelpTimer() {

        if (
            cameraHelpTimer
        ) {

            clearTimeout(
                cameraHelpTimer
            );

            cameraHelpTimer =
                null;
        }
    }


    /*
     * ==========================================
     * MENSAJES DE ERROR
     * ==========================================
     */

    function getCameraErrorMessage(
        error
    ) {

        if (
            error?.name ===
                "NotAllowedError" ||
            error?.name ===
                "PermissionDeniedError"
        ) {

            return (
                "No se permitió el acceso a la cámara. " +
                "Concedé permisos al navegador e intentá nuevamente."
            );
        }


        if (
            error?.name ===
                "NotFoundError" ||
            error?.name ===
                "DevicesNotFoundError"
        ) {

            return (
                "No se encontró ninguna cámara disponible en el dispositivo."
            );
        }


        if (
            error?.name ===
                "NotReadableError" ||
            error?.name ===
                "TrackStartError"
        ) {

            return (
                "La cámara no pudo iniciarse. " +
                "Verificá que no esté siendo utilizada por otra aplicación."
            );
        }


        if (
            error?.name ===
                "OverconstrainedError"
        ) {

            return (
                "La cámara del dispositivo no admite la configuración solicitada."
            );
        }


        return (
            "No se pudo iniciar la cámara. " +
            "Verificá los permisos del navegador y volvé a intentarlo."
        );
    }


    /*
     * ==========================================
     * BÚSQUEDA POR FILTROS
     * ==========================================
     */

    filtersForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const category =
                categoryInput.value.trim();


            const brand =
                brandInput.value.trim();


            const nutritionGrade =
                nutritionGradeInput.value.trim();


            /*
             * Debe existir al menos un filtro.
             */
            if (
                !category &&
                !brand &&
                !nutritionGrade
            ) {

                showStatus(
                    "Seleccioná al menos un filtro.",
                    "error"
                );

                return;
            }


            state.category =
                category;


            state.brand =
                brand;


            state.nutritionGrade =
                nutritionGrade;


            state.page =
                1;


            state.total =
                0;


            await executeSearch();
        }
    );


    /*
     * ==========================================
     * EJECUTAR BÚSQUEDA
     * ==========================================
     */

    let activeSearch;
    document.addEventListener("astro:before-swap", () => activeSearch?.abort(), { once: true });

    async function executeSearch() {
        activeSearch?.abort();
        const request = new AbortController();
        activeSearch = request;

        try {

            clearStatus();

            clearResults();

            hidePagination();


            searchComponent.renderLoading();


            const data =
                await FoodNutritionService.searchProducts(
                    state.category,
                    state.brand,
                    state.nutritionGrade,
                    state.page,
                    state.pageSize,
                    {
                        signal: request.signal
                    }
                );

            if (request.signal.aborted || activeSearch !== request) return;
            clearStatus();


            const products =
                Array.isArray(
                    data?.products
                )
                    ? data.products
                    : [];


            state.total =
                Number.isInteger(
                    data?.count
                )
                    ? data.count
                    : 0;


            searchComponent.renderResults(
                products
            );


            renderResultsCount(
                state.total
            );


            renderPagination();


            resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            if (
                request.signal.aborted ||
                activeSearch !== request
            ) {
                return;
            }

            console.error(
                "Error durante la búsqueda:",
                error
            );

            showStatus(
                "No pudimos cargar los productos.",
                "error"
            );

        }
    }


    /*
     * ==========================================
     * PAGINACIÓN
     * ==========================================
     */

    function renderPagination() {

        if (
            state.total <=
            state.pageSize
        ) {

            hidePagination();

            return;
        }


        const totalPages =
            Math.ceil(
                state.total /
                state.pageSize
            );


        pagination.innerHTML = `

            <button
                id="previous-page"
                type="button"
                ${state.page <= 1 ? "disabled" : ""}
            >
                ← Anterior
            </button>

            <span>
                Página
                ${state.page}
                de
                ${totalPages}
            </span>

            <button
                id="next-page"
                type="button"
                ${state.page >= totalPages ? "disabled" : ""}
            >
                Siguiente →
            </button>

        `;


        const previousButton =
            document.querySelector(
                "#previous-page"
            );


        previousButton?.addEventListener(
            "click",
            async () => {

                if (
                    state.page <= 1
                ) {

                    return;
                }


                state.page--;

                await executeSearch();
            }
        );


        const nextButton =
            document.querySelector(
                "#next-page"
            );


        nextButton?.addEventListener(
            "click",
            async () => {

                if (
                    state.page >= totalPages
                ) {

                    return;
                }


                state.page++;

                await executeSearch();
            }
        );
    }


    /*
     * ==========================================
     * CONTADOR DE RESULTADOS
     * ==========================================
     */

    function renderResultsCount(
        total
    ) {

        if (
            total === 0
        ) {

            resultsCount.textContent =
                "No se encontraron productos.";

            return;
        }


        resultsCount.textContent =
            `${total.toLocaleString("es-AR")} productos encontrados`;
    }


    /*
     * ==========================================
     * ESTADOS
     * ==========================================
     */

    function showStatus(
        message,
        type
    ) {

        searchStatus.innerHTML =
            "";


        const statusElement =
            document.createElement(
                "div"
            );


        statusElement.className =
            `status-${type}`;


        statusElement.textContent =
            message;


        searchStatus.appendChild(
            statusElement
        );
    }


    function clearStatus() {

        searchStatus.innerHTML =
            "";
    }


    function clearResults() {

        resultsContainer.innerHTML =
            "";

        resultsCount.textContent =
            "";
    }


    function hidePagination() {

        pagination.innerHTML =
            "";
    }
/*
 * ==========================================
 * RESTAURAR ESTADO BASE AL VOLVER
 * ==========================================
 *
 * Cuando volvemos desde la vista de detalle
 * mediante history.back(), el navegador puede
 * restaurar la página exactamente como estaba.
 *
 * Por eso dejamos la búsqueda nuevamente
 * en su estado inicial:
 *
 * - Código manual seleccionado
 * - Cámara cerrada
 * - Scanner detenido
 * - Sin estados de error/ayuda
 * - Botón "Iniciar cámara"
 */

window.addEventListener(
    "pageshow",
    () => {

        /*
         * Detener cualquier scanner que haya
         * quedado activo.
         */
        stopCamera();


        /*
         * Limpiar estados visuales de la cámara.
         */
        clearStatus();

        hideCameraHelp();

        hideManualFallbackHighlight();


        /*
         * Seleccionar nuevamente
         * "Código manual".
         */
        barcodeMethodInputs.forEach(
            input => {

                input.checked =
                    input.value === "manual";
            }
        );


        /*
         * Mostrar formulario manual.
         */
        barcodeForm.hidden =
            false;


        /*
         * Ocultar sección de cámara.
         */
        cameraSearch.hidden =
            true;


        /*
         * Restaurar completamente
         * la interfaz de cámara.
         */
        resetCameraInterface();

    }
);

    /*
     * ==========================================
     * LIMPIEZA AL SALIR
     * ==========================================
     */

    window.addEventListener(
        "beforeunload",
        () => {

            clearCameraHelpTimer();

            barcodeScanner.stop();
        }
    );
}

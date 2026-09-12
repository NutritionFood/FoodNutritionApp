import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType} from "@zxing/library";

export class BarcodeScannerService {

    constructor() {

        const hints = new Map();

        hints.set( DecodeHintType.POSSIBLE_FORMATS,[BarcodeFormat.EAN_13]);

        hints.set( DecodeHintType.TRY_HARDER, true);

        this.reader = new BrowserMultiFormatReader(hints);

        this.controls = null;
    }

    async start( videoElement, onDetected, onError) {

        if (!videoElement) {

            throw new Error("No se encontró el elemento de video.");
        }

        this.stop();

        try {

            this.controls = await this.reader.decodeFromConstraints(

                    {
                        audio: false,

                        video: {
                            facingMode: { ideal: "environment"},
                            width: { ideal: 1280},
                            height: {ideal: 720}
                        }
                    },

                    videoElement,

                    (result, error) => {

                        if (result) {

                            const barcode = result.getText();

                            console.log("Código detectado por ZXing:", barcode);

                            onDetected?.(barcode);

                            return;
                        }
                    }
                );

        } catch (error) {

            console.error("Error al iniciar la cámara:", error);

            onError?.(error);

            throw error;
        }
    }

    stop() {

        if (!this.controls) {

            return;
        }

        this.controls.stop();

        this.controls = null;
    }
}
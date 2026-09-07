import { BrowserMultiFormatReader } from "@zxing/browser";
import {
    BarcodeFormat,
    DecodeHintType
} from "@zxing/library";


export class BarcodeScannerService {

    constructor() {

        const hints = new Map();


        /*
         * Indicamos que solamente queremos
         * detectar códigos EAN-13.
         */
        hints.set(
            DecodeHintType.POSSIBLE_FORMATS,
            [
                BarcodeFormat.EAN_13
            ]
        );


        /*
         * Le pedimos a ZXing que priorice
         * la capacidad de detección sobre
         * la velocidad.
         */
        hints.set(
            DecodeHintType.TRY_HARDER,
            true
        );


        this.reader =
            new BrowserMultiFormatReader(
                hints
            );


        this.controls =
            null;
    }


    async start(
        videoElement,
        onDetected,
        onError
    ) {

        if (!videoElement) {

            throw new Error(
                "No se encontró el elemento de video."
            );
        }


        /*
         * Garantizamos que no haya
         * otra sesión activa.
         */
        this.stop();


        try {

            this.controls =
                await this.reader.decodeFromConstraints(

                    {
                        audio: false,

                        video: {

                            /*
                             * En celulares preferimos
                             * la cámara trasera.
                             *
                             * "ideal" permite que el navegador
                             * utilice otra cámara si no puede
                             * cumplir esta preferencia.
                             */
                            facingMode: {
                                ideal: "environment"
                            },

                            /*
                             * Intentamos obtener una imagen
                             * suficientemente grande para
                             * facilitar la detección.
                             */
                            width: {
                                ideal: 1280
                            },

                            height: {
                                ideal: 720
                            }
                        }
                    },


                    videoElement,


                    (result, error) => {

                        /*
                         * RESULTADO ENCONTRADO
                         */
                        if (result) {

                            const barcode =
                                result.getText();


                            console.log(
                                "Código detectado por ZXing:",
                                barcode
                            );


                            onDetected?.(
                                barcode
                            );


                            return;
                        }


                        /*
                         * IMPORTANTE:
                         *
                         * No hacemos nada con "error".
                         *
                         * ZXing genera NotFoundException
                         * constantemente mientras analiza
                         * frames que no contienen un código.
                         *
                         * Eso es comportamiento normal.
                         */
                    }
                );

        } catch (error) {

            console.error(
                "Error al iniciar la cámara:",
                error
            );


            onError?.(
                error
            );


            throw error;
        }
    }


    stop() {

        if (!this.controls) {

            return;
        }


        this.controls.stop();


        this.controls =
            null;
    }
}
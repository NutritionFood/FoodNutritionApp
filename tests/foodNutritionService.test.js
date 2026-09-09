import test from "node:test";
import assert from "node:assert/strict";
import { FoodNutritionService as Service } from "../src/services/foodNutritionService.js";

const ok = data => new Response(JSON.stringify(data));
const pending = signal => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
});

test("consultas de productos ante demoras y fallos", async t => {
    const originalFetch = globalThis.fetch;
    class Client extends Service {
        static REQUEST_TIMEOUT_MS = 15;
        static TOTAL_TIMEOUT_MS = 200;
        static RETRY_DELAY_MS = 1;
    }
    t.after(() => { globalThis.fetch = originalFetch; });

    await t.test("cancela un intento lento y recupera la respuesta siguiente", async () => {
        let calls = 0;
        let firstSignal;
        globalThis.fetch = async (url, { signal }) => {
            if (++calls === 1) { firstSignal = signal; return pending(signal); }
            return ok({ products: [] });
        };
        const retries = [];
        assert.deepEqual(await Client.searchProducts("", "", "", 1, 10, {
            onRetry: value => retries.push(value.attempt)
        }), { products: [] });
        assert.equal(firstSignal.aborted, true);
        assert.deepEqual(retries, [1]);
    });

    await t.test("el timeout incluye la descarga del cuerpo", async () => {
        let calls = 0;
        globalThis.fetch = async (url, { signal }) => ++calls === 1
            ? { ok: true, json: () => pending(signal) }
            : ok({ products: [] });
        await Client.searchProducts();
        assert.equal(calls, 2);
    });

    await t.test("una primera búsqueda colgada se repite antes sin otro envío del formulario", async () => {
        class FastFirstClient extends Client {
            static FIRST_ATTEMPT_TIMEOUT_MS = 5;
            static REQUEST_TIMEOUT_MS = 100;
            static TOTAL_TIMEOUT_MS = 1000;
        }
        const urls = [];
        globalThis.fetch = async (url, { signal }) => {
            urls.push(url);
            if (urls.length === 1) return pending(signal);
            // La segunda consulta dispone de más tiempo que la primera.
            await new Promise(resolve => setTimeout(resolve, 15));
            signal.throwIfAborted();
            return ok({ count: 1, products: [{ code: "12345678" }] });
        };
        const result = await FastFirstClient.searchProducts("meats");
        assert.equal(result.products.length, 1);
        assert.equal(urls.length, 2);
        assert.equal(urls[0], urls[1]);
        assert.equal(new URL(urls[0]).searchParams.get("categories_tags_en"), "meats");
    });

    await t.test("503 transitorio se recupera; 404 no se reintenta", async () => {
        let calls = 0;
        globalThis.fetch = async () => ++calls === 1 ? new Response(null, { status: 503 }) : ok({ status: 1, product: { code: "12345678" } });
        assert.equal((await Client.getProductByBarcode("12345678")).code, "12345678");
        calls = 0;
        globalThis.fetch = async () => { calls++; return new Response(null, { status: 404 }); };
        await assert.rejects(Client.getProductByBarcode("12345678"), e => e.status === 404 && !e.message.includes("HTTP"));
        assert.equal(calls, 1);
    });

    await t.test("cancelar durante el backoff impide nuevos intentos", async () => {
        const controller = new AbortController();
        let calls = 0;
        globalThis.fetch = async () => { calls++; throw new TypeError("Network error"); };
        await assert.rejects(Client.requestWithRetry("test", {
            signal: controller.signal,
            onRetry: () => controller.abort()
        }), { name: "AbortError" });
        assert.equal(calls, 1);
    });

    await t.test("cancelar durante fetch no genera reintentos", async () => {
        const controller = new AbortController();
        globalThis.fetch = async (url, { signal }) => {
            const result = pending(signal);
            controller.abort();
            return result;
        };
        await assert.rejects(Client.requestWithRetry("test", { signal: controller.signal }), { name: "AbortError" });
    });

    await t.test("respeta Retry-After sin superar el presupuesto de espera", async () => {
        let calls = 0;
        globalThis.fetch = async () => { calls++; return new Response(null, { status: 429, headers: { "Retry-After": "120" } }); };
        await assert.rejects(Client.searchProducts(), e => e.status === 429);
        assert.equal(calls, 1);
    });

    await t.test("agota tres reintentos y termina con un mensaje recuperable", async () => {
        let calls = 0;
        globalThis.fetch = async () => { calls++; throw new TypeError("Network error"); };
        await assert.rejects(Client.searchProducts(), /Volvé a intentar/);
        assert.equal(calls, 4);
    });

    await t.test("una respuesta incompleta no se presenta como cero resultados", async () => {
        globalThis.fetch = async () => ok({ error: "unavailable" });
        await assert.rejects(Client.searchProducts(), /respuesta incompleta/);
    });

    await t.test("el presupuesto total corta una consulta que sigue sin responder", async () => {
        class ShortClient extends Client {
            static REQUEST_TIMEOUT_MS = 1000;
            static TOTAL_TIMEOUT_MS = 20;
        }
        let calls = 0;
        globalThis.fetch = async (url, { signal }) => { calls++; return pending(signal); };
        await assert.rejects(ShortClient.searchProducts(), /Volvé a intentar/);
        assert.equal(calls, 1);
    });

    await t.test("una respuesta JSON truncada se puede recuperar", async () => {
        let calls = 0;
        globalThis.fetch = async () => ++calls === 1 ? new Response('{') : ok({ products: [] });
        assert.deepEqual(await Client.searchProducts(), { products: [] });
        assert.equal(calls, 2);
    });
});

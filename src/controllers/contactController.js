function initContactForm() {
    const form = document.getElementById("contact-form");

    if (!form || form.dataset.initialized) return;
    form.dataset.initialized = "true";

    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById("contact-form-status");
    const fields = [...form.querySelectorAll("input, textarea")];

    function validateField(field) {
        field.setCustomValidity(
            field.value.trim() ? "" : "Completá este campo."
        );
    }

    fields.forEach((field) => {
        field.addEventListener("input", () => {
            validateField(field);
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        fields.forEach(validateField);
        if (!form.reportValidity()) return;

        button.disabled = true;
        button.textContent = "Enviando…";
        status.textContent = "";

        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                headers: {
                    Accept: "application/json",
                },
            });

            const result = await response.json();

            if (
                !response.ok ||
                ![true, "true"].includes(result.success)
            ) {
                throw new Error("El servicio no confirmó la recepción.");
            }

            status.textContent =
                "Recibimos tu consulta. ¡Gracias por escribirnos!";

            form.reset();
        } catch (error) {
            status.textContent =
                "No pudimos confirmar el envío. Conservamos lo que escribiste para que puedas reintentar.";
        } finally {
            button.disabled = false;
            button.textContent = "Enviar mensaje";
        }
    });
}

document.addEventListener("astro:page-load", initContactForm);
initContactForm();
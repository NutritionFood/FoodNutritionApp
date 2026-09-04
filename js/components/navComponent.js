// =========================================================
// NAV COMPONENT
// =========================================================
//
// Renderiza la navegación principal, común a todas las
// vistas de la aplicación. Se instancia una vez por página
// indicando cuál es la vista activa.
//
// Las rutas son absolutas respecto a la raíz del proyecto
// (ej: "/index.html", "/html/search.html"), por lo que la
// app debe servirse desde la raíz de FoodNutritionApp
// (por ejemplo con la extensión Live Server de VS Code).
// =========================================================

export class NavComponent {

    static LINKS = [

        {
            id: "home",
            label: "Inicio",
            href: "/index.html"
        },

        {
            id: "search",
            label: "Buscar",
            href: "/html/search.html"
        },

        {
            id: "wishlist",
            label: "Lista de deseos",
            href: "/html/wishlist.html"
        },

        {
            id: "history",
            label: "Historial",
            href: "/html/history.html"
        },

        {
            id: "contact",
            label: "Contacto",
            href: "/html/contact.html"
        }

    ];


    constructor(container, activePage) {

        this.container =
            container;

        this.activePage =
            activePage;

    }


    // =========================================================
    // RENDER
    // =========================================================

    render() {

        if (!this.container) {
            return;
        }


        this.container.innerHTML = `

            <nav
                class="main-nav"
                aria-label="Navegación principal"
            >

                <button
                    type="button"
                    class="nav-toggle"
                    id="nav-toggle"
                    aria-expanded="false"
                    aria-controls="nav-menu"
                >
                    <span class="nav-toggle-bar"></span>
                    <span class="nav-toggle-bar"></span>
                    <span class="nav-toggle-bar"></span>

                    <span class="visually-hidden">
                        Abrir menú
                    </span>
                </button>


                <ul
                    class="nav-menu"
                    id="nav-menu"
                >

                    ${NavComponent.LINKS
                        .map(
                            link => `

                                <li>
                                    <a
                                        href="${link.href}"
                                        class="nav-link${
                                            link.id === this.activePage
                                                ? " active"
                                                : ""
                                        }"
                                        ${
                                            link.id === this.activePage
                                                ? 'aria-current="page"'
                                                : ""
                                        }
                                    >
                                        ${link.label}
                                    </a>
                                </li>

                            `
                        )
                        .join("")
                    }

                </ul>

            </nav>

        `;


        this.bindEvents();

    }


    // =========================================================
    // EVENTOS
    // =========================================================

    bindEvents() {

        const toggle =
            this.container.querySelector("#nav-toggle");

        const menu =
            this.container.querySelector("#nav-menu");


        if (!toggle || !menu) {
            return;
        }


        toggle.addEventListener(
            "click",
            () => {

                const isOpen =
                    menu.classList.toggle("open");


                toggle.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }
        );


        // -----------------------------------------------------
        // CERRAR AL NAVEGAR (mobile)
        // -----------------------------------------------------

        menu
            .querySelectorAll(".nav-link")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        menu.classList.remove("open");

                        toggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });

    }

}


// =========================================================
// HELPER DE INICIALIZACIÓN
// =========================================================
//
// Cada controller de página puede llamar a esta función
// para montar el nav dentro del <header>, sin repetir
// código en cada archivo.
// =========================================================

export function initNav(activePage) {

    const navContainer =
        document.querySelector("#nav-container");


    if (!navContainer) {

        console.error(
            "No se encontró #nav-container."
        );

        return;
    }


    const nav =
        new NavComponent(
            navContainer,
            activePage
        );


    nav.render();

}

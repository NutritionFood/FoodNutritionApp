// =========================================================
// NAV COMPONENT
// =========================================================
//
// Renderiza la navegación principal, común a todas las
// vistas de la aplicación.
//
// En mobile se muestra como una barra fija inferior (tab
// bar), con los 5 accesos siempre visibles como íconos.
// En tablet/desktop se muestra como una barra horizontal
// dentro del header.
//
// Las rutas corresponden a las páginas generadas por Astro:
//
// /             -> src/pages/index.astro
// /search       -> src/pages/search.astro
// /wishlist     -> src/pages/wishlist.astro
// /history      -> src/pages/history.astro
// /contact      -> src/pages/contact.astro
//
// =========================================================

export class NavComponent {

    static LINKS = [

        {
            id: "home",
            label: "Inicio",
            href: "/",
            icon: "home"
        },

        {
            id: "search",
            label: "Buscar",
            href: "/search",
            icon: "search"
        },

        {
            id: "wishlist",
            label: "Deseos",
            href: "/wishlist",
            icon: "heart"
        },

        {
            id: "history",
            label: "Historial",
            href: "/history",
            icon: "history"
        },

        {
            id: "contact",
            label: "Contacto",
            href: "/contact",
            icon: "mail"
        }

    ];


    // =========================================================
    // ÍCONOS
    // =========================================================

    static ICON_PATHS = {

        home:
            '<path d="M3 11.5 12 4l9 7.5"/>' +
            '<path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9"/>',

        search:
            '<circle cx="11" cy="11" r="7"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>',

        heart:
            '<path d="M12 20s-7-4.35-9.5-8.5C1 8 2.5 4.5 6 4c2 0 3.5 1 4 2 .5-1 2-2 4-2 3.5.5 5 4 3.5 7.5C19 15.65 12 20 12 20Z"/>',

        history:
            '<circle cx="12" cy="12" r="9"/>' +
            '<polyline points="12 7 12 12 16 14"/>',

        mail:
            '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
            '<polyline points="3 7 12 13 21 7"/>'

    };


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

                <ul class="nav-menu">

                    ${NavComponent.LINKS
                        .map(
                            link => `

                                <li class="nav-item">

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

                                        <span
                                            class="nav-link-icon"
                                            aria-hidden="true"
                                        >
                                            ${NavComponent.renderIcon(link.icon)}
                                        </span>

                                        <span class="nav-link-label">
                                            ${link.label}
                                        </span>

                                    </a>

                                </li>

                            `
                        )
                        .join("")
                    }

                </ul>

            </nav>

        `;

    }


    // =========================================================
    // RENDERIZAR UN ÍCONO
    // =========================================================

    static renderIcon(name) {

        const path =
            NavComponent.ICON_PATHS[name] ||
            "";


        return `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >${path}</svg>
        `;

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

export function initNav() {

    const navContainer =
        document.querySelector("#nav-container");


    if (!navContainer) {

        console.error(
            "No se encontró #nav-container."
        );

        return;
    }


    const activePage =
        getActivePage();


    const nav =
        new NavComponent(
            navContainer,
            activePage
        );


    nav.render();

}


// =========================================================
// DETERMINAR PÁGINA ACTIVA
// =========================================================

function getActivePage() {

    const pathname =
        window.location.pathname;


    if (
        pathname === "/" ||
        pathname === ""
    ) {
        return "home";
    }


    if (
        pathname.startsWith("/search")
    ) {
        return "search";
    }


    if (
        pathname.startsWith("/wishlist")
    ) {
        return "wishlist";
    }


    if (
        pathname.startsWith("/history")
    ) {
        return "history";
    }


    if (
        pathname.startsWith("/contact")
    ) {
        return "contact";
    }


    /*
     * foodNutrition no tiene un acceso
     * propio en el menú.
     */
    return "";
}
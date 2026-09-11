# Food Nutrition

Aplicación web móvil desarrollada como Trabajo Integrador del **Módulo 1 – Aplicaciones Móviles**.

Food Nutrition permite buscar y consultar información nutricional de productos alimenticios utilizando datos de **Open Food Facts**. La aplicación está diseñada con un enfoque **mobile-first**, es responsiva y además incorpora funcionalidades de **Progressive Web App (PWA)** para permitir su instalación y disponer de un funcionamiento offline básico.

## Repositorio

Repositorio GitHub:

https://github.com/NutritionFood/FoodNutritionApp

## Aplicación

> (https://food-nutrition-app-one.vercel.app/)

Si todavía no se encuentra publicada, el proyecto puede ejecutarse localmente siguiendo las instrucciones de este README.

---

## Objetivo

El objetivo de la aplicación es facilitar la consulta de información nutricional de productos alimenticios mediante una interfaz web sencilla y adaptada principalmente a dispositivos móviles.

El usuario puede:

- Explorar productos destacados.
- Buscar productos mediante distintos filtros.
- Buscar un producto por código de barras.
- Escanear un código de barras utilizando la cámara del dispositivo.
- Consultar información nutricional detallada.
- Guardar productos en una lista de deseos.
- Agregar preferencias personales a los productos guardados.
- Consultar el historial de productos visitados.
- Eliminar productos de la lista de deseos o del historial.
- Instalar la aplicación como PWA.
- Acceder a la interfaz principal aun sin conexión cuando los recursos necesarios se encuentran en caché.

---

## Tecnologías utilizadas

### Frontend

- **Astro 7.3.1**
- **JavaScript ES6+**
- **HTML5**
- **CSS3**
- **Fetch API**
- **Web Storage API / localStorage**
- **PWA**
  - Web App Manifest
  - Service Worker
  - Cache API
- **ClientRouter de Astro** para navegación entre páginas.

### Librerías

- **@zxing/browser** – utilización de la cámara para lectura de códigos de barras.
- **@zxing/library** – definición y procesamiento de formatos de códigos de barras.

### API

La información de los productos se obtiene desde:

**Open Food Facts API**

https://world.openfoodfacts.org/api/v2

La aplicación utiliza la API para obtener información como:

- Nombre del producto.
- Marca.
- Imagen.
- Categorías.
- Código de barras.
- Nutri-Score.
- Información nutricional disponible.

No se requiere una API Key para ejecutar el proyecto.

---

# Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- **Node.js**
- **npm**
- Un navegador web moderno.
- Se recomienda utilizar **Google Chrome**, especialmente para probar la funcionalidad de lectura de códigos mediante cámara.

No se requiere una base de datos ni un servidor backend propio.

---

# Instalación

## 1. Clonar el repositorio

```bash
git clone https://github.com/NutritionFood/FoodNutritionApp.git
```

Ingresar al directorio:

```bash
cd FoodNutritionApp
```

## 2. Instalar dependencias

```bash
npm install
```

Esto instala Astro y las librerías utilizadas para el escaneo de códigos de barras.

## 3. Ejecutar en desarrollo

```bash
npm run dev
```

Astro iniciará el servidor de desarrollo. La terminal mostrará la URL local, normalmente:

```text
http://localhost:4321
```

Abrir esa dirección desde el navegador.

---

# Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo de Astro. |
| `npm run build` | Genera la versión de producción y prepara los recursos de la PWA. |
| `npm run preview` | Permite visualizar localmente la versión generada para producción. |

Para generar el proyecto:

```bash
npm run build
```

El resultado se genera en la carpeta:

```text
dist/
```

---

# Estructura del proyecto

La aplicación separa la estructura visual, la lógica de presentación y el acceso a servicios.

```text
FoodNutritionApp/
│
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   │
│   ├── image/
│   │   └── logoFoodNutrition.png
│   │
│   ├── js/
│   │   └── pwa-init.js
│   │
│   ├── manifest.json
│   └── sw.js
│
├── scripts/
│   └── build-pwa.mjs
│
├── src/
│   ├── components/
│   │   ├── foodNutritionComponent.js
│   │   ├── historyComponent.js
│   │   ├── navComponent.js
│   │   ├── searchComponent.js
│   │   └── wishlistComponent.js
│   │
│   ├── config/
│   │   └── urls.js
│   │
│   ├── controllers/
│   │   ├── contactController.js
│   │   ├── foodNutritionController.js
│   │   ├── historyController.js
│   │   ├── homeController.js
│   │   ├── searchController.js
│   │   └── wishlistController.js
│   │
│   ├── layouts/
│   │   └── Layout.astro
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── search.astro
│   │   ├── foodNutrition.astro
│   │   ├── wishlist.astro
│   │   ├── history.astro
│   │   ├── contact.astro
│   │   └── ContactForm.astro
│   │
│   ├── services/
│   │   ├── barcodeScannerService.js
│   │   ├── foodNutritionService.js
│   │   └── storageService.js
│   │
│   └── styles/
│       ├── common.css
│       ├── contact.css
│       ├── foodNutrition.css
│       ├── history.css
│       ├── home.css
│       ├── search.css
│       └── wishlist.css
│
├── package.json
├── package-lock.json
└── README.md
```

---

# Enfoque y arquitectura

Para el desarrollo se eligió **Astro** como framework principal y JavaScript para implementar la lógica de interacción.

La estructura se organizó separando responsabilidades:

### Pages

Las páginas `.astro` representan las distintas vistas de la aplicación:

- `/` – Inicio.
- `/search` – Búsqueda.
- `/foodNutrition` – Detalle del producto.
- `/wishlist` – Lista de deseos.
- `/history` – Historial.
- `/contact` – Contacto.

### Controllers

Los controladores contienen la lógica de interacción de cada vista.

Por ejemplo:

```text
searchController.js
```

se ocupa de gestionar los filtros, la búsqueda por código de barras, la cámara y la navegación de resultados.

### Components

Los componentes se encargan principalmente de generar y actualizar la interfaz de usuario correspondiente a cada funcionalidad.

### Services

La lógica relacionada con servicios externos y persistencia se concentra en:

```text
foodNutritionService.js
barcodeScannerService.js
storageService.js
```

Esto permite evitar que las páginas tengan que conocer directamente los detalles de comunicación con la API o de almacenamiento.

---

# Búsqueda de productos

La vista de búsqueda permite utilizar distintos criterios para acotar los resultados:

- **Categoría**
- **Marca**
- **Nutri-Score**

La búsqueda se realiza mediante `Fetch API` contra Open Food Facts.

Además, existe una segunda modalidad de búsqueda mediante **código de barras**.

El código puede:

1. Ingresarse manualmente.
2. Escanearse mediante la cámara del dispositivo.

La lectura de códigos se implementa utilizando **ZXing** y se orienta principalmente a códigos **EAN-13**.

---

# Resultados y paginación

Los resultados se muestran mediante tarjetas con información resumida del producto.

La aplicación trabaja con una cantidad de **10 resultados por página** y permite navegar entre páginas cuando existen más resultados disponibles.

Desde cada resultado se puede acceder a la vista de detalle.

---

# Vista de detalle

La vista de detalle consulta el producto seleccionado mediante su código de barras y presenta la información nutricional disponible.

Entre los datos que pueden mostrarse se encuentran:

- Nombre.
- Marca.
- Imagen.
- Categoría.
- Código de barras.
- Nutri-Score.
- Información nutricional disponible.

Desde esta vista también se puede agregar el producto a la lista de deseos.

El acceso al detalle registra automáticamente el producto en el historial.

---

# Lista de deseos

La lista de deseos permite guardar productos para consultarlos posteriormente.

Se eligió la **Variante B – Formulario de preferencias** planteada en la consigna.

Al guardar un producto se pueden registrar:

- Prioridad.
- Categoría o etiqueta personalizada.
- Nota personal.

La información se almacena en `localStorage`, por lo que permanece disponible al cerrar y volver a abrir el navegador.

También se permite eliminar productos individualmente.

---

# Historial

El historial registra automáticamente los productos cuya vista de detalle fue visitada.

El historial:

- No registra búsquedas.
- Registra únicamente productos visitados.
- Ordena los elementos colocando primero el producto visitado más recientemente.
- Permite volver al detalle de cualquier producto.
- Permite eliminar elementos individualmente.
- Permite vaciar el historial completo.
- Persiste mediante `localStorage`.

Para evitar un crecimiento indefinido, el historial mantiene como máximo **50 elementos**.

---

# Diseño responsive y Mobile First

La interfaz se desarrolló utilizando **CSS propio**, sin utilizar Bootstrap, Tailwind, Material UI u otras librerías de UI.

El diseño utiliza un enfoque **mobile-first** y se adapta progresivamente a:

- Móviles en orientación portrait.
- Móviles en orientación landscape.
- Tablets.
- Desktop.

Se utilizan layouts basados principalmente en:

- CSS Grid.
- Flexbox.
- Media queries.
- Unidades relativas.
- `clamp()` para adaptar tamaños.

La estructura HTML utiliza elementos semánticos como:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
```

---

# Progressive Web App

Como etapa adicional del trabajo se implementó la conversión de la aplicación a **PWA**.

La aplicación cuenta con un:

```text
public/manifest.json
```

que define:

- Nombre de la aplicación.
- Nombre corto.
- Íconos de 192x192 y 512x512.
- Color de tema.
- Modo `standalone`.
- Orientación portrait.

También se implementó un:

```text
public/sw.js
```

que funciona como **Service Worker**.

El Service Worker utiliza la **Cache API** para almacenar los recursos necesarios para cargar la interfaz de la aplicación y permite disponer de un funcionamiento offline básico.

El archivo:

```text
public/js/pwa-init.js
```

se encarga de registrar el Service Worker en el navegador.

Además, durante el build se ejecuta:

```text
scripts/build-pwa.mjs
```

Este script genera dinámicamente la lista de recursos que serán incluidos en la caché del shell de la aplicación y genera un nombre de caché asociado al contenido de los recursos.

---

# Funcionamiento offline

Cuando la aplicación se encuentra instalada o el Service Worker ya fue registrado y los recursos fueron almacenados en caché, las páginas principales pueden cargarse sin conexión.

Los recursos estáticos de la aplicación se sirven desde la caché cuando están disponibles.

Las consultas a la API de Open Food Facts requieren conexión a Internet. Si no existe conexión, la aplicación informa que los datos externos no están disponibles.

---

# Persistencia local

La persistencia del lado del cliente se centraliza mediante:

```text
src/services/storageService.js
```

Se utilizan dos claves principales:

```text
foodNutrition:wishlist
foodNutrition:history
```

Esto permite mantener separadas las responsabilidades de almacenamiento de la lista de deseos y del historial.

--

# Flujo general de la aplicación

El flujo principal puede resumirse de la siguiente manera:

```text
Usuario
   │
   ▼
Home
   │
   ▼
Búsqueda
   │
   ├── Categoría / Marca / Nutri-Score
   │
   └── Código de barras
          │
          ├── Ingreso manual
          │
          └── Cámara
   │
   ▼
Open Food Facts API
   │
   ▼
Resultados
   │
   ▼
Detalle del producto
   │
   ├── Agregar a lista de deseos
   │
   └── Registrar visita
          │
          ├── localStorage - Wishlist
          │
          └── localStorage - Historial
```

---

# Requisitos funcionales implementados

| Requisito | Implementación |
|---|---|
| RF1 – Vista Home | Página de inicio con presentación y acceso a búsqueda, además de productos destacados. |
| RF2 – Búsqueda con filtros | Búsqueda por categoría, marca y Nutri-Score. |
| RF3 – Visualización de resultados | Resultados paginados con 10 elementos por página. |
| RF4 – Vista de detalle | Información del producto, Nutri-Score y acciones disponibles. |
| RF5 – Lista de deseos | Persistencia mediante localStorage y formulario de preferencias. |
| RF6 – Historial | Registro automático de productos visitados y persistencia mediante localStorage. |
| RF7 – Contacto | Datos del estudio, formulario de contacto y mapa. |
| RF8 – Diseño responsivo | CSS propio y enfoque mobile-first. |
| PLUS – PWA | Manifest, Service Worker, caché e instalación como aplicación. |

---

# Decisiones técnicas

Una de las principales decisiones fue utilizar **Astro** para estructurar la aplicación, manteniendo la lógica interactiva en JavaScript.

La comunicación con la API se centralizó en un servicio para evitar acoplar las vistas directamente con Open Food Facts.

Para la persistencia se optó por `localStorage` debido a que los datos de lista de deseos e historial pertenecen al usuario del navegador y no requieren un backend.

Para la lectura de códigos de barras se incorporó ZXing, permitiendo aprovechar la cámara del dispositivo desde la propia aplicación web.

Finalmente, se implementó la PWA como una extensión de la aplicación web original. El uso de Manifest y Service Worker permite que la aplicación pueda instalarse y conservar los recursos principales disponibles aun cuando no exista conexión.

---

# Autoría

**Food Nutrition Dev Studio**

Proyecto realizado para:

**Trabajo Práctico Integrador – Módulo 1 – Aplicaciones Móviles**

---

## Licencia

Este proyecto fue desarrollado con fines académicos.

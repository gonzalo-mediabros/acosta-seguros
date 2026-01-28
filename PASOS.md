# Instrucciones de Build y Deploy

Este documento detalla los pasos necesarios para compilar el proyecto, desplegarlo en GitHub Pages y configurar la delegación de dominio.

## 1. Compilación y Despliegue

### Build del proyecto

Para generar los archivos estáticos en la carpeta `dist/`:

```bash
npm run build
```

### Deploy en GitHub Pages

Para subir el contenido de `dist/` a la rama `gh-pages`:

```bash
npm run deploy
```

> [!NOTE]
> Este comando usa `gh-pages` para crear/actualizar automáticamente la rama de despliegue.

---

## 2. Delegación de Dominio (DNS)

Para apuntar tu dominio personalizado a GitHub Pages, agrega los siguientes registros en el panel de control de tu proveedor de dominio (Godaddy, Donweb, etc.):

| Tipo      | Hosting | Valor                         |
| :-------- | :------ | :---------------------------- |
| **A**     | @       | `185.199.108.153`             |
| **A**     | @       | `185.199.109.153`             |
| **A**     | @       | `185.199.110.153`             |
| **A**     | @       | `185.199.111.153`             |
| **CNAME** | www     | `gonzalo-mediabros.github.io` |

> [!IMPORTANT]
> Reemplaza `gonzalo-mediabros.github.io` con la URL correspondiente a tu cuenta de GitHub si es diferente.

> [!IMPORTANT]
> si la pagina de github tiene una url temporal como `https://gonzalo-mediabros.github.io/lightman-global/` se debe configurar el base path en el archivo `astro.config.mjs`.

---

## 3. Configuración en GitHub

1. Ingresa a tu repositorio en GitHub.
2. Ve a **Settings** → **Pages**.
3. En la sección **Custom domain**, escribe tu dominio (ej: `tudominio.com`).
4. Haz clic en **Save**.
5. Se recomienda activar **Enforce HTTPS** una vez que los certificados se hayan generado (puede demorar unos minutos).

---

## 4. Recordatorio Final

> [!CAUTION]
> No olvides **configurar y validar el formulario de contacto** antes de dar por finalizado el despliegue. Asegúrate de que las variables de entorno `PUBLIC_SCRIPT_URL` y `PUBLIC_SCRIPT_API_KEY` estén correctamente configuradas.

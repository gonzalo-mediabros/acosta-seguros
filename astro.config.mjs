import { defineConfig } from "astro/config";

/*
* DEPLOY GITHUB PAGES DOMINIO TEMPORAL
*/
let DEPLOY_DOMAIN = "https://gonzalo-mediabros.github.io"; 
let DEPLOY_PATH = "/acosta-seguros/";   

/* ⚠️ DESCOMENTAR Y COMPLETAR SI DEPLOY ES UN CUSTOM DOMAIN ⚠️ */

DEPLOY_DOMAIN = "https://acostaseguros.com.mx";
DEPLOY_PATH = "/";


export default defineConfig({
  site: DEPLOY_DOMAIN,
  base: DEPLOY_PATH,
  build: {
    assets: "assets",
  },
});
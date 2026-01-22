/**
 * LEADS MB V-4.0
 */

// --- BLOQUE DE CONFIGURACIÓN ---
const CONFIG = {
  SHEET_NAME: "Leadsmb",
  BRAND_NAME: "Acosta Seguros",
  API_KEY: "Messi-10-Capitan",
  HONEYPOT_FIELD: "website",
  
  // Configuración de Emails
  EMAILS: {
    ADMIN: {
      TO: "ericka.acosta.gama@gmail.com, gonzalo@mediabrosonline.com", // Puedes agregar varios emails separados por coma
      SUBJECT: " Nuevo Lead: {{name}} - {{brand}}",
      // Template HTML para el cuerpo del mail
      BODY: "<h3> Se ha recibido un nuevo lead</h3><p>Detalles del contacto:</p><div style='background:#f8f8f8;padding:15px;border-radius:5px;'>{{details}}</div><br><hr><p>Enviado desde el sitio web de {{brand}}</p>"
    },
    USER: {
      ENABLE: true, // cambia a false para deshabilitar
      SUBJECT: "Confirmación de contacto — {{brand}}",
      // Template HTML para el cuerpo del mail
      BODY: "<h3>¡Hola {{name}}!</h3><p>Hemos recibido tu consulta correctamente en <strong>{{brand}}</strong>.</p><p>Un especialista se pondrá en contacto contigo a la brevedad.</p><br><p>Saludos,<br>El equipo de <strong>{{brand}}</strong></p>"
    }
  }
};

// --- LÓGICA PRINCIPAL ---

function doPost(e) {
  try {
    const payload = getPayload_(e);
    
    // 1. Honeypot check (Si detecta bot, sale silenciosamente)
    if (handleHoneypot_(payload)) {
      return jsonResponse_({ ok: true, msg: "Processed" });
    }

    // 2. Seguridad de Acceso (API Key)
    if (!validateAccess_(payload)) {
      return jsonResponse_({ ok: false, error: "Unauthorized access" }, 401);
    }

    // 3. Sanitización Universal y CSV Injection prevention
    const cleanData = sanitizeUniversal_(payload);

    // 4. Validación Mínima de campos críticos
    if (!cleanData.name || !cleanData.email || !isValidEmail_(cleanData.email)) {
      return jsonResponse_({ ok: false, error: "Datos obligatorios faltantes o inválidos" }, 400);
    }

    // 5. Guardar en Google Sheets (Campos dinámicos)
    saveLeadToSheet_(cleanData);

    // 6. Notificaciones (Email)
    sendNotifications_(cleanData);

    return jsonResponse_({ ok: true, msg: "Lead capturado con éxito" });

  } catch (err) {
    console.error("Critical Error:", err);
    return jsonResponse_({ ok: false, error: "Internal Server Error" }, 500);
  }
}

function doGet() {
  return jsonResponse_({ ok: true, msg: "Endpoint activo. Use POST para enviar leads." });
}

// --- MÓDULOS DE SEGURIDAD Y SANITIZACIÓN ---

/**
 * Valida la API_KEY recibida en el payload.
 */
function validateAccess_(payload) {
  const receivedKey = payload.api_key;
  
  // Validar API Key
  if (receivedKey !== CONFIG.API_KEY) {
    console.error("API Key inválida recibida");
    return false;
  }
  
  return true;
}

/**
 * Sanitiza recursivamente cualquier objeto JSON.
 */
function sanitizeUniversal_(obj) {
  const clean = {};
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      let val = obj[key].replace(/<[^>]*>?/gm, '').trim();
      if (/^[=+\-@]/.test(val)) val = "'" + val; 
      clean[key] = val;
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
}

/**
 * Si el campo honeypot tiene contenido, es un bot.
 */
function handleHoneypot_(payload) {
  return !!(payload[CONFIG.HONEYPOT_FIELD]);
}

// --- LÓGICA DE NEGOCIO ---

/**
 * Guarda el lead en la hoja de cálculo.
 */
function saveLeadToSheet_(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error("Hoja no encontrada: " + CONFIG.SHEET_NAME);

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => {
    const h = header.toString().toLowerCase().trim();
    if (h === 'timestamp' || h === 'fecha') return new Date();
    const key = Object.keys(data).find(k => k.toLowerCase() === h);
    return key ? data[key] : "";
  });

  sheet.appendRow(newRow);
}

/**
 * Envía correos al admin y al usuario usando templates del CONFIG.
 * Soporta HTML y Emojis.
 */
function sendNotifications_(data) {
  const brand = CONFIG.BRAND_NAME;
  const name = data.name || "Interesado";

  // Generar bloque de detalles HTML para el admin
  let detailsHtml = "";
  for (let key in data) {
    if (['api_key', 'origin', CONFIG.HONEYPOT_FIELD].includes(key)) continue;
    detailsHtml += `<p><strong>${key.toUpperCase()}:</strong> ${data[key]}</p>`;
  }

  // 1) Notificación Admin
  try {
    const adminConf = CONFIG.EMAILS.ADMIN;
    const adminRecipients = adminConf.TO.split(',').map(email => email.trim()).join(',');
    
    const adminSubject = adminConf.SUBJECT
      .replace(/{{name}}/g, name)
      .replace(/{{brand}}/g, brand);
    
    const adminBodyText = adminConf.BODY
      .replace(/<[^>]*>?/gm, '') // Strip HTML for plain text fallback
      .replace(/{{details}}/g, detailsHtml.replace(/<br>|<\/p>/g, '\n').replace(/<[^>]*>?/gm, ''))
      .replace(/{{name}}/g, name)
      .replace(/{{brand}}/g, brand);

    const adminBodyHtml = adminConf.BODY
      .replace(/{{details}}/g, detailsHtml)
      .replace(/{{name}}/g, name)
      .replace(/{{brand}}/g, brand);
    
    GmailApp.sendEmail(adminRecipients, adminSubject, adminBodyText, {
      htmlBody: adminBodyHtml
    });
  } catch (e) {
    console.error("Error enviando mail al Admin:", e);
  }

  // 2) Auto-reply Usuario
  try {
    const userConf = CONFIG.EMAILS.USER;
    if (userConf.ENABLE && data.email) {
      const userSubject = userConf.SUBJECT
        .replace(/{{name}}/g, name)
        .replace(/{{brand}}/g, brand);
        
      const userBodyText = userConf.BODY
        .replace(/<[^>]*>?/gm, '')
        .replace(/{{name}}/g, name)
        .replace(/{{brand}}/g, brand);

      const userBodyHtml = userConf.BODY
        .replace(/{{name}}/g, name)
        .replace(/{{brand}}/g, brand);
      
      GmailApp.sendEmail(data.email, userSubject, userBodyText, {
        htmlBody: userBodyHtml
      });
    }
  } catch (e) {
    console.error("Error enviando auto-reply:", e);
  }
}

// --- HELPERS ---

function getPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    // Fallback para form-encoded si fuera necesario
    const pairs = e.postData.contents.split('&');
    const obj = {};
    pairs.forEach(pair => {
      const split = pair.split('=');
      obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1] || "").replace(/\+/g, " ");
    });
    return obj;
  }
}

function isValidEmail_(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function jsonResponse_(obj, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}



const getWhatsAppConfig = () => ({
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  wabaId: process.env.WHATSAPP_WABA_ID,
});

async function whatsappFetch(endpoint: string, options: RequestInit = {}) {
  const { apiVersion, accessToken, phoneNumberId } = getWhatsAppConfig();

  if (!accessToken) {
    throw new Error('WHATSAPP_ACCESS_TOKEN is not defined');
  }

  const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('WhatsApp API Error:', JSON.stringify(data, null, 2));
    const error = data.error;
    const message = error?.error_data?.details || error?.message || 'WhatsApp API request failed';
    const code = error?.code ? ` (Code: ${error.code})` : '';
    const type = error?.type ? ` [${error.type}]` : '';
    throw new Error(`${message}${code}${type}`);
  }

  return data;
}

export async function sendText(to: string, text: string) {
  return whatsappFetch('messages', {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text },
    }),
  });
}

export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  parameters: string[] = [],
  buttonParam?: string
) {
  // Construct body component with parameters if provided
  const components: any[] = [];
  
  if (parameters.length > 0) {
    components.push({
      type: "body",
      parameters: parameters.map(p => ({
        type: "text",
        text: p
      }))
    });
  }

  if (buttonParam) {
    components.push({
      type: "button",
      sub_type: "copy_code",
      index: "0",
      parameters: [
        {
          type: "text",
          text: buttonParam
        }
      ]
    });
  }

  return whatsappFetch('messages', {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components,
      },
    }),
  });
}


export async function createTemplate(templateData: {
  name: string;
  category: string;
  language: string;
  components: any[];
}) {
  const { apiVersion, wabaId } = getWhatsAppConfig();
  if (!wabaId) {
    throw new Error('WHATSAPP_WABA_ID is not defined');
  }

  const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`;

  return whatsappFetch(url, {
    method: 'POST',
    body: JSON.stringify(templateData),
  });
}

export async function getTemplateStatus(templateName: string) {
  const { apiVersion, wabaId } = getWhatsAppConfig();
  if (!wabaId) {
    throw new Error('WHATSAPP_WABA_ID is not defined');
  }

  const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates?name=${templateName}`;

  return whatsappFetch(url, {
    method: 'GET',
  });
}

export async function listTemplates() {
  const { apiVersion, wabaId } = getWhatsAppConfig();
  if (!wabaId) {
    throw new Error('WHATSAPP_WABA_ID is not defined');
  }

  const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`;

  return whatsappFetch(url, {
    method: 'GET',
  });
}

/** Upload a file to the WhatsApp media endpoint and return the media_id */
export async function uploadMedia(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<{ id: string }> {
  const { apiVersion, accessToken, phoneNumberId } = getWhatsAppConfig();
  if (!accessToken) throw new Error('WHATSAPP_ACCESS_TOKEN is not defined');

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    const error = data.error;
    const message = error?.message || 'Media upload failed';
    throw new Error(message);
  }

  return data as { id: string };
}

/** Send a media message (image, document, audio, video) by media_id or link */
export async function sendMedia(
  to: string,
  mediaIdOrLink: string,
  mediaType: 'image' | 'document' | 'audio' | 'video',
  filename?: string,
  caption?: string
) {
  const mediaObject: Record<string, any> = {};
  if (mediaIdOrLink.startsWith("http")) {
      mediaObject.link = mediaIdOrLink;
  } else {
      mediaObject.id = mediaIdOrLink;
  }
  if (mediaType === 'document' && filename) {
    mediaObject.filename = filename;
  }
  if (caption && (mediaType === 'image' || mediaType === 'video')) {
    mediaObject.caption = caption;
  }

  return whatsappFetch('messages', {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: mediaType,
    }),
  });
}

/** Send an interactive message (buttons or lists) with optional media header */
export async function sendInteractive(
  to: string,
  interactive: any
) {
  return whatsappFetch('messages', {
    method: 'POST',
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: interactive,
    }),
  });
}

// src/lib/fonnte.ts

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

export interface SendWhatsAppResult {
  success: boolean;
  raw?: any;   // payload original dari Fonnte
  data?: any;  // alias untuk kompatibilitas kode lama
  error?: string;
}

/**
 * Helper utama untuk kirim pesan WhatsApp via Fonnte
 */
export async function sendWhatsAppMessage(
  target: string,
  message: string
): Promise<SendWhatsAppResult> {
  if (!FONNTE_TOKEN) {
    console.error("FONNTE_TOKEN belum di-set di .env.local");
    return {
      success: false,
      error: "FONNTE_TOKEN belum dikonfigurasi",
    };
  }

  try {
    const formData = new FormData();
    formData.append("target", target); // boleh 08xxxx atau 62xxxx
    formData.append("message", message);
    formData.append("countryCode", "62"); // biar 08xxx kebaca Indonesia

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_TOKEN,
      },
      body: formData,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Fonnte API error:", data);
      return {
        success: false,
        error: "Fonnte API mengembalikan error",
        raw: data,
        data, // alias
      };
    }

    return {
      success: true,
      raw: data,
      data, // alias (biar waResult.data tetap ada)
    };
  } catch (err: any) {
    console.error("Fonnte request error:", err);
    return {
      success: false,
      error: err?.message || "Gagal mengirim pesan ke Fonnte",
    };
  }
}

/**
 * Alias lama untuk kompatibel dengan kode yang masih import { sendWhatsApp }
 */
export async function sendWhatsApp(
  target: string,
  message: string
): Promise<SendWhatsAppResult> {
  return sendWhatsAppMessage(target, message);
}

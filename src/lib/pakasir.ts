// src/lib/pakasir.ts

const BASE_URL = "https://app.pakasir.com";

interface BuildPakasirUrlParams {
  orderId: string;
  amount: number; // rupiah
}

export function buildPakasirPayUrl(
  params: BuildPakasirUrlParams
): string | null {
  const slug = process.env.PAKASIR_PROJECT_SLUG; // contoh: "gmail-store"
  if (!slug) {
    console.error("PAKASIR_PROJECT_SLUG belum di-set di .env.local");
    return null;
  }

  const intAmount = Math.round(params.amount || 0);
  if (!intAmount || intAmount <= 0) {
    console.error("Nominal amount tidak valid untuk Pakasir:", params.amount);
    return null;
  }

  const url = new URL(`${BASE_URL}/pay/${slug}/${intAmount}`);

  // wajib: order_id
  url.searchParams.set("order_id", params.orderId);

  // redirect ke /thank-you sambil bawa order_id + amount
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/thank-you?order_id=${encodeURIComponent(
    params.orderId
  )}&amount=${intAmount}`;
  url.searchParams.set("redirect", redirectUrl);

  // optional: QRIS ONLY
  if (process.env.PAKASIR_QRIS_ONLY === "1") {
    url.searchParams.set("qris_only", "1");
  }

  return url.toString();
}

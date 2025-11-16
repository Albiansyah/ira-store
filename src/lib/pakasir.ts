// src/lib/pakasir.ts

const BASE_URL = "https://app.pakasir.com";

interface BuildPakasirUrlParams {
  orderId: string;
  amount: number; 
}

export function buildPakasirPayUrl(
  params: BuildPakasirUrlParams
): string | null {
  const slug = process.env.PAKASIR_PROJECT_SLUG; 
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

  url.searchParams.set("order_id", params.orderId);

  const baseRedirectUrl = process.env.PAKASIR_REDIRECT_URL || 
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/thank-you`;

  const redirectUrl = new URL(baseRedirectUrl);
  redirectUrl.searchParams.set("order_id", params.orderId);
  redirectUrl.searchParams.set("amount", intAmount.toString());
  
  url.searchParams.set("redirect", redirectUrl.toString());

  // optional: QRIS ONLY
  if (process.env.PAKASIR_QRIS_ONLY === "1") {
    url.searchParams.set("qris_only", "1");
  }

  return url.toString();
}
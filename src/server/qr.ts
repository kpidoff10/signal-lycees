import "server-only";
import QRCode from "qrcode";

/** QR code en SVG (généré sur le serveur : aucun service extérieur). */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#18201d", light: "#ffffff" } });
}

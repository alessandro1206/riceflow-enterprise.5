
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { BusinessState } from '../types';

// Use gemini-3-flash-preview for basic text analysis tasks
// Always initialize the client using the environment variable API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBusinessInsight = async (state: BusinessState): Promise<string> => {
  // Extract status of grain piles
  const pileStatus = state.piles.map(p => `Pile ${p.id}: ${p.currentWeight}kg`).join(', ');
  
  // Fix: changed 'productionInventory' to 'inventory' as defined in BusinessState and used 'productName'
  const finishedStock = state.inventory.map(i => `${i.productName}: ${i.quantity}kg`).join(', ');
  
  // Fix: changed 'results' to 'outputs' as defined in ProductionRecord and mapped names from inventory
  const productionLog = state.productionBook.slice(-5).map(r => {
    const outputDetails = r.outputs.map(o => {
      const prod = state.inventory.find(inv => inv.id === o.productId);
      return `${prod ? prod.productName : o.productId} ${o.weight}kg`;
    }).join(', ');
    return `Input ${r.totalInputWeight}kg (Rendemen ${r.yieldPercentage.toFixed(1)}%) -> Hasil: ${outputDetails}`;
  }).join('\n');

  // Fix: changed 'customerOrders' to 'salesBook' as defined in BusinessState and removed non-existent 'status'
  const pendingOrders = state.salesBook
    .map(o => {
      const totalQty = o.items.reduce((acc, item) => acc + item.quantity, 0);
      return `${o.customerName}: ${totalQty}kg`;
    })
    .join(', ');

  const prompt = `
    Bertindak sebagai manajer operasional pabrik beras (PT. Produksi & Trading).
    
    Data Lapangan:
    1. Stok Tumpukan Gabah: ${pileStatus}
    2. Stok Barang Jadi (Gudang Produksi): ${finishedStock}
    3. Catatan Produksi Terakhir (Realisasi Campuran):
       ${productionLog}
    4. Antrian Order Trading: ${pendingOrders || "Tidak ada"}

    Berikan analisis operasional singkat (maksimal 3 paragraf, Bahasa Indonesia):
    1. **Evaluasi Rendemen & Varian Produk:** Analisis efisiensi produksi terakhir. Perhatikan jika ada banyak varian limbah (Broken, Menir, Reject). Apakah komposisi input tumpukan (Mixing) mempengaruhi hasil limbah?
    2. **Kesiapan Stok:** Apakah stok tumpukan gabah aman untuk kebutuhan jangka pendek?
    3. **Rekomendasi Mixing:** Berikan saran pencampuran tumpukan untuk memaksimalkan Beras Kepala dan meminimalkan Broken/Menir.
    
    Gunakan format Markdown.
  `;

  try {
    // Correct usage of generateContent with model name and contents passed in the same call
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Accessing .text property directly as per Gemini API guidelines (not a method)
    return response.text || "Analisis tidak tersedia.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Gagal terhubung ke layanan AI.";
  }
};

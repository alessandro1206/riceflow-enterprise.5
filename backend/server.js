const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// WEBHOOK TRIGGERS
// ---------------------------------------------------------

// Endpoint for Electron to hit when a weighbridge transaction + ALPR is successful
app.post('/api/webhooks/weighbridge', async (req, res) => {
  try {
    const { plate, weight, status } = req.body;
    console.log(`[Webhook] New weighbridge transaction: Plate ${plate}, Weight ${weight}kg`);
    
    // TODO: Forward this payload to OpenClaw's external webhook URL using fetch() or axios
    // await fetch('https://openclaw.internal/webhooks/weighbridge', { ... })
    
    res.json({ success: true, message: 'Weighbridge transaction logged and forwarded to OpenClaw' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for OpenClaw to fetch End-Of-Day Journal & Production Yield
app.get('/api/reports/end-of-day', async (req, res) => {
  try {
    // Determine the start and end of the current day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayJournal = await prisma.journal.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } }
    });

    const todayProduction = await prisma.productionBook.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } }
    });

    res.json({
      success: true,
      data: { journal: todayJournal, production: todayProduction }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// COMMAND ENDPOINTS (For OpenClaw)
// ---------------------------------------------------------

// Endpoint for OpenClaw to generate Surat Jalan
app.post('/api/orchestration/surat-jalan', async (req, res) => {
  try {
    const { orderId } = req.body;
    console.log(`[Orchestration] Generating Surat Jalan for Order ID: ${orderId}`);
    
    // TODO: Fetch order details from database, retrieve customer & inventory info,
    // generate PDF using pdfkit or similar, and return the file or upload it to cloud storage.
    
    res.json({ 
      success: true, 
      message: `Surat Jalan generated successfully for ${orderId}`,
      pdfUrl: `/public/surat-jalan-${orderId}.pdf` // Mock URL
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for OpenClaw to check inventory alerts
app.get('/api/inventory/alerts', async (req, res) => {
  try {
    const inventoryItems = await prisma.inventory.findMany();
    
    // Find all items that are below their minimum threshold
    const lowStockAlerts = inventoryItems.filter(item => item.currentWeight < item.minimumThreshold);

    res.json({
      success: true,
      alertsCount: lowStockAlerts.length,
      alerts: lowStockAlerts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Basic Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend API Server running on http://localhost:${PORT}`);
});

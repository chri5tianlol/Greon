import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import * as turf from '@turf/turf';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: '../.env' });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

// File uploads setup
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Greon API is running' });
});

// --- AUTH ROUTES ---
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, subscriptionTier: 'free' }
    });

    res.json({ userId: user.id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Failed to register" });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ userId: user.id, name: user.name, email: user.email, properties: user.properties });
  } catch (err) {
    res.status(500).json({ error: "Failed to login" });
  }
});

// Dashboard Data
app.get('/api/dashboard', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    let user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { 
        properties: true,
        scans: {
          orderBy: { createdAt: 'desc' }
        }
      } 
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const scans = user.scans || [];
    
    // Calculate Sustainability Score based on actual scans
    const baseScore = 40;
    const scansScore = Math.min(scans.length * 10, 30); // Up to 30 points for multiple scans
    const totalPotential = scans.reduce((acc, scan) => acc + (scan.solarPotential || 0) + (scan.windPotential || 0), 0) || 1.2;
    const potentialScore = Math.min(Math.floor(totalPotential * 5), 30); // Up to 30 points for high potential
    const score = Math.min(baseScore + scansScore + potentialScore, 100);

    res.json({
      user,
      recentScans: scans,
      metrics: {
        sustainabilityScore: score,
        totalSolarPotential: totalPotential,
        estimatedProfit: 4500 + (scans.length * 150)
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Save User Property (Phase 6)
app.post('/api/properties', async (req, res) => {
  const { name, address, lat, lng, boundaryGeoJson, userId } = req.body;
  if (!userId || !lat || !lng || !boundaryGeoJson) {
    return res.status(400).json({ error: "Missing required property data." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { properties: true } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Subscription enforcement
    const maxProperties = user.subscriptionTier === 'premium' ? 3 : 1;
    if (user.properties.length >= maxProperties) {
      return res.status(403).json({ error: `You have reached your limit of ${maxProperties} properties on the ${user.subscriptionTier} tier.` });
    }

    // Duplicate claim prevention: check for confirmed properties within ~50m
    const confirmedProps = await prisma.property.findMany({ where: { verificationStatus: 'confirmed' } });
    const tooClose = confirmedProps.find(cp => {
      const dist = Math.sqrt(Math.pow((cp.lat - parseFloat(lat)) * 111320, 2) + Math.pow((cp.lng - parseFloat(lng)) * 111320 * Math.cos(cp.lat * Math.PI / 180), 2));
      return dist < 50;
    });
    if (tooClose) {
      return res.status(409).json({ error: 'This land area is already claimed and confirmed by another user.' });
    }

    const newProp = await prisma.property.create({
      data: {
        userId: user.id,
        name: name || "My Land",
        address: address || "Custom Location",
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        boundaryGeoJson: JSON.stringify(boundaryGeoJson)
      }
    });

    res.json(newProp);
  } catch (error) {
    console.error("Property Save Error:", error);
    res.status(500).json({ error: "Failed to save property." });
  }
});

// Delete Property (Phase 8)
app.delete('/api/properties/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  
  if (!id || !userId) return res.status(400).json({ error: "Missing required parameters" });

  try {
    const prop = await prisma.property.findUnique({ where: { id } });
    if (!prop) return res.status(404).json({ error: "Property not found" });
    if (prop.userId !== userId) return res.status(403).json({ error: "Unauthorized" });

    // Anti-spam: 7 day minimum life before deletion
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (prop.createdAt > sevenDaysAgo) {
      const availableDate = new Date(prop.createdAt);
      availableDate.setDate(availableDate.getDate() + 7);
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const day = availableDate.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      const formatted = `${months[availableDate.getMonth()]} ${day}${suffix} ${availableDate.getFullYear()}`;
      return res.status(403).json({ error: `Properties can only be deleted 7 days after creation. Try again on ${formatted}.` });
    }

    // Delete associated scans first
    await prisma.propertyScan.deleteMany({ where: { propertyId: id } });
    await prisma.property.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error("Property Delete Error:", error);
    res.status(500).json({ error: "Failed to delete property." });
  }
});

// Land Scanner (Core Logic)
app.post('/api/scan', async (req, res) => {
  const { address, userId, drawnPolygon, propertyId } = req.body;
  
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const activeUserId = userId;
    let lat, lng;
    let displayName = address || "Custom Location";
    
    // 1. Resolve Coordinates
    if (propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!prop) return res.status(404).json({ error: "Property not found" });
      lat = prop.lat;
      lng = prop.lng;
      displayName = prop.address !== "Custom GPS Location" ? prop.address : `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    } else {
      if (!address) return res.status(400).json({ error: "Address is required if no property ID is provided." });
      
      // Regex to match "31°08'39.3"N 99°20'27.4"W" or standard decimal "41.3275, 19.8189"
      const isDecimal = address.match(/^([-+]?[0-9]*\.?[0-9]+)[\s,]+([-+]?[0-9]*\.?[0-9]+)$/);
      const isDegMinSec = address.match(/^(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])$/i);

      if (isDecimal) {
        lat = parseFloat(isDecimal[1]);
        lng = parseFloat(isDecimal[2]);
      } else if (isDegMinSec) {
      lat = (parseFloat(isDegMinSec[1]) + parseFloat(isDegMinSec[2])/60 + parseFloat(isDegMinSec[3])/3600) * (isDegMinSec[4].toUpperCase() === 'S' ? -1 : 1);
      lng = (parseFloat(isDegMinSec[5]) + parseFloat(isDegMinSec[6])/60 + parseFloat(isDegMinSec[7])/3600) * (isDegMinSec[8].toUpperCase() === 'W' ? -1 : 1);
    } else {
      // OSM Nominatim Fallback
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const geoResponse = await fetch(nominatimUrl, { headers: { 'User-Agent': 'GreonApp/1.0' } });
      const geoData = await geoResponse.json();
      
      if (!geoData || geoData.length === 0) {
        return res.status(404).json({ error: "Could not find coordinates for this address." });
      }
      lat = parseFloat(geoData[0].lat);
      lng = parseFloat(geoData[0].lon);
      displayName = geoData[0].display_name || geoData[0].name || address;
    }
    }

    // 2. Fetch Environmental Data via Open-Meteo
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,direct_normal_irradiance&historical_weather=true`;
    const weatherRes = await fetch(meteoUrl);
    const weatherData = await weatherRes.json();
    
    const currentIrradiance = weatherData?.current?.direct_normal_irradiance || 0; // W/m²
    const currentWind = weatherData?.current?.wind_speed_10m || 0; // km/h

    // 2.5 Procedural Yard Boundary Generation OR Custom Defined Polygon (Turf.js)
    let yardGeoJson;
    let calculatedHectares;

    if (drawnPolygon && drawnPolygon.geometry && drawnPolygon.geometry.coordinates.length > 0) {
       yardGeoJson = drawnPolygon;
       const areaSqMeters = turf.area(yardGeoJson);
       calculatedHectares = (areaSqMeters / 10000).toFixed(3);
    } else {
      // Generate a mathematically perfect yard box (~0.12 Hectares) around the scan point.
      const pt = turf.point([lng, lat]);
      const optionsOpts = {units: 'meters'};
      
      // Create a 40x30 meter yard
      const ne = turf.destination(turf.destination(pt, 20, 0, optionsOpts), 15, 90, optionsOpts).geometry.coordinates;
      const se = turf.destination(turf.destination(pt, 20, 180, optionsOpts), 15, 90, optionsOpts).geometry.coordinates;
      const sw = turf.destination(turf.destination(pt, 20, 180, optionsOpts), 15, -90, optionsOpts).geometry.coordinates;
      const nw = turf.destination(turf.destination(pt, 20, 0, optionsOpts), 15, -90, optionsOpts).geometry.coordinates;
      
      yardGeoJson = turf.polygon([[nw, ne, se, sw, nw]]);
      const areaSqMeters = turf.area(yardGeoJson);
      calculatedHectares = (areaSqMeters / 10000).toFixed(3);
    }

    // 3. AI Analysis via Gemini
    const prompt = `
      You are Greon's expert land assessment AI. 
      Analyze the land at coordinates: Latitude ${lat}, Longitude ${lng}.
      We have physically traced the user's available yard space to exactly ${calculatedHectares} Hectares.
      Environmental Data snapshot: 
      - Direct Normal Irradiance: ${currentIrradiance} W/m² (Note: If this is 0, it likely just means it is currently night time at this location. Do not rule out solar based solely on a 0 snapshot if the region generally gets good sun.)
      - Wind Speed: ${currentWind} km/h
      
      Provide a concise recommendation for the best renewable energy installation (Solar vs Wind) that perfectly fits within the identified ${calculatedHectares} Hectare footprint. 
      Estimate the usable space based ONLY on this ${calculatedHectares} hectare boundary. 
      Format the output in a clean, short JSON structure:
      {
         "optimalMatch": "Utility-Scale Solar" or "Wind Farm" or "Hybrid" or "Residential Solar",
         "reasoning": "A 1 sentence explanation describing fitting it into the yard footprint.",
         "estimatedHectares": "${calculatedHectares}",
         "estimatedPanels": "Number",
         "estimatedDailySunHours": "Number"
      }
      Only return valid JSON. Do not include markdown blocks.
    `;

    let geminiData;
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });
      let geminiJsonStr = response.text || "{}";
      geminiJsonStr = geminiJsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      geminiData = JSON.parse(geminiJsonStr);
    } catch (aiError) {
      console.warn("Gemini AI failed (invalid API key or quota exceeded). Using fallback data.");
      geminiData = {
         optimalMatch: currentIrradiance > 500 ? "Residential Solar" : "Hybrid",
         reasoning: "Fallback recommendation based on irradiance levels for a residential yard.",
         estimatedHectares: calculatedHectares,
         estimatedPanels: Math.floor(calculatedHectares * 3500),
         estimatedDailySunHours: 5.5
      };
    }

    // 3.5 Generate Full Energy Report inline
    const panels = geminiData.estimatedPanels || Math.floor(calculatedHectares * 3500);
    const sunHrs = geminiData.estimatedDailySunHours || 5;
    
    const reportPrompt = `
      You are an expert energy analyst. Given a property at Lat ${lat}, Lng ${lng}:
      - Usable Land: ${calculatedHectares} Hectares
      - Solar Panels: ${panels}
      - Daily Sun Hours: ${sunHrs}
      - Irradiance: ${currentIrradiance} W/m²
      - Wind Speed: ${currentWind} km/h
      - System: ${geminiData.optimalMatch || 'Hybrid'}

      Generate a 12-month energy forecast. Return ONLY valid JSON:
      {
        "dailyAverages": { "solar_kWh": number, "wind_kWh": number, "hybrid_kWh": number },
        "bestMonth": {
          "solar": { "month": "MonthName", "kWh": number },
          "wind": { "month": "MonthName", "kWh": number },
          "hybrid": { "month": "MonthName", "kWh": number }
        },
        "worstMonth": {
          "solar": { "month": "MonthName", "kWh": number },
          "wind": { "month": "MonthName", "kWh": number },
          "hybrid": { "month": "MonthName", "kWh": number }
        },
        "monthlyBreakdown": [
          { "month": "Jan", "solar": number, "wind": number, "hybrid": number },
          { "month": "Feb", "solar": number, "wind": number, "hybrid": number },
          { "month": "Mar", "solar": number, "wind": number, "hybrid": number },
          { "month": "Apr", "solar": number, "wind": number, "hybrid": number },
          { "month": "May", "solar": number, "wind": number, "hybrid": number },
          { "month": "Jun", "solar": number, "wind": number, "hybrid": number },
          { "month": "Jul", "solar": number, "wind": number, "hybrid": number },
          { "month": "Aug", "solar": number, "wind": number, "hybrid": number },
          { "month": "Sep", "solar": number, "wind": number, "hybrid": number },
          { "month": "Oct", "solar": number, "wind": number, "hybrid": number },
          { "month": "Nov", "solar": number, "wind": number, "hybrid": number },
          { "month": "Dec", "solar": number, "wind": number, "hybrid": number }
        ]
      }
      Use realistic estimates. Only return valid JSON.
    `;

    let fullReport;
    try {
      const reportRes = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: reportPrompt });
      let rStr = reportRes.text || '{}';
      rStr = rStr.replace(/```json/g, '').replace(/```/g, '').trim();
      fullReport = JSON.parse(rStr);
    } catch {
      // Fallback report
      const bS = panels * sunHrs * 0.4;
      const bW = currentWind * calculatedHectares * 2;
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const sFactor = [0.6,0.7,0.85,1.0,1.15,1.25,1.3,1.25,1.05,0.8,0.6,0.5];
      const wFactor = [1.4,1.3,1.1,0.95,0.85,0.7,0.65,0.6,0.8,1.0,1.2,1.35];
      const days = [31,28,31,30,31,30,31,31,30,31,30,31];
      fullReport = {
        dailyAverages: { solar_kWh: Math.round(bS), wind_kWh: Math.round(bW), hybrid_kWh: Math.round(bS + bW) },
        bestMonth: { solar: { month: 'July', kWh: Math.round(bS*31*1.3) }, wind: { month: 'January', kWh: Math.round(bW*31*1.4) }, hybrid: { month: 'July', kWh: Math.round((bS+bW)*31*1.2) } },
        worstMonth: { solar: { month: 'December', kWh: Math.round(bS*31*0.5) }, wind: { month: 'August', kWh: Math.round(bW*31*0.6) }, hybrid: { month: 'December', kWh: Math.round((bS+bW)*31*0.6) } },
        monthlyBreakdown: months.map((m, i) => ({ month: m, solar: Math.round(bS*days[i]*sFactor[i]), wind: Math.round(bW*days[i]*wFactor[i]), hybrid: Math.round((bS*sFactor[i]+bW*wFactor[i])*days[i]) }))
      };
    }

    // 4. Save to Database
    const newScan = await prisma.propertyScan.create({
      data: {
        userId: activeUserId,
        propertyId: propertyId || null,
        address: displayName,
        lat,
        lng,
        solarIrradiance: currentIrradiance,
        windSpeed: currentWind,
        solarPotential: Math.round(currentIrradiance * 0.005 * 10) / 10,
        windPotential: Math.round(currentWind * 0.1 * 10) / 10,
        geminiRecommendation: JSON.stringify(geminiData),
        reportData: JSON.stringify(fullReport),
        rawData: JSON.stringify({ displayName, weatherData: weatherData.current })
      }
    });

    // 5. Return structured data to frontend
    res.json({
      scanId: newScan.id,
      address: newScan.address,
      coordinates: { lat, lng },
      boundaryGeoJson: yardGeoJson,
      environmental: {
        irradiance: currentIrradiance,
        windSpeed: currentWind
      },
      aiRecommendation: geminiData,
      reportData: fullReport
    });

  } catch (error) {
    console.error('Scan Error:', error);
    res.status(500).json({ error: 'Failed to process land scan', details: error.message });
  }
});

// Full Energy Report (Phase 10)
app.post('/api/report', async (req, res) => {
  const { scanId, userId } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!scanId) return res.status(400).json({ error: "Scan ID is required" });

  try {
    const scan = await prisma.propertyScan.findUnique({ where: { id: scanId } });
    if (!scan) return res.status(404).json({ error: "Scan not found" });
    if (scan.userId !== userId) return res.status(403).json({ error: "Unauthorized" });

    const geminiRec = scan.geminiRecommendation ? JSON.parse(scan.geminiRecommendation) : {};
    const hectares = geminiRec.estimatedHectares || 0.1;
    const panels = geminiRec.estimatedPanels || 10;
    const sunHours = geminiRec.estimatedDailySunHours || 5;
    const irradiance = scan.solarIrradiance || 400;
    const windSpeed = scan.windSpeed || 8;

    const prompt = `
      You are an expert energy analyst for Greon, a renewable energy platform.
      Given this data for a property at Lat ${scan.lat}, Lng ${scan.lng}:
      - Usable Land: ${hectares} Hectares
      - Estimated Solar Panels: ${panels}
      - Average Daily Sun Hours: ${sunHours}
      - Current Irradiance Snapshot: ${irradiance} W/m²
      - Current Wind Speed: ${windSpeed} km/h
      - Optimal System: ${geminiRec.optimalMatch || 'Hybrid'}

      Generate a detailed 12-month energy production forecast. Return ONLY valid JSON with this exact structure:
      {
        "dailyAverages": {
          "solar_kWh": number,
          "wind_kWh": number,
          "hybrid_kWh": number
        },
        "bestMonth": {
          "solar": { "month": "MonthName", "kWh": number },
          "wind": { "month": "MonthName", "kWh": number },
          "hybrid": { "month": "MonthName", "kWh": number }
        },
        "worstMonth": {
          "solar": { "month": "MonthName", "kWh": number },
          "wind": { "month": "MonthName", "kWh": number },
          "hybrid": { "month": "MonthName", "kWh": number }
        },
        "monthlyBreakdown": [
          { "month": "Jan", "solar": number, "wind": number, "hybrid": number },
          { "month": "Feb", "solar": number, "wind": number, "hybrid": number },
          { "month": "Mar", "solar": number, "wind": number, "hybrid": number },
          { "month": "Apr", "solar": number, "wind": number, "hybrid": number },
          { "month": "May", "solar": number, "wind": number, "hybrid": number },
          { "month": "Jun", "solar": number, "wind": number, "hybrid": number },
          { "month": "Jul", "solar": number, "wind": number, "hybrid": number },
          { "month": "Aug", "solar": number, "wind": number, "hybrid": number },
          { "month": "Sep", "solar": number, "wind": number, "hybrid": number },
          { "month": "Oct", "solar": number, "wind": number, "hybrid": number },
          { "month": "Nov", "solar": number, "wind": number, "hybrid": number },
          { "month": "Dec", "solar": number, "wind": number, "hybrid": number }
        ]
      }
      Use realistic estimates based on the latitude, climate zone, and equipment capacity.
      The "number" values for monthly breakdown should be total kWh produced that month.
      Only return valid JSON. Do not include markdown blocks.
    `;

    let reportData;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      let jsonStr = response.text || '{}';
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      reportData = JSON.parse(jsonStr);
    } catch (aiError) {
      console.warn('Gemini report failed, using fallback data.');
      // Generate realistic fallback based on scan data
      const baseSolar = panels * sunHours * 0.4; // ~0.4 kW per panel
      const baseWind = windSpeed * hectares * 2;
      reportData = {
        dailyAverages: {
          solar_kWh: Math.round(baseSolar),
          wind_kWh: Math.round(baseWind),
          hybrid_kWh: Math.round(baseSolar + baseWind)
        },
        bestMonth: {
          solar: { month: 'July', kWh: Math.round(baseSolar * 31 * 1.3) },
          wind: { month: 'January', kWh: Math.round(baseWind * 31 * 1.4) },
          hybrid: { month: 'July', kWh: Math.round((baseSolar + baseWind) * 31 * 1.2) }
        },
        worstMonth: {
          solar: { month: 'December', kWh: Math.round(baseSolar * 31 * 0.5) },
          wind: { month: 'August', kWh: Math.round(baseWind * 31 * 0.6) },
          hybrid: { month: 'December', kWh: Math.round((baseSolar + baseWind) * 31 * 0.6) }
        },
        monthlyBreakdown: [
          { month: 'Jan', solar: Math.round(baseSolar*31*0.6), wind: Math.round(baseWind*31*1.4), hybrid: Math.round((baseSolar*0.6+baseWind*1.4)*31) },
          { month: 'Feb', solar: Math.round(baseSolar*28*0.7), wind: Math.round(baseWind*28*1.3), hybrid: Math.round((baseSolar*0.7+baseWind*1.3)*28) },
          { month: 'Mar', solar: Math.round(baseSolar*31*0.85), wind: Math.round(baseWind*31*1.1), hybrid: Math.round((baseSolar*0.85+baseWind*1.1)*31) },
          { month: 'Apr', solar: Math.round(baseSolar*30*1.0), wind: Math.round(baseWind*30*0.95), hybrid: Math.round((baseSolar+baseWind*0.95)*30) },
          { month: 'May', solar: Math.round(baseSolar*31*1.15), wind: Math.round(baseWind*31*0.85), hybrid: Math.round((baseSolar*1.15+baseWind*0.85)*31) },
          { month: 'Jun', solar: Math.round(baseSolar*30*1.25), wind: Math.round(baseWind*30*0.7), hybrid: Math.round((baseSolar*1.25+baseWind*0.7)*30) },
          { month: 'Jul', solar: Math.round(baseSolar*31*1.3), wind: Math.round(baseWind*31*0.65), hybrid: Math.round((baseSolar*1.3+baseWind*0.65)*31) },
          { month: 'Aug', solar: Math.round(baseSolar*31*1.25), wind: Math.round(baseWind*31*0.6), hybrid: Math.round((baseSolar*1.25+baseWind*0.6)*31) },
          { month: 'Sep', solar: Math.round(baseSolar*30*1.05), wind: Math.round(baseWind*30*0.8), hybrid: Math.round((baseSolar*1.05+baseWind*0.8)*30) },
          { month: 'Oct', solar: Math.round(baseSolar*31*0.8), wind: Math.round(baseWind*31*1.0), hybrid: Math.round((baseSolar*0.8+baseWind)*31) },
          { month: 'Nov', solar: Math.round(baseSolar*30*0.6), wind: Math.round(baseWind*30*1.2), hybrid: Math.round((baseSolar*0.6+baseWind*1.2)*30) },
          { month: 'Dec', solar: Math.round(baseSolar*31*0.5), wind: Math.round(baseWind*31*1.35), hybrid: Math.round((baseSolar*0.5+baseWind*1.35)*31) },
        ]
      };
    }

    res.json(reportData);
  } catch (error) {
    console.error('Report Error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

// Community Neighbors — only confirmed properties
app.get('/api/community/neighbors', async (req, res) => {
  try {
    const confirmed = await prisma.property.findMany({
      where: { verificationStatus: 'confirmed' },
      include: { user: { select: { id: true, name: true } }, scans: { take: 1, orderBy: { createdAt: 'desc' } } }
    });
    const neighbors = confirmed.map(p => {
      try {
        const scan = p.scans?.[0];
        let rec = {};
        try { if (scan?.geminiRecommendation) rec = JSON.parse(scan.geminiRecommendation); } catch {}
        const hectares = Number(rec.estimatedHectares) || 0.1;
        return {
          id: p.id,
          userId: p.user?.id || 'UnknownId',
          name: p.user?.name || 'Unknown',
          address: p.address || '',
          lat: p.lat,
          lng: p.lng,
          capability: rec.optimalMatch || 'Hybrid',
          amount: `${hectares.toFixed(1)} ha`
        };
      } catch { return null; }
    }).filter(Boolean);
    res.json(neighbors);
  } catch (err) {
    console.error('Community neighbors error:', err);
    res.json([]);
  }
});

// Community Connection Requests
app.post('/api/community/connect', async (req, res) => {
  const { senderId, receiverId, receiverPropertyId } = req.body;
  if (!senderId || !receiverId || !receiverPropertyId) return res.status(400).json({ error: 'Missing parameters' });
  if (senderId === receiverId) return res.status(400).json({ error: 'Cannot connect with yourself' });

  try {
    const existing = await prisma.connectionRequest.findFirst({
      where: { senderId, receiverId, receiverPropertyId, status: 'pending' }
    });
    if (existing) return res.status(400).json({ error: 'Connection request already sent' });

    const reqData = await prisma.connectionRequest.create({
      data: { senderId, receiverId, receiverPropertyId }
    });
    res.json(reqData);
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ error: 'Failed to create connection request' });
  }
});

app.get('/api/community/requests', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const incoming = await prisma.connectionRequest.findMany({
      where: { receiverId: userId },
      include: { 
        sender: { select: { name: true, email: true } },
        property: { select: { name: true, address: true, lat: true, lng: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const outgoing = await prisma.connectionRequest.findMany({
      where: { senderId: userId },
      include: {
        receiver: { select: { name: true } },
        property: { select: { name: true, address: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

app.patch('/api/community/requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body; // status must be 'accepted' or 'declined'
  if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const connReq = await prisma.connectionRequest.findUnique({ where: { id } });
    if (!connReq) return res.status(404).json({ error: 'Request not found' });
    if (connReq.receiverId !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await prisma.connectionRequest.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// === VERIFICATION ROUTES (Phase 11) ===

// Submit verification
app.post('/api/properties/:id/verify', upload.single('proofCertificate'), async (req, res) => {
  const { id } = req.params;
  const { userId, phoneNumber } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const prop = await prisma.property.findUnique({ where: { id } });
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    if (prop.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });
    if (prop.verificationStatus === 'confirmed') return res.status(400).json({ error: 'Already confirmed' });
    if (prop.verificationStatus === 'in_review') return res.status(400).json({ error: 'Already under review' });

    const updated = await prisma.property.update({
      where: { id },
      data: {
        verificationStatus: 'in_review',
        phoneNumber: phoneNumber || null,
        proofCertificatePath: req.file ? req.file.filename : null,
        verificationSubmittedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Verification submit error:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// Admin: get all in-review properties
app.get('/api/admin/verifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || !admin.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const pending = await prisma.property.findMany({
      where: { verificationStatus: { in: ['in_review', 'confirmed', 'declined'] } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { verificationSubmittedAt: 'desc' }
    });

    res.json(pending);
  } catch (error) {
    console.error('Admin fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// Admin: update verification status
app.patch('/api/admin/verifications/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, status, note } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const validStatuses = ['confirmed', 'declined', 'unconfirmed'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || !admin.isAdmin) return res.status(403).json({ error: 'Admin access required' });

    const updated = await prisma.property.update({
      where: { id },
      data: {
        verificationStatus: status,
        verificationNote: note || null
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Admin update error:', error);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

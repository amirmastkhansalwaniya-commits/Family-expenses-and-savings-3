import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const CATEGORY_IDS = [
  'Groceries', 'SIP', 'EMI', 'Utilities', 'Medical', 'Fuel', 'Rent', 'Dining',
  'Education', 'Shopping', 'Entertainment', 'Household', 'Travel', 'Insurance',
  'Maintenance', 'PersonalCare', 'GiftsDonations', 'Subscriptions', 'Fitness',
  'Pets', 'BabyChild', 'Taxes', 'Business', 'SavingsReserve', 'Others'
];

app.post("/api/suggest-category", async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return res.status(400).json({ error: "Description text is required for AI suggestion." });
    }

    const ai = getAi();
    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Classify the following expense description into the single best matching expense category:
Description: "${notes.trim()}"`,
      config: {
        systemInstruction: `You are an AI financial expense categorization assistant for an Indian family expense tracker app.
Analyze the provided expense notes/description and select the best matching category ID from this allowed list:
${CATEGORY_IDS.join(", ")}

Mapping reference for Indian family expenses:
- Groceries: kirana, ration, atta, rice, dal, cooking oil, ghee, milk, veggies, fruits, Blinkit, Zepto, Instamart, D-Mart, eggs, bread, snacks
- Utilities: electricity bill, wifi, broadband, mobile recharge, LPG gas cylinder, water bill, DTH, cable
- Dining: Zomato, Swiggy, restaurant dinner, tea stall, coffee, pizza, burger, thali, bakery, canteen
- Shopping: clothes, footwear, shoes, Amazon, Flipkart, electronics, laptop, mobile, cosmetics
- Fuel: petrol, diesel, vehicle servicing, cab fare, Uber, Ola, auto rickshaw, FASTag, toll, parking
- Medical: doctor fee, pharmacy, medicines, lab test, hospital, dental, eye specs, health supplements
- Rent: house rent, maid salary, cook salary, shop rent, security salary
- EMI: home loan EMI, car loan, personal loan, credit card bill, phone EMI
- SIP: mutual funds, index funds, gold bond, SGB, fixed deposit, PPF, stock market
- Education: school fee, tuition classes, books, stationery, exam fee, school bus
- Entertainment: movie tickets, BookMyShow, OTT, Netflix, Hotstar, family trip
- Household: furniture, utensils, LED lights, bedding, pest control
- Travel: flight tickets, IRCTC train tickets, hotel stay, tour package
- Insurance: term insurance, health insurance, vehicle insurance
- Maintenance: AC service, plumber, electrician, mechanic repair, painting
- PersonalCare: haircut, salon, spa, grooming
- GiftsDonations: wedding gift, birthday present, mandir pooja, zakat, charity
- Subscriptions: Spotify, Netflix, Apple Music, cloud storage
- Fitness: gym fee, yoga, whey protein
- Pets: dog food, cat food, vet doctor
- BabyChild: diapers, baby wipes, baby food, toys
- Taxes: income tax, property tax, GST
- Business: office stationery, client coffee, coworking desk
- SavingsReserve: emergency deposit, gold coin
- Others: pocket money, misc, unplanned

Return a JSON object containing "category" (strictly one from the allowed list) and a brief 1-sentence "reason".`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The matching Category ID strictly from the allowed list."
            },
            reason: {
              type: Type.STRING,
              description: "Brief 1-sentence explanation for the suggestion."
            }
          },
          required: ["category"]
        }
      }
    });

    const resultText = response.text?.trim() || "";
    let jsonResult: { category: string; reason?: string } = { category: "Others" };
    try {
      jsonResult = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", resultText);
    }

    if (!CATEGORY_IDS.includes(jsonResult.category)) {
      jsonResult.category = "Others";
    }

    return res.json({
      category: jsonResult.category,
      reason: jsonResult.reason || "Matched based on description"
    });

  } catch (err: any) {
    console.error("Error calling Gemini API:", err);
    return res.status(500).json({ error: err.message || "Failed to generate AI category suggestion" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

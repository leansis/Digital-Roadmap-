import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/generate-process-map", async (req, res) => {
    try {
      const { cif } = req.body;
      if (!cif) {
        return res.status(400).json({ error: "CIF is required" });
      }

      const searchResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Busca información sobre la empresa con CIF/NIF/identificador: ${cif}. Dime a qué industria o sector pertenece y cuál es su actividad principal.`,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      const companyInfo = searchResponse.text;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Eres un experto consultor de procesos de negocio. Necesito que generes un mapa de procesos de alto nivel (basado libremente en la idea de APQC) para una empresa cuyo CIF/NIF/identificador es: ${cif}. Aquí tienes información sobre la empresa obtenida de internet:\n${companyInfo}\n\nInfiriendo la industria y sector de la empresa, tu conocimiento general y la información proporcionada, propón una lista de 6-10 Actividades (categorías de alto nivel) y dentro de ellas, 3-8 Procesos específicos.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              activities: {
                type: Type.ARRAY,
                description: "List of top-level activities",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["id", "name"]
                }
              },
              processes: {
                type: Type.ARRAY,
                description: "List of sub-processes belonging to the activities",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    activityId: { type: Type.STRING, description: "Must match the id of the parent activity" },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["id", "activityId", "name"]
                }
              }
            },
            required: ["activities", "processes"]
          }
        }
      });

      if (response.text) {
        const json = JSON.parse(response.text);
        res.json(json);
      } else {
        res.status(500).json({ error: "Failed to generate map" });
      }
    } catch (error: any) {
      console.error("Error generating process map:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

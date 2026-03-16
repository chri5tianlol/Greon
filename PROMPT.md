## Antigravity App Generation Prompt: GREON

**System Role:** You are an expert full-stack developer and UI/UX designer. Build a high-fidelity, interactive web application demo for a Climate Tech startup named "GREON". The demo must be highly polished, visually stunning, and structured to showcase core features for a 48-hour pitch delivery.

### 1. App Overview & Brand Identity
* **Mission:** Empower landowners to discover the renewable energy potential of their land using AI, eliminating capital waste and reducing carbon emissions.
* **Target Audience:** Landowners (primary) and green energy vendors/agencies (secondary). 
* **Visual System:**
    * **Primary Backgrounds:** White (#ffffff) or very light mint (#dafef9) for clean data visualization.
    * **Primary Brand Color (Headers/Nav):** Deep Forest Green (#0e362b) to convey physical earth and stability.
    * **Accent/Action Color (Buttons/Highlights):** Vibrant Mint Green (#78e6d0) for clean tech and energy.
    * [cite_start]**Typography:** Use "Neometric" (Medium) for primary display headings and "Poppins" (ranging from Bold 175pt for large headers to Thin 16pt for paragraphs) for all structural UI text and data tables [cite: 116, 117, 128, 129, 142-163].
    * **Iconography & Imagery:** Use organic, hand-drawn style icons for features (leaves, solar grids, wind turbines). Background images should be high-definition satellite/drone landscapes with subtle tech overlays.

### 2. Core Navigation & Layout
Build a responsive sidebar or top navigation containing the following:
* Dashboard (Overview)
* Land Scanner (The core AI tool)
* Energy Forecast & ROI
* Community Grid (Collaboration tools)
* Upgrade to Premium

### 3. Key Pages & Features to Generate

**A. The Land Scanner Interface (Main Feature)**
* **UI Elements:** A large, interactive map placeholder (simulating Google Maps API integration). A search bar to input a property address. 
* **Action:** When an address is "scanned", display a loading state simulating "NASA API Weather/Geostrategic fetching" and "Gemini AI processing".
* **Output:** A results panel showing the optimal renewable energy type (Solar/Wind) based on the scan.

**B. The User Dashboard (Data Visualization)**
* **Sustainability Badge:** Prominently display a generated "Sustainability Score and Badge" at the top.
* **Free vs. Premium Tiers:** Show data for a single renewable energy source (Free Tier). Include a locked, blurred section teasing "Hybrid Systems & Land Investment Options" with a CTA to upgrade to Premium. 
* **Profit & ROI Estimation:** Create clean, modular grid cards displaying projected monthly energy generation and estimated commission/lease profits.

**C. Community & Sharing (The Differentiator)**
* **UI Elements:** A map view highlighting neighboring properties.
* **Action:** Provide a "Merge Grid" recommendation feature. Show a simulated calculation of how much ROI increases if the user collaborates with their neighbors to form a local energy grid.

### 4. Technical Simulation & Tone
* **Tone of Voice:** Ensure all UI copy is authoritative yet accessible. Do not use overly complex developer jargon on the user-facing dashboards. Use visionary and actionable language. 
* **API Placeholders:** Structure the backend logic (or mock data states) to clearly indicate where the NASA API (for weather/climate), Google Maps API (for satellite imagery), and Gemini AI API (for text generation and feasibility logic) will plug in.
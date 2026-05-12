import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Kosovo Transparency API running on http://localhost:${PORT}`);
});

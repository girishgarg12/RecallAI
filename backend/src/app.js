import express from "express";
import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import errorHandler from "./errors/errorHandler.js";
import knowledgeBase from "./routes/knowledgeBase.routes.js";
const app = express();

app.use(express.json());

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/workspaces", workspaceRoutes);
app.use("/knowledgeBase", knowledgeBase);
app.use(errorHandler);

export default app;
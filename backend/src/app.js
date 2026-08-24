import express from "express";
import userRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import errorHandler from "./errors/errorHandler.js";
import knowledgeBaseRoutes from "./routes/knowledgeBase.routes.js";
import documentRoutes from "./routes/document.routes.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/workspaces", workspaceRoutes);
app.use("/knowledge-bases", knowledgeBaseRoutes);
app.use("/knowledge-bases", documentRoutes);
app.use(errorHandler);


export default app;
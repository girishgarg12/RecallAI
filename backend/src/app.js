import express from "express";
import routes from "./routes/users.routes.js";
const app = express();

app.use(express.json());

app.use("/users", routes);

export default app;
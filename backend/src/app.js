import express from "express";
import routes from "./routes/users.routes.js";
import errorHandler from "./errors/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/users", routes);

app.use(errorHandler);

export default app;
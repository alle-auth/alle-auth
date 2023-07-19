import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import compression from "compression";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes/index";
import { getEnvironment } from "./config/environment";
import { exec } from "child_process";

const app = express();
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

mongoose.Promise = global.Promise;
mongoose.set("strictQuery", true);
mongoose
  .connect(getEnvironment().DATABASE as string, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 40000,
    family: 4,
  } as mongoose.ConnectOptions)
  .then(() => {
    console.log("Connected to the database successfully");
    const command = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
    exec(`${command} http://localhost:${getEnvironment().PORT}`);
  })
  .catch((error) => console.error("Could not connect to the database", error));

app.use("/api/v1/", routes);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send("Alle Auth API suite");
});

const server = app.listen(getEnvironment().PORT, () => {
  console.log(`Alle Auth Server is listening on port ${getEnvironment().PORT} with environment ${getEnvironment().ENVIRONMENT}`);
});

export default server;

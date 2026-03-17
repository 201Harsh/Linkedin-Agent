import "./config/dotenv.js";
import http from "http";
import app from "./app.js";
import ConnectTODB from "./database/mongo-db.js";

const server = http.createServer(app);
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  ConnectTODB();
});

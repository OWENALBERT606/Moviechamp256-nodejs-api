require("dotenv").config();

import express from "express";
import userRouter from "./routes/users";
import authRouter from "./routes/auth";
import genreRouter from "./routes/genres";
import releaseYearRouter from "./routes/releaseYear";
import vjRouter from "./routes/vjs";
import { watch } from "fs";
import watchHistoryRouter from "./routes/watchHistory";
import movieRouter from "./routes/movies";
import seriesRouter from "./routes/series";
import seasonRouter from "./routes/seasons";
import episodeRouter from "./routes/episodes";
import myListRouter from "./routes/mylist";
import searchRouter from "./routes/search";
import paymentRouter from "./routes/payments";
import userxRouter from "./routes/usersx";
import dashboardRouter from "./routes/dashboard";
import adminRouter from "./routes/admin";

const cors = require("cors");
const app = express();
app.use(cors());
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`); 
});

app.use("/api/v1", userRouter); 
app.use("/api/v1",authRouter);
app.use("/api/v1", genreRouter);
app.use("/api/v1", releaseYearRouter); 
app.use("/api/v1", vjRouter); 
app.use("/api/v1", watchHistoryRouter); 
app.use("/api/v1", movieRouter);
app.use("/api/v1", seriesRouter);
app.use("/api/v1", seasonRouter);
app.use("/api/v1", episodeRouter);
app.use("/api/v1", myListRouter); 
app.use("/api/v1", watchHistoryRouter);
app.use("/api/v1", searchRouter);
app.use("/api/v1", paymentRouter);
app.use("/api/v1", userxRouter);
app.use("/api/v1", dashboardRouter);
app.use("/api/v1", adminRouter);













"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const genres_1 = __importDefault(require("./routes/genres"));
const releaseYear_1 = __importDefault(require("./routes/releaseYear"));
const vjs_1 = __importDefault(require("./routes/vjs"));
const watchHistory_1 = __importDefault(require("./routes/watchHistory"));
const movies_1 = __importDefault(require("./routes/movies"));
const series_1 = __importDefault(require("./routes/series"));
const seasons_1 = __importDefault(require("./routes/seasons"));
const episodes_1 = __importDefault(require("./routes/episodes"));
const mylist_1 = __importDefault(require("./routes/mylist"));
const search_1 = __importDefault(require("./routes/search"));
const payments_1 = __importDefault(require("./routes/payments"));
const usersx_1 = __importDefault(require("./routes/usersx"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const admin_1 = __importDefault(require("./routes/admin"));
const metadata_routes_1 = __importDefault(require("./routes/metadata.routes"));
const stream_1 = __importDefault(require("./routes/stream"));
const cors = require("cors");
const app = (0, express_1.default)();
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://flickerplay-frontend.vercel.app",
        /\.vercel\.app$/,
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());
const PORT = process.env.PORT || 8000;
app.use(express_1.default.json());
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
app.use("/api/v1", users_1.default);
app.use("/api/v1", auth_1.default);
app.use("/api/v1", genres_1.default);
app.use("/api/v1", releaseYear_1.default);
app.use("/api/v1", vjs_1.default);
app.use("/api/v1", watchHistory_1.default);
app.use("/api/v1", movies_1.default);
app.use("/api/v1", series_1.default);
app.use("/api/v1", seasons_1.default);
app.use("/api/v1", episodes_1.default);
app.use("/api/v1", mylist_1.default);
app.use("/api/v1", watchHistory_1.default);
app.use("/api/v1", search_1.default);
app.use("/api/v1", payments_1.default);
app.use("/api/v1", usersx_1.default);
app.use("/api/v1", dashboard_1.default);
app.use("/api/v1", admin_1.default);
app.use("/api/v1", metadata_routes_1.default);
app.use("/api/v1", stream_1.default);

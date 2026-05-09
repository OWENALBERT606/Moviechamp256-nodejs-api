"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const releaseYear_1 = require("../controllers/releaseYear");
const releaseYearRouter = express_1.default.Router();
releaseYearRouter.get("/release-years", releaseYear_1.getAllReleaseYears);
releaseYearRouter.get("/release-years/:id", releaseYear_1.getReleaseYearById);
releaseYearRouter.get("/release-years/value/:value", releaseYear_1.getReleaseYearByValue);
releaseYearRouter.post("/release-years", releaseYear_1.createReleaseYear);
releaseYearRouter.put("/release-years/:id", releaseYear_1.updateReleaseYear);
releaseYearRouter.delete("/release-years/:id", releaseYear_1.deleteReleaseYear);
exports.default = releaseYearRouter;

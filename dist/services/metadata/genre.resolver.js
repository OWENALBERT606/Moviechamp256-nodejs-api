"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGenre = resolveGenre;
function resolveGenre(tmdbGenreName, prisma) {
    return __awaiter(this, void 0, void 0, function* () {
        const slug = tmdbGenreName.toLowerCase().replace(/\s+/g, "-");
        let genre = yield prisma.genre.findUnique({ where: { slug } });
        if (genre)
            return genre.id;
        genre = yield prisma.genre.findFirst({
            where: { name: { equals: tmdbGenreName, mode: "insensitive" } },
        });
        if (genre)
            return genre.id;
        genre = yield prisma.genre.create({
            data: { name: tmdbGenreName, slug },
        });
        return genre.id;
    });
}

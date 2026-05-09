"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.loginUser = loginUser;
exports.getAllUsers = getAllUsers;
exports.getCurrentUser = getCurrentUser;
exports.deleteUser = deleteUser;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
const db_1 = require("../db/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importStar(require("crypto"));
const tokens_1 = require("../utils/tokens");
const client_1 = require("@prisma/client");
function generateAccountNumber() {
    return `GK${(0, crypto_1.randomInt)(1000000, 10000000)}`;
}
const isValidRole = (v) => Object.values(client_1.UserRole).includes(v);
const isValidStatus = (v) => Object.values(client_1.UserStatus).includes(v);
const makeSixDigitToken = () => String(crypto_1.default.randomInt(0, 1000000)).padStart(6, "0");
function createUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, phone, password, firstName, lastName, imageUrl, role, status, } = req.body;
        try {
            if (!email || !phone || !password || !firstName || !lastName) {
                return res.status(400).json({ data: null, error: "Missing required fields." });
            }
            if (password.length < 6) {
                return res.status(400).json({
                    data: null,
                    error: "Password must be at least 6 characters long."
                });
            }
            const emailNorm = email.trim().toLowerCase();
            const phoneNorm = phone.trim();
            const roleValue = isValidRole(role) ? role : client_1.UserRole.USER;
            const statusValue = client_1.UserStatus.ACTIVE;
            const existing = yield db_1.db.user.findFirst({
                where: { OR: [{ email: emailNorm }, { phone: phoneNorm }] },
                select: { id: true },
            });
            if (existing) {
                return res
                    .status(409)
                    .json({ data: null, error: "User with this email or phone already exists" });
            }
            const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
            let newUser;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    newUser = yield db_1.db.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                        const accountNumber = yield generateAccountNumber();
                        const user = yield tx.user.create({
                            data: {
                                email: emailNorm,
                                phone: phoneNorm,
                                firstName,
                                lastName,
                                name: `${firstName} ${lastName}`.trim(),
                                imageUrl,
                                password: hashedPassword,
                                role: roleValue,
                                status: statusValue,
                                emailVerified: true,
                                isApproved: true,
                                token: null,
                            },
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                name: true,
                                email: true,
                                phone: true,
                                imageUrl: true,
                                role: true,
                                status: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        });
                        return user;
                    }));
                    break;
                }
                catch (err) {
                    if ((err === null || err === void 0 ? void 0 : err.code) === "P2002" && attempt < 2) {
                        continue;
                    }
                    throw err;
                }
            }
            if (!newUser) {
                return res.status(500).json({ data: null, error: "Failed to create user." });
            }
            return res.status(201).json({ data: newUser, error: null });
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.code) === "P2002") {
                return res.status(409).json({ data: null, error: "Email or phone already in use" });
            }
            console.error("Error creating user:", error);
            return res.status(500).json({ data: null, error: "Something went wrong" });
        }
    });
}
function loginUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { identifier, password } = req.body;
        try {
            if (!identifier || !password) {
                return res.status(400).json({ data: null, error: "Missing credentials" });
            }
            const idNorm = identifier.trim().toLowerCase();
            const user = yield db_1.db.user.findFirst({
                where: {
                    OR: [{ email: idNorm }, { phone: identifier.trim() }],
                },
            });
            if (!user) {
                return res.status(401).json({ data: null, error: "Invalid credentials" });
            }
            if (user.status !== "ACTIVE") {
                return res.status(403).json({ data: null, error: "User account is not active" });
            }
            if (!user.password) {
                return res
                    .status(401)
                    .json({ data: null, error: "This account has no password. Use social login or reset password." });
            }
            const ok = yield bcryptjs_1.default.compare(password, user.password);
            if (!ok) {
                return res.status(401).json({ data: null, error: "Invalid credentials" });
            }
            const payload = {
                userId: user.id,
                phone: user.phone,
                email: user.email,
                role: user.role,
            };
            const accessToken = (0, tokens_1.generateAccessToken)(payload);
            const refreshToken = (0, tokens_1.generateRefreshToken)(payload);
            yield db_1.db.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            });
            const { password: _pw } = user, safe = __rest(user, ["password"]);
            return res.status(200).json({
                data: { user: safe, accessToken, refreshToken },
                error: null,
            });
        }
        catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ data: null, error: "An error occurred during login" });
        }
    });
}
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield db_1.db.user.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    accounts: true,
                    sessions: false,
                    refreshTokens: false,
                },
            });
            const safe = users.map((_a) => {
                var { password } = _a, u = __rest(_a, ["password"]);
                return u;
            });
            return res.status(200).json({ data: safe, error: null });
        }
        catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({ data: null, error: "Failed to fetch users" });
        }
    });
}
function getCurrentUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId)) {
                return res.status(401).json({ data: null, error: "Unauthorized" });
            }
            const user = yield db_1.db.user.findUnique({
                where: { id: req.user.userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    name: true,
                    email: true,
                    phone: true,
                    emailVerified: true,
                    status: true,
                    isApproved: true,
                    imageUrl: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user)
                return res.status(404).json({ data: null, error: "User not found" });
            return res.status(200).json({ data: user, error: null });
        }
        catch (error) {
            console.error("Error fetching current user:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function deleteUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const existingUser = yield db_1.db.user.findUnique({ where: { id } });
            if (!existingUser)
                return res.status(404).json({ data: null, error: "User not found" });
            yield db_1.db.user.update({
                where: { id },
                data: { status: client_1.UserStatus.DEACTIVATED },
            });
            return res.status(200).json({ data: null, message: "User deactivated successfully" });
        }
        catch (error) {
            console.error("Error deleting user:", error);
            return res.status(500).json({ data: null, error: "Failed to delete user" });
        }
    });
}
function getUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const user = yield db_1.db.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    name: true,
                    email: true,
                    phone: true,
                    emailVerified: true,
                    status: true,
                    isApproved: true,
                    imageUrl: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                return res.status(404).json({ data: null, error: "User not found" });
            }
            return res.status(200).json({ data: user, error: null });
        }
        catch (error) {
            console.error("Error fetching user by id:", error);
            return res.status(500).json({ data: null, error: "Server error" });
        }
    });
}
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { firstName, lastName, email, phone, role, status, password, imageUrl, emailVerified, isActive, isApproved, } = req.body;
        try {
            const existingUser = yield db_1.db.user.findUnique({ where: { id } });
            if (!existingUser)
                return res.status(404).json({ data: null, error: "User not found" });
            if (email || phone) {
                const emailNorm = email === null || email === void 0 ? void 0 : email.trim().toLowerCase();
                const phoneNorm = phone === null || phone === void 0 ? void 0 : phone.trim();
                const conflict = yield db_1.db.user.findFirst({
                    where: {
                        OR: [{ email: emailNorm !== null && emailNorm !== void 0 ? emailNorm : undefined }, { phone: phoneNorm !== null && phoneNorm !== void 0 ? phoneNorm : undefined }],
                        NOT: { id },
                    },
                    select: { id: true },
                });
                if (conflict) {
                    return res.status(409).json({ data: null, error: "Email or phone already in use by another user" });
                }
            }
            const roleValue = role !== undefined ? (isValidRole(role) ? role : undefined) : undefined;
            const statusValue = status !== undefined ? (isValidStatus(status) ? status : undefined) : undefined;
            const hashedPassword = password ? yield bcryptjs_1.default.hash(password, 12) : undefined;
            const nextFirst = firstName !== null && firstName !== void 0 ? firstName : existingUser.firstName;
            const nextLast = lastName !== null && lastName !== void 0 ? lastName : existingUser.lastName;
            const updatedUser = yield db_1.db.user.update({
                where: { id },
                data: {
                    firstName: nextFirst,
                    lastName: nextLast,
                    name: `${nextFirst} ${nextLast}`.trim(),
                    email: email ? email.trim().toLowerCase() : existingUser.email,
                    phone: phone ? phone.trim() : existingUser.phone,
                    role: roleValue !== null && roleValue !== void 0 ? roleValue : existingUser.role,
                    status: statusValue !== null && statusValue !== void 0 ? statusValue : existingUser.status,
                    password: hashedPassword !== null && hashedPassword !== void 0 ? hashedPassword : existingUser.password,
                    imageUrl: imageUrl !== null && imageUrl !== void 0 ? imageUrl : existingUser.imageUrl,
                    emailVerified: emailVerified !== null && emailVerified !== void 0 ? emailVerified : existingUser.emailVerified, isApproved: isApproved !== null && isApproved !== void 0 ? isApproved : existingUser.isApproved,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    status: true,
                    imageUrl: true,
                    emailVerified: true,
                    isApproved: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return res.status(200).json({ data: updatedUser, error: null });
        }
        catch (error) {
            console.error("Error updating user:", error);
            return res.status(500).json({ data: null, error: "Failed to update user" });
        }
    });
}

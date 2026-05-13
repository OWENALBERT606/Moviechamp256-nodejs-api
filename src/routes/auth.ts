
// routes/auth.ts
import { forgotPassword, resendVerification, resetPassword, verifyEmail, googleAuth, googleAuthCallback } from "@/controllers/auth";
import { Router } from "express";

const authRouter = Router();
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.post("/auth/reset-password", resetPassword);
authRouter.post("/auth/verify-email", verifyEmail);
authRouter.post("/auth/resend-verification", resendVerification);
authRouter.post("/auth/google", googleAuth);
authRouter.get("/auth/google/callback", googleAuthCallback);
export default authRouter;

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const jwt_service_1 = require("../common/jwt.service");
let ProfileService = class ProfileService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async getPublicProfile(userId) {
        if (!userId) {
            throw new common_1.BadRequestException("User ID required");
        }
        let profile = await this.prisma.userProfile.findUnique({
            where: { userId },
            include: { user: true },
        });
        if (!profile) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new common_1.BadRequestException("User not found");
            }
            profile = await this.prisma.userProfile.create({
                data: {
                    userId,
                    firstName: null,
                    lastName: null,
                    photoURL: null,
                },
                include: { user: true },
            });
        }
        const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
            "Anonymous";
        return {
            displayName,
            email: profile.user.email,
            photoURL: profile.photoURL ?? undefined,
        };
    }
    async updateProfile(authHeader, payload) {
        if (!authHeader?.startsWith("Bearer ")) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        const token = authHeader.slice(7);
        const jwtPayload = await this.jwt.verify(token);
        if (!jwtPayload) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        const { userId, profileData } = payload;
        if (!userId || !Array.isArray(profileData) || !profileData[0]) {
            throw new common_1.BadRequestException("Invalid request data");
        }
        if (jwtPayload.id !== userId) {
            throw new common_1.UnauthorizedException("Unauthorized");
        }
        const p = profileData[0];
        await this.prisma.userProfile.upsert({
            where: { userId },
            create: {
                userId,
                firstName: p.firstName,
                lastName: p.lastName,
                photoURL: p.imageUrl,
            },
            update: {
                firstName: p.firstName,
                lastName: p.lastName,
                photoURL: p.imageUrl,
            },
        });
        return { success: true, message: "Profile updated successfully" };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        jwt_service_1.JwtService])
], ProfileService);

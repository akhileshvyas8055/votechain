import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { cacheSet, cacheDel, cacheGet } from '../config/redis';
import { comparePassword, generateSecureToken } from '../utils/crypto';
import { JWTPayload, MachineAuthPayload } from '../types';

export class AuthService {
  /**
   * Authenticate officer and return tokens.
   */
  static async login(email: string, password: string) {
    const officer = await prisma.electionOfficer.findUnique({
      where: { email },
    });

    if (!officer || !officer.isActive) {
      throw new Error('Invalid credentials or inactive account');
    }

    const isValidPassword = await comparePassword(password, officer.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.electionOfficer.update({
      where: { id: officer.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JWTPayload = {
      officerId: officer.id,
      email: officer.email,
      role: officer.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = generateSecureToken();

    // Store refresh token in Redis (7 days TTL by default)
    const ttlMatches = env.JWT_REFRESH_EXPIRES_IN.match(/(\d+)d/);
    const ttlDays = ttlMatches ? parseInt(ttlMatches[1], 10) : 7;
    await cacheSet(`rt_${refreshToken}`, officer.id, ttlDays * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
      officer: {
        id: officer.id,
        name: officer.name,
        role: officer.role,
        email: officer.email,
      },
    };
  }

  /**
   * Logout user by invalidating tokens.
   */
  static async logout(accessToken: string, refreshToken?: string) {
    // Add access token to blacklist in Redis (using a standard TTL based on expiry)
    // To be precise we should decode and set TTL to remaining time, but 24h is safe fallback
    await cacheSet(`bl_${accessToken}`, 'revoked', 24 * 60 * 60);

    // Delete refresh token if provided
    if (refreshToken) {
      await cacheDel(`rt_${refreshToken}`);
    }
  }

  /**
   * Generate new access token using a valid refresh token.
   */
  static async refreshTokens(refreshToken: string) {
    const officerId = await cacheGet(`rt_${refreshToken}`);
    
    if (!officerId) {
      throw new Error('Invalid or expired refresh token');
    }

    const officer = await prisma.electionOfficer.findUnique({
      where: { id: officerId },
    });

    if (!officer || !officer.isActive) {
      throw new Error('Account inactive or not found');
    }

    const payload: JWTPayload = {
      officerId: officer.id,
      email: officer.email,
      role: officer.role,
    };

    const newAccessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    // Rotate refresh token
    const newRefreshToken = generateSecureToken();
    const ttlMatches = env.JWT_REFRESH_EXPIRES_IN.match(/(\d+)d/);
    const ttlDays = ttlMatches ? parseInt(ttlMatches[1], 10) : 7;
    
    await cacheDel(`rt_${refreshToken}`);
    await cacheSet(`rt_${newRefreshToken}`, officer.id, ttlDays * 24 * 60 * 60);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Generate an authentication token for an EVM machine.
   * Only BOOTH_OFFICER or above should call this.
   */
  static async generateMachineToken(boothCode: string): Promise<string> {
    const booth = await prisma.booth.findUnique({
      where: { boothCode },
    });

    if (!booth || !booth.isActive) {
      throw new Error('Booth not found or inactive');
    }

    if (!booth.machineId) {
      throw new Error('No machine assigned to this booth');
    }

    // Token format: boothCode:machineId:secureHash
    const secureHash = generateSecureToken(32);
    const token = `${booth.boothCode}:${booth.machineId}:${secureHash}`;

    // Store hash in DB
    await prisma.machineToken.upsert({
      where: { boothCode: booth.boothCode },
      update: {
        tokenHash: secureHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours validity
      },
      create: {
        boothCode: booth.boothCode,
        tokenHash: secureHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  /**
   * Validate machine token.
   */
  static async validateMachineToken(token: string): Promise<MachineAuthPayload> {
    const parts = token.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [boothCode, machineId, secureHash] = parts;

    const machineToken = await prisma.machineToken.findUnique({
      where: { boothCode },
    });

    if (!machineToken || !machineToken.isActive) {
      throw new Error('Token revoked or not found');
    }

    if (machineToken.tokenHash !== secureHash) {
      throw new Error('Invalid token hash');
    }

    if (new Date() > machineToken.expiresAt) {
      throw new Error('Token expired');
    }

    return { boothCode, machineId };
  }

  /**
   * Placeholder for 2FA Verification.
   */
  static async verifyTwoFactor(officerId: string, code: string): Promise<boolean> {
    // Implement TOTP verification (e.g., speakeasy)
    return code === '123456'; // Dummy implementation for development
  }
}

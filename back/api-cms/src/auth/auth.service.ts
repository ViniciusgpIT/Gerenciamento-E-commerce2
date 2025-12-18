import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  LoginUserDto,
  UserResponseDto,
  LoginResponseDto,
} from './dto/create-user.dto';
import { AuditService } from '../audit/audit.service'; // Adicione esta importação

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService, // Adicione esta linha
  ) {}

  async register(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar se o usuário já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
      },
    });

    // Registrar log de criação de usuário
    await this.auditService.createLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'USER',
      entityId: user.id,
      details: {
        action: 'user_registration',
        userEmail: user.email,
        userName: user.name,
        timestamp: new Date().toISOString(),
      },
    });

    // Remover a senha do retorno
    const { password, ...result } = user;
    return result;
  }

  async login(
    loginUserDto: LoginUserDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<LoginResponseDto> {
    // Buscar usuário pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: loginUserDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Registrar log de login
    await this.auditService.logLogin(user.id, ipAddress, userAgent);

    // Gerar token JWT
    const payload = { email: user.email, sub: user.id, name: user.name };
    const access_token = this.jwtService.sign(payload);

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const { password, ...result } = user;
    return result;
  }

  async getProfile(userId: number): Promise<UserResponseDto> {
    return this.findById(userId);
  }
  async logout(
    userId: number,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Registrar log de logout
    await this.auditService.logLogout(userId, ipAddress, userAgent);
  }
}

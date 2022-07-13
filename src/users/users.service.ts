import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MongoRepository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as dotEnv from 'dotenv';
import * as randomstring from 'randomstring';
import { EmailService } from 'src/emails/email.service';
import { ObjectId } from 'mongodb';
import {AuthService} from "../auth/auth.service";
dotEnv.config();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
    private emailService: EmailService,
    private authService: AuthService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const userByUsername = await this.findByUsername(createUserDto.username);
    const userByEmail = await this.findByEmail(createUserDto.email);
    if (userByEmail || userByUsername) {
      throw new HttpException('User already exists.', HttpStatus.UNAUTHORIZED);
    }
    const user = await this.usersRepository.save({
      ...createUserDto,
      isActive: false,
    });
    await this.sendOtp(user);
    return this.authService.login(user);
  }
  async sendOtp(user) {
    const otp = randomstring.generate({length: 6, charset: 'numeric'});
    await this.emailService.sendActivationEmail(user, otp);
    await this.usersRepository.update(user.id, {otp, otpSentAt: new Date()});
  }
  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: ObjectId): Promise<User> {
    return this.usersRepository.findOneById(id);
  }

  async findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneBy({ username });
  }
  async findByActivationKey(key: string): Promise<User> {
    return this.usersRepository.findOneBy({ activationKey: key });
  }
  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOneBy({
      email,
    });
  }

  async update(id: ObjectId, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.update({ id }, { ...updateUserDto });
    return user;
  }
  async activateUser(id: ObjectId) {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.update({ id }, { isActive: true });
    return user;
  }
  async remove(id: ObjectId): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.delete({ id });
    return user;
  }
}

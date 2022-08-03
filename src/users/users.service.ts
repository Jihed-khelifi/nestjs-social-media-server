import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {CreateUserDto} from './dto/create-user.dto';
import {MongoRepository} from 'typeorm';
import {User} from './entities/user.entity';
import {InjectRepository} from '@nestjs/typeorm';
import * as dotEnv from 'dotenv';
import * as randomstring from 'randomstring';
import {EmailService} from 'src/emails/email.service';
import {ObjectId} from 'mongodb';
import {AuthService} from "../auth/auth.service";
import {UserDobDto} from "./dto/user-dob.dto";

dotEnv.config();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
    private emailService: EmailService,
    private authService: AuthService,
  ) {
      usersRepository.createCollectionIndex({location: '2dsphere'}).then();
  }
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
  async findByCountry(country: string): Promise<User[]> {
    return this.usersRepository.findBy({
      country,
    });
  }
  async updateDob(id: ObjectId, updateUserDto: UserDobDto): Promise<User> {
    await this.usersRepository.update({ id }, { ...updateUserDto });
    return await this.usersRepository.findOneById(id);
  }
  async activateUser(id: ObjectId) {
    const user = await this.usersRepository.findOneById(id);
    await this.usersRepository.update({ id }, { isActive: true });
    return user;
  }
}

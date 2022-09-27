import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { MongoRepository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as dotEnv from 'dotenv';
import * as randomstring from 'randomstring';
import { EmailService } from 'src/emails/email.service';
import { ObjectId } from 'mongodb';
import { AuthService } from '../auth/auth.service';
import { UserDobDto } from './dto/user-dob.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ThemesService } from '../themes/themes.service';
import { DeleteUserEntity } from './entities/delete_user.entity';
import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';

dotEnv.config();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
    @InjectRepository(DeleteUserEntity)
    private deleteUserEntityMongoRepository: MongoRepository<DeleteUserEntity>,
    private emailService: EmailService,
    private authService: AuthService,
    private themeService: ThemesService,
  ) {
    usersRepository.createCollectionIndex({ location: '2dsphere' }).then();
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
    const theme = await this.themeService.createTheme(
      {
        accentColor: '#DEDEDE',
        bgColor: '#f2efea',
        borderColor: '#f2efea',
        cardBackground: '#ffffff',
        name: 'Continuem Default',
        negativeColor: '#c50606',
        negativeTextColor: '#ffffff',
        neutralColor: '#E79502',
        neutralTextColor: '#ffffff',
        positiveColor: '#308739',
        positiveTextColor: '#ffffff',
        primaryColor: '#E79502',
        primaryTextColor: '#0d0d0d',
        routineTextColor: '#4D4D4D',
        secondaryBackgroundColor: '#ffffff',
        default: true,
      },
      user.id,
    );
    user.theme = theme._id;
    await this.updateUser(user.id, { ...user });
    await this.sendOtp(user);
    return this.authService.login(user);
  }

  async sendOtp(user) {
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    await this.emailService.sendActivationEmail(user, otp);
    await this.usersRepository.update(user.id, { otp, otpSentAt: new Date() });
  }

  async findAll() {
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

  async getNearbyActiveUsers(user): Promise<User[]> {
    return this.usersRepository
      .aggregate([
        {
          $geoNear: {
            near: user.location,
            spherical: true,
            distanceMultiplier: 0.001,
            distanceField: 'distance',
          },
        },
        {
          $match: {
            isOnline: true,
          },
        },
        {
          $limit: 5000,
        },
        {
          $project: {
            id: '$_id',
            _id: 0,
          },
        },
      ])
      .toArray();
  }

  async updateDob(id: ObjectId, updateUserDto: UserDobDto): Promise<User> {
    await this.usersRepository.update({ id }, { ...updateUserDto });
    return await this.usersRepository.findOneById(id);
  }

  async updateUsername(
    id: ObjectId,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.usersRepository.find({
      where: {
        username: updateUserDto.username,
      },
    });
    if (user.length) {
      throw new HttpException(
        'User with same username already exists.',
        HttpStatus.BAD_GATEWAY,
      );
    }
    await this.usersRepository.update({ id }, { ...updateUserDto });
    return await this.usersRepository.findOneById(id);
  }
  async updateUser(id: ObjectId, updateUserDto: UpdateUserDto): Promise<User> {
    await this.usersRepository.update({ id }, { ...updateUserDto });
    return await this.usersRepository.findOneById(id);
  }
  async deleteAccount(id: ObjectId): Promise<User> {
    const user = await this.usersRepository.findOneById(id);
    await this.deleteUserEntityMongoRepository.save({
      userId: id,
      deleted: false,
      deleteRequestedOn: new Date(),
      user,
      toBeDeletedOn: moment().add(30, 'days').endOf('day').toDate(),
    });
    await this.usersRepository.update(id, { deleteRequested: true });
    return user;
  }
  async recoverAccount(id: ObjectId): Promise<User> {
    await this.deleteUserEntityMongoRepository.delete({
      userId: id,
    });
    await this.usersRepository.update(id, { deleteRequested: false });
    return this.usersRepository.findOneById(id);
  }
  async getDeleteRequest(id: ObjectId): Promise<DeleteUserEntity> {
    return this.deleteUserEntityMongoRepository.findOneBy({
      userId: id,
    });
  }
  @Cron('* * * * *')
  async deleteScheduler() {
    const deleteRequested = await this.deleteUserEntityMongoRepository.findBy({
      deleted: false,
      toBeDeletedOn: {
        $gte: new Date(moment().format('YYYY/MM/DD')),
        $lt: new Date(
          new Date(moment().format('YYYY/MM/DD')).getTime() +
            60 * 60 * 24 * 1000,
        ),
      },
    });
    for (const user of deleteRequested) {
      await this.usersRepository.delete(new ObjectId(user.userId));
      await this.deleteUserEntityMongoRepository.update(user.id, {
        deleted: true,
      });
    }
  }
  async activateUser(id: ObjectId) {
    const user = await this.usersRepository.findOneById(id);
    await this.usersRepository.update({ id }, { isActive: true });
    return user;
  }
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { MongoRepository, ObjectID } from 'typeorm';
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
import { LinkedAccountUserEntity } from './entities/linked_account_user.entity';
import { CreateLinkAccountUserDto } from './dto/create-link-account-user.dto';
import { BlockedUsersEntity } from './entities/blocked_user.entity';
import { ConnectionsService } from 'src/connections/connections.service';
import { v4 as uuidv4 } from 'uuid';

dotEnv.config();

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
    @InjectRepository(LinkedAccountUserEntity)
    private linkedAccountUserEntityMongoRepository: MongoRepository<LinkedAccountUserEntity>,
    @InjectRepository(BlockedUsersEntity)
    private blockedUsersEntityMongoRepository: MongoRepository<BlockedUsersEntity>,
    @InjectRepository(DeleteUserEntity)
    private deleteUserEntityMongoRepository: MongoRepository<DeleteUserEntity>,
    private emailService: EmailService,
    private authService: AuthService,
    private themeService: ThemesService,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionService: ConnectionsService,
  ) {
    usersRepository.createCollectionIndex({ location: '2dsphere' }).then();
  }

  async create(createUserDto: CreateUserDto) {
    createUserDto.email = createUserDto.email.trim();
    const userByUsername = await this.findByUsername(createUserDto.username);
    const userByEmail = await this.findByEmail(createUserDto.email);
    if (userByEmail || userByUsername) {
      throw new HttpException('User already exists.', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.usersRepository.save({
      ...createUserDto,
      isActive: false,
      uuid: uuidv4(),
    });
    const theme = await this.themeService.createTheme(
      {
        accentColor: '#DDDDDD',
        bgColor: '#FFFFFF',
        borderColor: '#f2efea',
        cardBackground: '#F9F9F9',
        name: 'Continuem Default',
        negativeColor: '#DD0000',
        negativeTextColor: '#FFFFFF',
        neutralColor: '#FFB329',
        neutralTextColor: '#FFFFFF',
        positiveColor: '#00B012',
        positiveTextColor: '#FFFFFF',
        primaryColor: '#804BC7',
        primaryTextColor: '#404040',
        routineTextColor: '#4D4D4D',
        secondaryBackgroundColor: '#FFFFFF',
        default: true,
      },
      user.id,
    );
    user.theme = theme._id;
    const connection = await this.connectionService.createConnection({
      userId: user.id,
      followers: [],
      following: [],
      connections: [],
    });
    user.connection = connection.id;
    await this.updateUser(user.id, { ...user });
    await this.sendOtp(user);
    return this.authService.login(user, true);
  }
  async createSocialLoginUser(createUserDto: CreateUserDto) {
    createUserDto.email = createUserDto.email.trim();
    const userByUsername = await this.findByUsername(createUserDto.username);
    const userByEmail = await this.findByEmail(createUserDto.email);
    if (userByEmail || userByUsername) {
      throw new HttpException('User already exists.', HttpStatus.UNAUTHORIZED);
    }
    const user = await this.usersRepository.save({
      ...createUserDto,
      isActive: true,
      uuid: uuidv4(),
    });
    const theme = await this.themeService.createTheme(
      {
        accentColor: '#DDDDDD',
        bgColor: '#FFFFFF',
        borderColor: '#f2efea',
        cardBackground: '#F9F9F9',
        name: 'Continuem Default',
        negativeColor: '#DD0000',
        negativeTextColor: '#FFFFFF',
        neutralColor: '#FFB329',
        neutralTextColor: '#FFFFFF',
        positiveColor: '#00B012',
        positiveTextColor: '#FFFFFF',
        primaryColor: '#804BC7',
        primaryTextColor: '#404040',
        routineTextColor: '#4D4D4D',
        secondaryBackgroundColor: '#FFFFFF',
        default: true,
      },
      user.id,
    );
    user.theme = theme._id;
    const connection = await this.connectionService.createConnection({
      userId: user.id,
      followers: [],
      following: [],
      connections: [],
    });
    user.connection = connection.id;
    await this.updateUser(user.id, { ...user });
    return this.authService.login(user);
  }

  async sendOtp(user) {
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    await this.emailService.sendOtpEmail(
      'welcome.html',
      'Continue - Verify Account',
      user,
      otp,
    );
    await this.usersRepository.update(user.id, { otp, otpSentAt: new Date() });
  }
  async sendChangePasswordOtp(user) {
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    await this.emailService.sendOtpEmail(
      'change-password.html',
      'Continue - Verify Account',
      user,
      otp,
    );
    await this.usersRepository.update(user.id, { otp, otpSentAt: new Date() });
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: ObjectID): Promise<User> {
    return this.usersRepository.findOneBy({
      _id: new ObjectId(id),
    });
  }

  async getUserByProfessionalCode(code: string): Promise<User> {
    return this.usersRepository.findOneBy({
      professionalCode: code,
    });
  }

  async findByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneBy({ username: { $regex: `^${username}`, $options: 'i' } });
  }

  async findByActivationKey(key: string): Promise<User> {
    return this.usersRepository.findOneBy({ activationKey: key });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOneBy({
      email: { $regex: `^${email}`, $options: 'i' },
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
            maxDistance: 200000,
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
  async deleteAccount(id: ObjectId): Promise<DeleteUserEntity> {
    const user = await this.usersRepository.findOneById(id);
    const deleteUserEntity = await this.deleteUserEntityMongoRepository.save({
      userId: id,
      deleted: false,
      deleteRequestedOn: new Date(),
      user,
      toBeDeletedOn: moment().add(30, 'days').endOf('day').toDate(),
    });
    await this.usersRepository.update(id, { deleteRequested: true });
    return deleteUserEntity;
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
  async requestShareDataToProfessional(
    createLinkAccountUserDto: CreateLinkAccountUserDto,
  ) {
    return this.linkedAccountUserEntityMongoRepository.save(
      createLinkAccountUserDto,
    );
  }
  async banUnbanUser(userId: string) {
    const user = await this.usersRepository.findOneById(userId);
    if (user && (user.isBanned === undefined || user.isBanned === null)) {
      user.isBanned = false;
    }
    return this.usersRepository.update(
      { id: user.id },
      { isBanned: !user.isBanned },
    );
  }
  async getBannedUsers() {
    return this.usersRepository.findBy({ isBanned: true });
  }
  async blockUnblockUser(currentUser: User, blockedTo: ObjectId) {
    const blockedEntity =
      await this.blockedUsersEntityMongoRepository.findOneBy({
        blockedBy: currentUser.id,
        blockedTo: new ObjectId(blockedTo),
      });
    if (blockedEntity) {
      await this.blockedUsersEntityMongoRepository.deleteOne({
        _id: blockedEntity.id,
      });
    } else {
      await this.blockedUsersEntityMongoRepository.save({
        blockedBy: currentUser.id,
        blockedTo: new ObjectId(blockedTo),
      });
      await this.connectionService.unfollow(currentUser, blockedTo);
    }
  }
  async getBlockedUsers(user) {
    return this.blockedUsersEntityMongoRepository
      .aggregate([
        {
          $match: {
            blockedBy: user.id,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'blockedTo',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 0,
            id: '$user._id',
            username: '$user.username',
          },
        },
      ])
      .toArray();
  }

  async updateAvatar(user: User, updateUserDto: UpdateUserDto) {
    const previousAvatar = user.avatar;
    await this.usersRepository.update(
      { id: user.id },
      { ...updateUserDto, previousAvatar },
    );
    return await this.usersRepository.findOneById(user.id);
  }

  async searchByUsername(user: User, username: string) {
    const blockedUsers = [];
    if (user) {
      const blocked = await this.blockedUsersEntityMongoRepository.findBy({
        $or: [{ blockedBy: user.id }, { blockedTo: user.id }],
      });
      for (const u of blocked) {
        if (u.blockedBy.toString() !== user.id.toString()) {
          blockedUsers.push(u.blockedBy);
        } else {
          blockedUsers.push(u.blockedTo);
        }
      }
    }

    const bannedUsers = await this.getBannedUsers();
    return this.usersRepository
      .aggregate([
        {
          $match: {
            username: {
              $regex: username,
              $options: 'i',
            },
            _id: {
              $nin: [...blockedUsers, ...bannedUsers],
            },
          },
        },
        {
          $project: {
            password: 0,
            activationKey: 0,
            otp: 0,
            otpSentAt: 0,
            isActive: 0,
          },
        },
      ])
      .toArray();
  }

  async getUserProfileByUsername(user: User, username: string) {
    const usernameUserDoc = await this.usersRepository.findOneBy({
      username,
    });
    const userConnection = await this.connectionService.findOneBy(user.id);
    const userProfile = await this.usersRepository
      .aggregate([
        {
          $match: {
            username,
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'userId',
            as: 'posts',
          },
        },
        {
          $project: {
            isFollowing: {
              $cond: {
                if: {
                  $in: [
                    new ObjectId(usernameUserDoc.id),
                    [
                      ...userConnection.following.map(
                        (userId) => new ObjectId(userId.userId),
                      ),
                    ],
                  ],
                },
                then: true,
                else: false,
              },
            },
            isConnected: {
              $cond: {
                if: {
                  $in: [
                    new ObjectId(usernameUserDoc.id),
                    [
                      ...userConnection.connections.map(
                        (userId) => new ObjectId(userId.userId),
                      ),
                    ],
                  ],
                },
                then: true,
                else: false,
              },
            },
            first_name: 1,
            last_name: 1,
            username: 1,
            avatar: 1,
            posts: 1,
            createdAt: 1,
            title: 1,
            country: 1,
            state: 1,
            city: 1,
            location: 1,
            isProfessional: 1,
            isActive: 1,
            dob: 1,
            isOnline: 1,
          },
        },
      ])
      .toArray();

    if (userProfile.length === 0) {
      throw new NotFoundException('User not found');
    }

    return { ...userProfile[0] };
  }
  async getUserProfileByUserId(user: User, userId: string) {
    const usernameUserDoc = await this.usersRepository.findOneBy({
      id: new ObjectId(userId),
    });
    const userConnection = await this.connectionService.findOneBy(user.id);
    const userProfile = await this.usersRepository
      .aggregate([
        {
          $match: {
            id: new ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'userId',
            as: 'posts',
          },
        },
        {
          $project: {
            isFollowing: {
              $cond: {
                if: {
                  $in: [
                    new ObjectId(usernameUserDoc.id),
                    [
                      ...userConnection.following.map(
                        (u) => new ObjectId(u.userId),
                      ),
                    ],
                  ],
                },
                then: true,
                else: false,
              },
            },
            isConnected: {
              $cond: {
                if: {
                  $in: [
                    new ObjectId(usernameUserDoc.id),
                    [
                      ...userConnection.connections.map(
                        (u) => new ObjectId(u.userId),
                      ),
                    ],
                  ],
                },
                then: true,
                else: false,
              },
            },
            first_name: 1,
            last_name: 1,
            username: 1,
            avatar: 1,
            posts: 1,
            createdAt: 1,
            title: 1,
            country: 1,
            state: 1,
            city: 1,
            location: 1,
            isProfessional: 1,
            isActive: 1,
            dob: 1,
            isOnline: 1,
          },
        },
      ])
      .toArray();

    if (userProfile.length === 0) {
      throw new NotFoundException('User not found');
    }

    return { ...userProfile[0] };
  }
}

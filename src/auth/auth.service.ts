import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { faker } from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ConfigEntity } from '../config.entity';
import appleSignin from 'apple-signin-auth';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(ConfigEntity)
    private configEntityMongoRepository: MongoRepository<ConfigEntity>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        return this.login(user);
      }
    }
    return null;
  }
  async validateGoogleUser(idToken: string): Promise<any> {
    try {
      const configEntity = await this.configEntityMongoRepository.findOne({});
      const client = new OAuth2Client(configEntity.googleClientKey);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: configEntity.googleClientKey,
      });

      const googlePayload = ticket.getPayload();
      const email = googlePayload['email'];
      let user: any = await this.usersService.findByEmail(email);

      if (!user) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        user = await this.usersService.createSocialLoginUser({
          email: email,
          first_name: firstName,
          last_name: lastName,
          password: '',
          username: faker.internet.userName({ firstName, lastName }),
          title: '',
          country: '',
          state: '',
          city: '',
          professionalCode: '',
          loggedInWith: 'google',
        });
      }
      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        isActive: user.isActive,
        dob: user.dob,
        userName: user.first_name,
        email: user.email,
        userId: user.id,
        deleteRequested: user.deleteRequested,
        isAdmin: user.isAdmin,
        message: 'User logged in successfully.',
        professionalCode: user.professionalCode,
        isBanned: user.isBanned,
      };
    } catch (e) {
      console.log(e);
      throw new HttpException('Google Login Failed', 400);
    }
  }
  async validateAppleUser(idToken: string): Promise<any> {
    try {
      const applePayload = await appleSignin.verifyIdToken(idToken);
      const email = applePayload['email'];
      let user: any = await this.usersService.findByEmail(email);
      if (!user) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        user = await this.usersService.createSocialLoginUser({
          email: email,
          first_name: firstName,
          last_name: lastName,
          password: '',
          username: faker.internet.userName({ firstName, lastName }),
          title: '',
          country: '',
          state: '',
          city: '',
          professionalCode: '',
          loggedInWith: 'apple',
        });
      }
      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        isActive: user.isActive,
        dob: user.dob,
        userName: user.first_name,
        email: user.email,
        userId: user.id,
        deleteRequested: user.deleteRequested,
        isAdmin: user.isAdmin,
        message: 'User logged in successfully.',
        professionalCode: user.professionalCode,
        isBanned: user.isBanned,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException('Apple Login Failed', 400);
    }
  }
  async login(user: User, justSignedup?) {
    const payload = { email: user.email, sub: user.id };
    if (!user.isActive && !justSignedup) {
      await this.usersService.sendOtp(user);
    }
    let data = {
      deleteRequestedOn: null,
    };
    if (user.deleteRequested) {
      data = await this.usersService.getDeleteRequest(user.id);
    }
    return {
      access_token: this.jwtService.sign(payload),
      isActive: user.isActive,
      dob: user.dob,
      userName: user.first_name,
      email: user.email,
      userId: user.id,
      deleteRequested: user.deleteRequested,
      deleteRequestedOn: data.deleteRequestedOn,
      isAdmin: user.isAdmin,
      message: 'User logged in successfully.',
      professionalCode: user.professionalCode,
      isBanned: user.isBanned,
    };
  }
}

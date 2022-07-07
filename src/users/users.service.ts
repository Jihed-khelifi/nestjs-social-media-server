import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MongoRepository, ObjectID } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: MongoRepository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    await this.usersRepository.save({
      ...createUserDto,
      isActive: true,
    });
    return 'This action adds a new user';
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: ObjectID): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async update(id: ObjectID, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.update({ id }, { ...updateUserDto });
    return user;
  }

  async remove(id: ObjectID): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    await this.usersRepository.delete({ id });
    return user;
  }
}

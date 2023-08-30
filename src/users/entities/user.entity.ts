import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';
import { LocationType } from '../dto/create-user.dto';
import { ConnectionEntity } from 'src/connections/entities/connections.entity';

@Entity('users')
export class User {
  @ObjectIdColumn()
  id: ObjectID;

  @Column({ nullable: false })
  first_name: string;

  @Column({ nullable: false })
  last_name: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false })
  otp: string;

  @Column()
  otpVerified: boolean;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  location: LocationType;

  @ObjectIdColumn({ name: 'theme' })
  theme: ObjectID;

  @Column({ default: false })
  isOnline = false;

  @Column({ type: 'timestamp', nullable: true })
  dob?: Date;

  @Column({ type: 'timestamp', nullable: true })
  otpSentAt?: Date;

  @Column()
  activationKey: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: false })
  deleteRequested: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isProfessional: boolean;

  @Column()
  professionalCode: string;

  title: string;

  @ObjectIdColumn({ name: 'connection' })
  connection: ObjectID;
}

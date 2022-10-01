import { Entity, Column, ObjectIdColumn, ObjectID } from 'typeorm';
import { LocationType } from '../dto/create-user.dto';

@Entity('users')
export class User {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  otp: string;

  @Column()
  otpVerified: boolean;

  @Column()
  country: string;

  @Column()
  state: string;

  @Column()
  city: string;

  @Column()
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
  deleteRequested: boolean;
}

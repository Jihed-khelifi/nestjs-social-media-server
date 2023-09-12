import { Entity, Column, ObjectIdColumn, ObjectID, Generated } from 'typeorm';

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

  @Column({ generated: 'uuid' })
  @Generated('uuid')
  uuid: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: '' })
  avatar: string;

  @Column({ default: '' })
  previousAvatar: string;

  @Column({ default: false })
  is_subscribed: boolean;

  @Column({ default: '' })
  subscription: string;

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

  @Column()
  logggedInWith: string
}

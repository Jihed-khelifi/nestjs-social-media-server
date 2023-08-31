import { IsString, IsEmail } from "class-validator";

export class CreateUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  username: string;

  @IsString()
  title: string;


  @IsString()
  country: string;

  @IsString()
  state: string;

  @IsString()
  city: string;



  isProfessional?: boolean;

  professionalCode: string;
}

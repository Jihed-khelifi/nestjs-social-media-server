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
  
  location: LocationType;

  isProfessional?: boolean;

  professionalCode: string;
}
export interface LocationType {
  type: string;
  coordinates: number[];
}
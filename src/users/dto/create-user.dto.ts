export class CreateUserDto {
  name: string;
  email: string;
  username: string;
  password: string;
  country: string;
  state: string;
  city: string;
  location: LocationType;
  isProfessional?: boolean;
  professionalCode: string
}
export interface LocationType {
  type: string;
  coordinates: number[];
}
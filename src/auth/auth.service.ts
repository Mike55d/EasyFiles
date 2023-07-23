import { HttpException, Injectable } from '@nestjs/common';
import { Users, UsersDocument } from '../users/schema/users.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { hash, compare } from 'bcrypt';
import { RegisterUserDto } from 'src/users/dto/register-user.dto';
import { JwtService } from '@nestjs/jwt/dist';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
    private jwtService: JwtService,
  ) {}

  async register(userObject: RegisterUserDto) {
    const { password } = userObject;
    const plainToHash = await hash(password, 10);
    userObject = { ...userObject, password: plainToHash };
    const user = new this.usersModel(userObject);
    await user.save();
    return 'user created';
  }

  async login(userObject: RegisterUserDto) {
    const { email, password } = userObject;
    const user = await this.usersModel.findOne({ email });
    if (!user) throw new HttpException('User not found', 404);
    const checkPassword = await compare(password, user.password);
    if (!checkPassword) throw new HttpException('password incorrect', 403);
    const payload = { email };
    const token = this.jwtService.sign(payload);
    const data = { user: user.email, token };
    return data;
  }
}

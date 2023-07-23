import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Options } from 'nodemailer/lib/smtp-transport';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordTokenDto } from './dto/change-password-token.dto';
import { hash, compare } from 'bcrypt';

@Injectable()
export class MailingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    @InjectModel(Users.name) private usersModel: Model<UsersDocument>,
    private jwtService: JwtService,
  ) {}

  private async setTransport() {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      this.configService.get('CLIENT_ID'),
      this.configService.get('CLIENT_SECRET'),
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken: string = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject('Failed to create access token');
        }
        resolve(token);
      });
    });
    const config: Options = {
      service: 'gmail',
      name: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get('EMAIL'),
        clientId: this.configService.get('CLIENT_ID'),
        clientSecret: this.configService.get('CLIENT_SECRET'),
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    };
    this.mailerService.addTransporter('gmail', config);
  }

  public async sendMailRecovery(changePasswordDto: ChangePasswordDto) {
    const { email } = changePasswordDto;
    const user = await this.usersModel.findOne({ email });
    console.log(email);
    if (!user) throw new HttpException('User not found', 404);
    console.log(user);
    const payload = { id: user._id.toString() };
    const token = this.jwtService.sign(payload);
    await this.setTransport();
    this.mailerService
      .sendMail({
        transporterName: 'gmail',
        to: email, // list of receivers
        from: 'noreply@nestjs.com', // sender address
        subject: 'Change Password Token', // Subject line
        template: 'action',
        context: {
          // Data to bef sent to template engine..
          code: token,
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch((err) => {
        console.log(err);
      });
    return 'email with token sended';
  }

  public async changePassword(changePasswordDto: ChangePasswordTokenDto) {
    const verify = await this.jwtService.verifyAsync(changePasswordDto.token);
    if (!verify) return 'invalid token';
    const user = await this.usersModel.findOne({ _id: verify.id });
    const plainToHash = await hash(changePasswordDto.new_password, 10);
    user.password = plainToHash;
    await user.save();
    return 'password changed';
  }
}

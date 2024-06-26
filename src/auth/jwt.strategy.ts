import { ConfigService } from '@nestjs/config';
// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CustomException } from 'src/common/exceptions/custom.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: {
    userId: string;
    email: string;
    iat: number;
  }): Promise<UserDocument> {
    const user = await this.userModel.findById(payload.userId);
    if (!user) {
      throw new CustomException('该用户不存在');
    }
    // 检查是否修改过密码
    if (user.changedPasswordAfter(payload.iat)) {
      throw new CustomException('用户密码已经修改，请重新登录');
    }
    return user;
  }
}

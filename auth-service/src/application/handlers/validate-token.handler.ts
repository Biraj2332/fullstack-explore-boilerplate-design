import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ValidateTokenQuery } from '../queries/validate-token.query';

@QueryHandler(ValidateTokenQuery)
export class ValidateTokenHandler implements IQueryHandler<ValidateTokenQuery, any> {
  constructor(private readonly jwtService: JwtService) {}

  execute(query: ValidateTokenQuery): any {
    try {
      return this.jwtService.verify(query.token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      return null;
    }
  }
}

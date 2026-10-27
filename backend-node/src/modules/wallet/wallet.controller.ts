import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

@UseGuards(AuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('balance')
  balance(@CurrentUser() user: AuthUser) {
    return this.wallet.getBalance(user.user_id);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: AuthUser, @Query() q: Record<string, string>) {
    return this.wallet.listTransactions(user.user_id, q);
  }

  @Post('fund/initialize')
  @HttpCode(200)
  fundInit(@CurrentUser() user: AuthUser, @Query('amount') amount: string) {
    return this.wallet.fundInitialize(user.user_id, Number(amount));
  }

  @Post('fund/verify/:reference')
  @HttpCode(200)
  fundVerify(@CurrentUser() user: AuthUser, @Param('reference') reference: string) {
    return this.wallet.fundVerify(user.user_id, reference);
  }

  @Post('fund')
  @HttpCode(200)
  fundLegacy(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.wallet.fundLegacy(user.user_id, user.role, body);
  }

  @Post('transfer')
  @HttpCode(200)
  transfer(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.wallet.transfer(user.user_id, body);
  }

  @Get('banks')
  banks() {
    return this.wallet.listBanks();
  }

  @Get('resolve-account')
  resolve(
    @Query('account_number') accountNumber: string,
    @Query('bank_code') bankCode: string,
  ) {
    return this.wallet.resolveAccount(accountNumber, bankCode);
  }

  @Get('bank-accounts')
  listBankAccounts(@CurrentUser() user: AuthUser) {
    return this.wallet.listBankAccounts(user.user_id);
  }

  @Post('bank-accounts')
  @HttpCode(200)
  addBankAccount(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.wallet.addBankAccount(user.user_id, body);
  }

  @Delete('bank-accounts/:accountId')
  deleteBankAccount(
    @CurrentUser() user: AuthUser,
    @Param('accountId') accountId: string,
  ) {
    return this.wallet.deleteBankAccount(user.user_id, accountId);
  }

  @Patch('bank-accounts/:accountId/default')
  setDefault(
    @CurrentUser() user: AuthUser,
    @Param('accountId') accountId: string,
  ) {
    return this.wallet.setDefaultBankAccount(user.user_id, accountId);
  }

  @Post('withdraw')
  @HttpCode(200)
  withdraw(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.wallet.withdraw(user.user_id, body);
  }
}

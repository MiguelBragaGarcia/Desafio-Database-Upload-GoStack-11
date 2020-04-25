import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepository = getRepository(Transaction);
    const transactionExists = await transactionRepository.findOne({
      where: { id },
    });

    if (!transactionExists) {
      throw new AppError('Transaction ID nor found', 400);
    }

    await transactionRepository.remove(transactionExists);
  }
}

export default DeleteTransactionService;

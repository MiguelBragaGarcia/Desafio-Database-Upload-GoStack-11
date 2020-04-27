import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const checkFounds = new TransactionRepository();
    const balance = await checkFounds.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Insuficient Founds', 400);
    }

    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    let categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryExists) {
      categoryExists = await categoryRepository.save({ title: category });
    }

    const createTransaction = await transactionRepository.create({
      title,
      value,
      type,
      category: categoryExists,
    });

    const transaction = await transactionRepository.save(createTransaction);

    return transaction;
  }
}

export default CreateTransactionService;

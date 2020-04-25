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

    const categoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    // Se a categoria existir para evitar duplicação
    if (categoryExists) {
      const transaction = transactionRepository.create({
        title,
        value,
        type,
      });

      transaction.category = categoryExists.id;

      await transactionRepository.save(transaction);

      return transaction;
    }

    const createdCategory = categoryRepository.create({
      title: category,
    });

    const teste = await categoryRepository.save(createdCategory);

    const createTransaction = transactionRepository.create({
      title,
      value,
      type,
    });

    createTransaction.category = teste.id;

    await transactionRepository.save(createTransaction);

    return createTransaction;
  }
}

export default CreateTransactionService;

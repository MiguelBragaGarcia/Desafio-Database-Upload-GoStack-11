import fs from 'fs';
import parse from 'csv-parse/lib/sync';
import { getRepository, getCustomRepository, In } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(path: string): Promise<Transaction[]> {
    const file = fs.readFileSync(path);
    const transactions: RequestDTO[] = await parse(file, {
      columns: true,
      delimiter: ', ',
      skip_lines_with_empty_values: true,
    });

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    // Verifying the categories to create or get
    const categoriesFromInputs = transactions.map(
      transaction => transaction.category,
    );
    const existentCategories = await categoriesRepository.find({
      where: { title: In(categoriesFromInputs) },
    });
    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const addCategories = categoriesFromInputs
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategories.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    // Persisting the transactions
    const inputedTransactions = transactionRepository.create(
      transactions.map(({ category, ...transaction }: RequestDTO) => ({
        ...transaction,
        category_id: this.returnCategoryId(
          allCategories.find(({ title }) => title === category),
        ),
      })),
    );

    await transactionRepository.save(inputedTransactions);

    // This method has a very high CPU cost and time of execution
    // for (const transaction of transactions) {
    //   // eslint-disable-next-line no-await-in-loop
    //   const createdTransaction = await createTransaction.execute(transaction);
    //   inputedTransactions.push(createdTransaction);
    // }

    await fs.promises.unlink(path);

    return inputedTransactions;
  }

  // TODO: Find a way to remove this warning
  private returnCategoryId({ id }: any): string {
    return id;
  }
}

export default ImportTransactionsService;

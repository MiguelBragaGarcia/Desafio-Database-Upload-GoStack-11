// Código feito por mim
// Erro: Ao inserir no banco de dados os dados do csv acaba ou duplicando ou faltando algumas linhas

// import { getRepository } from 'typeorm';
// import csvParse from 'csv-parse';
// import fs from 'fs';

// import AppError from '../errors/AppError';

// import Category from '../models/Category';
// import Transaction from '../models/Transaction';

// interface CSVTransaction {
//   title: string;
//   type: 'income' | 'outcome';
//   value: number;
//   category: string;
// }

// async function loadCSV(filePath: string): Promise<CSVTransaction[]> {
//   const readCSVStream = fs.createReadStream(filePath);

//   const parseStream = csvParse({
//     from_line: 2,
//     ltrim: true,
//     rtrim: true,
//   });

//   const parseCSV = readCSVStream.pipe(parseStream);

//   const transctions: CSVTransaction[] = [];

//   parseCSV.on('data', line => {
//     const [title, value, type, category] = line.map(data => data.trim());

//     if (!title || !type || !value || !category) {
//       return;
//     }
//     transctions.push({ title, type, value, category });
//   });

//   await new Promise(resolve => {
//     parseCSV.on('end', resolve);
//   });

//   return transctions;
// }

// class ImportTransactionsService {
//   async execute(filePath: string): Promise<Transaction[]> {
//     const data = await loadCSV(filePath);
//     const categoryRepository = getRepository(Category);
//     const transactionRepository = getRepository(Transaction);

//     const formattedTransactions: Transaction[] = [];

//     data.forEach(async transaction => {
//       const existCategory = await categoryRepository.findOne({
//         where: { title: transaction.title },
//       });
//       console.log(transaction.title);
//       if (existCategory) {
//         const createTransaction = transactionRepository.create({
//           title: transaction.title,
//           type: transaction.type,
//           value: transaction.value,
//         });

//         createTransaction.category = existCategory.id;
//         await transactionRepository.save(createTransaction);
//       }

//       const createCategory = categoryRepository.create({
//         title: transaction.category,
//       });
//       const saveCategory = await categoryRepository.save(createCategory);

//       const createTransaction = transactionRepository.create({
//         title: transaction.title,
//         type: transaction.type,
//         value: transaction.value,
//       });

//       createTransaction.category = saveCategory.id;
//       const saveTransaction = await transactionRepository.save(
//         createTransaction,
//       );

//       formattedTransactions.push(saveTransaction);
//     });

//     return formattedTransactions;
//   }
// }

// Código pego na internet e adaptado a situação
// Funciona bem mas não passa no teste falando erro ao fazer a criação passando uma função como argumento Linha 162

// export default ImportTransactionsService;

// import { getCustomRepository, getRepository, In } from 'typeorm';
// import csvParse from 'csv-parse';
// import fs from 'fs';
// import Transaction from '../models/Transaction';
// import Category from '../models/Category';
// import TransactionRepository from '../repositories/TransactionsRepository';

// interface CSVTransection {
//   title: string;
//   type: 'income' | 'outcome';
//   value: number;
//   category: string;
// }
// class ImportTransactionsService {
//   async execute(filePath: string): Promise<Transaction[]> {
//     const transactionRepository = getCustomRepository(TransactionRepository);
//     const categoriesRepository = getRepository(Category);
//     const contactsReadStream = fs.createReadStream(filePath);

//     const parsers = csvParse({
//       from_line: 2,
//     });

//     const parseCSV = contactsReadStream.pipe(parsers);

//     const transactions: CSVTransection[] = [];
//     const categories: string[] = [];

//     parseCSV.on('data', async line => {
//       const [title, value, type, category] = line.map((cell: string) =>
//         cell.trim(),
//       );

//       if (!title || !type || !value) return;

//       categories.push(category);
//       transactions.push({ title, type, value, category });
//     });
//     await new Promise(resolve => parseCSV.on('end', resolve));

//     const existentCategories = await categoriesRepository.find({
//       where: {
//         title: In(categories),
//       },
//     });

//     const existentCategoriesTitles = existentCategories.map(
//       (category: Category) => category.title,
//     );

//     const addCategoryTitles = categories
//       .filter(category => !existentCategoriesTitles.includes(category))
//       .filter((value, index, self) => self.indexOf(value) === index);

//     const newCategories = categoriesRepository.create(
//       addCategoryTitles.map(title => ({
//         title,
//       })),
//     );
//     await categoriesRepository.save(newCategories);
//     const finalCategories = [...newCategories, ...existentCategories];
//     const createdTransactions = transactionRepository.create(
//       transactions.map(transaction => ({
//         title: transaction.title,
//         type: transaction.type,
//         value: transaction.value,
//         category: finalCategories.find(
//           category => category.title === transaction.category,
//         ),
//       })),
//     );
//     await transactionRepository.save(createdTransactions);
//     await fs.promises.unlink(filePath);
//     return createdTransactions;
//   }
// }

// export default ImportTransactionsService;

// Outro código pego na internet e adaptado
// Erro no multer por algum motivo está sendo excluído ou nem é feito o upload e ele não consegue encontrar o arquivo.

import parse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import upload from '../config/multerConfig';
import AppError from '../errors/AppError';

interface Request {
  csvFile: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  private getTransactionsFromCSV(
    csvFile: string,
  ): Promise<Array<TransactionDTO>> {
    const filePath = path.resolve(upload.directory, csvFile);

    const csvReadStream = fs.createReadStream(filePath);

    const parsers = parse({ delimiter: ', ', from_line: 2 });

    const parsed = csvReadStream.pipe(parsers);

    fs.unlink(filePath, error => {
      if (error) throw error;
      // eslint-disable-next-line no-console
      console.log(`${csvFile} was deleted.`);
    });

    return new Promise((resolve, reject) => {
      const transactions: Array<TransactionDTO> = [];
      parsed
        .on('data', line => {
          const [title, type, value, category] = line;

          transactions.push({
            title,
            type,
            value,
            category,
          });
        })
        .on('error', () => {
          reject(new AppError('Error to read from csv file', 500));
        })
        .on('end', () => {
          resolve(transactions);
        });
    });
  }

  async execute({ csvFile }: Request): Promise<Transaction[]> {
    try {
      const createTransaction = new CreateTransactionService();

      let transactionsParsed: TransactionDTO[] = [];

      transactionsParsed = await this.getTransactionsFromCSV(csvFile);

      const transactionsPersisted: Transaction[] = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const transaction of transactionsParsed) {
        // eslint-disable-next-line no-await-in-loop
        const transactionSaved = await createTransaction.execute(transaction);
        transactionsPersisted.push(transactionSaved);
      }

      return transactionsPersisted;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
      throw new AppError('Error to read and save transactions', 500);
    }
  }
}

export default ImportTransactionsService;

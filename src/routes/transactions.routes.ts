import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import multerConfig from '../config/multerConfig';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

const upload = multer(multerConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository.find({
    where: {},
    relations: ['category'],
  });
  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransactionService = new CreateTransactionService();
  const transaction = await createTransactionService.execute({
    title,
    value,
    type,
    category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  await new DeleteTransactionService().execute(id);

  return response.status(204).json();
});

transactionsRouter.post(
  '/import',
  upload.single('transaction'),
  async (request, response) => {
    const importTransactionsService = new ImportTransactionsService();

    const fileData = await importTransactionsService.execute(request.file.path);

    return response.json({ fileData });
  },
);

export default transactionsRouter;

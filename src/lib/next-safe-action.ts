import { createSafeActionClient } from 'next-safe-action';

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error('SAFE_ACTION_SERVER_ERROR', error);
    return error instanceof Error
      ? error.message
      : 'Erro interno ao executar a operação.';
  },
});
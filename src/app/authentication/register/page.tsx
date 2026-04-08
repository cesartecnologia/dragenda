import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/auth';

import SignUpForm from '../components/sign-up-form';

const RegisterPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/painel');
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <SignUpForm />
      </div>
    </div>
  );
};

export default RegisterPage;

import { redirect } from 'next/navigation';

import { getServerSession } from '@/lib/auth';

import SignUpForm from '../components/sign-up-form';

const RegisterPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect('/pos-login');
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <SignUpForm />
      </div>
    </div>
  );
};

export default RegisterPage;

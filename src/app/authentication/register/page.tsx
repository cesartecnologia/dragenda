import { redirect } from 'next/navigation';

import { getAuthenticatedRedirectPath, getServerSession } from '@/lib/auth';

import SignUpForm from '../components/sign-up-form';

const RegisterPage = async () => {
  const session = await getServerSession();

  if (session?.user) {
    redirect(getAuthenticatedRedirectPath(session));
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <SignUpForm />
      </div>
    </div>
  );
};

export default RegisterPage;

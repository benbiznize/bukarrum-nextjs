import LoginForm from '@/app/(admin)/app/login/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Studio admin</h1>
        <LoginForm />
      </div>
    </div>
  );
}
